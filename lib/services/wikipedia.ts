/**
 * Wikipedia API service for fetching author biographies
 * Integrates with Wikipedia's REST API and search API
 */

import { 
  AuthorBiography, 
  WikipediaResult, 
  WikipediaSearchResult, 
  WikipediaPageResult 
} from '../types/quote';

/**
 * Wikipedia API configuration
 */
const WIKIPEDIA_CONFIG = {
  BASE_URL: 'https://en.wikipedia.org',
  REST_API: '/api/rest_v1/page/summary',
  SEARCH_API: '/w/api.php',
  USER_AGENT: 'InteractiveQuoteJournal/1.0 (https://github.com/user/interactive-quote-journal)',
  TIMEOUT: 10000, // 10 seconds
} as const;

/**
 * Clean and format Wikipedia extract text
 * Removes Wikipedia markup and limits length
 */
function cleanWikipediaText(text: string, maxLength: number = 500): string {
  if (!text) return '';
  
  // Remove Wikipedia markup and formatting
  let cleaned = text
    .replace(/\([^)]*\)/g, '') // Remove parenthetical content
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  // Truncate if too long
  if (cleaned.length > maxLength) {
    const truncated = cleaned.substring(0, maxLength);
    const lastSentence = truncated.lastIndexOf('.');
    if (lastSentence > maxLength * 0.7) {
      cleaned = truncated.substring(0, lastSentence + 1);
    } else {
      cleaned = truncated + '...';
    }
  }
  
  return cleaned;
}

/**
 * Fetch author biography using Wikipedia REST API (primary method)
 * This provides clean, formatted summaries
 */
async function fetchAuthorSummary(authorName: string): Promise<WikipediaResult<AuthorBiography>> {
  try {
    const encodedName = encodeURIComponent(authorName.trim());
    const url = `${WIKIPEDIA_CONFIG.BASE_URL}${WIKIPEDIA_CONFIG.REST_API}/${encodedName}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), WIKIPEDIA_CONFIG.TIMEOUT);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': WIKIPEDIA_CONFIG.USER_AGENT,
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      if (response.status === 404) {
        return { success: false, error: 'Author not found' };
      }
      throw new Error(`Wikipedia API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.extract || data.extract.trim() === '') {
      return { success: false, error: 'No biography available' };
    }
    
    const biography: AuthorBiography = {
      name: data.title || authorName,
      summary: cleanWikipediaText(data.extract),
      url: data.content_urls?.desktop?.page,
      thumbnail: data.thumbnail?.source,
    };
    
    return { success: true, data: biography };
    
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { success: false, error: 'Request timeout' };
      }
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Unknown error occurred' };
  }
}

/**
 * Search for author using Wikipedia search API (fallback method)
 * Used when direct summary lookup fails
 */
async function searchAuthor(authorName: string): Promise<WikipediaResult<AuthorBiography>> {
  try {
    const encodedName = encodeURIComponent(authorName.trim());
    const searchParams = new URLSearchParams({
      action: 'query',
      list: 'search',
      srsearch: encodedName,
      format: 'json',
      origin: '*',
      srlimit: '1',
    });
    
    const searchUrl = `${WIKIPEDIA_CONFIG.BASE_URL}${WIKIPEDIA_CONFIG.SEARCH_API}?${searchParams}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), WIKIPEDIA_CONFIG.TIMEOUT);
    
    const searchResponse = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'User-Agent': WIKIPEDIA_CONFIG.USER_AGENT,
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!searchResponse.ok) {
      throw new Error(`Wikipedia search API error: ${searchResponse.status}`);
    }
    
    const searchData: WikipediaSearchResult = await searchResponse.json();
    
    if (!searchData.query?.search?.length) {
      return { success: false, error: 'Author not found' };
    }
    
    const firstResult = searchData.query.search[0];
    
    // Now fetch the page content using the found title
    const pageParams = new URLSearchParams({
      action: 'query',
      prop: 'extracts|pageimages',
      exintro: 'true',
      explaintext: 'true',
      exsectionformat: 'plain',
      piprop: 'thumbnail',
      pithumbsize: '200',
      titles: firstResult.title,
      format: 'json',
      origin: '*',
    });
    
    const pageUrl = `${WIKIPEDIA_CONFIG.BASE_URL}${WIKIPEDIA_CONFIG.SEARCH_API}?${pageParams}`;
    
    const pageResponse = await fetch(pageUrl, {
      method: 'GET',
      headers: {
        'User-Agent': WIKIPEDIA_CONFIG.USER_AGENT,
        'Accept': 'application/json',
      },
    });
    
    if (!pageResponse.ok) {
      throw new Error(`Wikipedia page API error: ${pageResponse.status}`);
    }
    
    const pageData: WikipediaPageResult = await pageResponse.json();
    const pages = pageData.query?.pages;
    
    if (!pages) {
      return { success: false, error: 'No page data available' };
    }
    
    const pageId = Object.keys(pages)[0];
    const page = pages[pageId];
    
    if (!page.extract || page.extract.trim() === '') {
      return { success: false, error: 'No biography available' };
    }
    
    const biography: AuthorBiography = {
      name: page.title || authorName,
      summary: cleanWikipediaText(page.extract),
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
      thumbnail: page.thumbnail?.source,
    };
    
    return { success: true, data: biography };
    
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { success: false, error: 'Request timeout' };
      }
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Unknown error occurred' };
  }
}

/**
 * Main function to fetch author biography
 * Tries REST API first, falls back to search API
 */
export async function getAuthorBiography(authorName: string): Promise<WikipediaResult<AuthorBiography>> {
  if (!authorName || authorName.trim() === '') {
    return { success: false, error: 'Author name is required' };
  }
  
  // Normalize author name (remove common prefixes/suffixes)
  const normalizedName = authorName
    .replace(/^(Dr\.|Mr\.|Mrs\.|Ms\.|Prof\.)\s+/i, '')
    .replace(/\s+(Jr\.|Sr\.|III|IV)$/i, '')
    .trim();
  
  if (normalizedName === '') {
    return { success: false, error: 'Invalid author name' };
  }
  
  // Try REST API first (cleaner, formatted summaries)
  const summaryResult = await fetchAuthorSummary(normalizedName);
  
  if (summaryResult.success) {
    return summaryResult;
  }
  
  // If REST API fails, try search API as fallback
  const searchResult = await searchAuthor(normalizedName);
  
  return searchResult;
}

/**
 * Check if Wikipedia service is available
 * Useful for error handling and graceful degradation
 */
export async function checkWikipediaAvailability(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${WIKIPEDIA_CONFIG.BASE_URL}/api/rest_v1/page/summary/Test`, {
      method: 'HEAD',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    // We expect a 404 for "Test" page, but service should be available
    return response.status === 404 || response.status === 200;
    
  } catch {
    return false;
  }
}