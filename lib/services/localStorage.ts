/**
 * Local Storage service for managing saved quotes in the Interactive Quote Journal
 * Provides persistent storage for user's favorite quotes using browser localStorage
 */

import { Quote, SavedQuote, JournalState, StorageResult } from '../types/quote';

const STORAGE_KEY = 'interactive-quote-journal-saved-quotes';

/**
 * Generate a unique ID for saved quotes
 */
function generateQuoteId(quote: Quote): string {
  // Create a simple hash from quote text and author for consistent IDs
  const text = `${quote.quote}-${quote.author}`;
  return btoa(text).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
}

/**
 * Safely parse JSON from localStorage with error handling
 */
function safeParseJSON<T>(jsonString: string | null, fallback: T): T {
  if (!jsonString) return fallback;
  
  try {
    const parsed = JSON.parse(jsonString);
    // Convert savedAt strings back to Date objects
    if (Array.isArray(parsed)) {
      return parsed.map((item: any) => ({
        ...item,
        savedAt: new Date(item.savedAt)
      })) as T;
    }
    return parsed;
  } catch (error) {
    console.warn('Failed to parse saved quotes from localStorage:', error);
    return fallback;
  }
}

/**
 * Check if localStorage is available and accessible
 */
function isStorageAvailable(): boolean {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get all saved quotes from localStorage
 */
export function getSavedQuotes(): StorageResult<SavedQuote[]> {
  if (!isStorageAvailable()) {
    return {
      success: false,
      error: 'Local storage is not available'
    };
  }

  try {
    const savedQuotesJson = localStorage.getItem(STORAGE_KEY);
    const savedQuotes = safeParseJSON<SavedQuote[]>(savedQuotesJson, []);
    
    return {
      success: true,
      data: savedQuotes
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to retrieve saved quotes: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Save a quote to localStorage
 */
export function saveQuote(quote: Quote): StorageResult<SavedQuote> {
  if (!isStorageAvailable()) {
    return {
      success: false,
      error: 'Local storage is not available'
    };
  }

  try {
    const currentQuotes = getSavedQuotes();
    if (!currentQuotes.success) {
      return {
        success: false,
        error: currentQuotes.error
      };
    }

    const quotes = currentQuotes.data || [];
    const quoteId = generateQuoteId(quote);
    
    // Check if quote is already saved
    const existingQuote = quotes.find(q => q.id === quoteId);
    if (existingQuote) {
      return {
        success: true,
        data: existingQuote
      };
    }

    // Create new saved quote
    const savedQuote: SavedQuote = {
      ...quote,
      id: quoteId,
      savedAt: new Date()
    };

    // Add to beginning of array (most recent first)
    const updatedQuotes = [savedQuote, ...quotes];
    
    // Check storage limits (keep max 100 quotes)
    const limitedQuotes = updatedQuotes.slice(0, 100);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedQuotes));
    
    return {
      success: true,
      data: savedQuote
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      return {
        success: false,
        error: 'Storage quota exceeded. Please remove some saved quotes.'
      };
    }
    
    return {
      success: false,
      error: `Failed to save quote: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Remove a quote from localStorage
 */
export function removeQuote(quoteId: string): StorageResult<boolean> {
  if (!isStorageAvailable()) {
    return {
      success: false,
      error: 'Local storage is not available'
    };
  }

  try {
    const currentQuotes = getSavedQuotes();
    if (!currentQuotes.success) {
      return {
        success: false,
        error: currentQuotes.error
      };
    }

    const quotes = currentQuotes.data || [];
    const filteredQuotes = quotes.filter(q => q.id !== quoteId);
    
    // Check if quote was actually removed
    const wasRemoved = filteredQuotes.length < quotes.length;
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredQuotes));
    
    return {
      success: true,
      data: wasRemoved
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to remove quote: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Check if a specific quote is saved
 */
export function isQuoteSaved(quote: Quote): StorageResult<boolean> {
  const currentQuotes = getSavedQuotes();
  if (!currentQuotes.success) {
    return {
      success: false,
      error: currentQuotes.error
    };
  }

  const quotes = currentQuotes.data || [];
  const quoteId = generateQuoteId(quote);
  const isSaved = quotes.some(q => q.id === quoteId);
  
  return {
    success: true,
    data: isSaved
  };
}

/**
 * Get journal state with quotes and metadata
 */
export function getJournalState(): StorageResult<JournalState> {
  const savedQuotes = getSavedQuotes();
  if (!savedQuotes.success) {
    return {
      success: false,
      error: savedQuotes.error
    };
  }

  const quotes = savedQuotes.data || [];
  
  return {
    success: true,
    data: {
      quotes,
      totalCount: quotes.length
    }
  };
}

/**
 * Clear all saved quotes (for testing or user preference)
 */
export function clearAllQuotes(): StorageResult<boolean> {
  if (!isStorageAvailable()) {
    return {
      success: false,
      error: 'Local storage is not available'
    };
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
    return {
      success: true,
      data: true
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to clear quotes: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}