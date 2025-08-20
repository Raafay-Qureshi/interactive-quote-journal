import { NextRequest, NextResponse } from 'next/server';

// In-memory cache for quotes (in production, you'd use Redis or similar)
let quoteCache: Array<{ quote: string; author: string }> = [];
let lastFetchTime = 0;
const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours as recommended by ZenQuotes
const BULK_FETCH_SIZE = 50; // Fetch 50 quotes at once

// Fallback quotes in case API is unavailable
const FALLBACK_QUOTES = [
  { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { quote: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
  { quote: "Life is what happens to you while you're busy making other plans.", author: "John Lennon" },
  { quote: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { quote: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
  { quote: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { quote: "Don't let yesterday take up too much of today.", author: "Will Rogers" },
  { quote: "You learn more from failure than from success. Don't let it stop you. Failure builds character.", author: "Unknown" },
  { quote: "If you are working on something that you really care about, you don't have to be pushed. The vision pulls you.", author: "Steve Jobs" },
  { quote: "Experience is a hard teacher because she gives the test first, the lesson afterwards.", author: "Vernon Law" },
  { quote: "To live is the rarest thing in the world. Most people just exist.", author: "Oscar Wilde" },
  { quote: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { quote: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
  { quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { quote: "The purpose of our lives is to be happy.", author: "Dalai Lama" }
];

function getRandomFallbackQuote() {
  const randomIndex = Math.floor(Math.random() * FALLBACK_QUOTES.length);
  return FALLBACK_QUOTES[randomIndex];
}

function getRandomCachedQuote() {
  if (quoteCache.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * quoteCache.length);
  return quoteCache[randomIndex];
}

export async function GET(request: NextRequest) {
  try {
    const now = Date.now();
    
    // If we have cached quotes and they're still fresh, use them
    if (quoteCache.length > 0 && (now - lastFetchTime) < CACHE_DURATION) {
      const cachedQuote = getRandomCachedQuote();
      if (cachedQuote) {
        return NextResponse.json(cachedQuote, {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'X-Quote-Source': 'collection',
            'X-Cache-Size': quoteCache.length.toString(),
          },
        });
      }
    }

    // Try to fetch bulk quotes from ZenQuotes API to refresh cache
    try {
      const response = await fetch('https://zenquotes.io/api/quotes', {
        method: 'GET',
        headers: {
          'User-Agent': 'Interactive-Quote-Journal/1.0',
        },
        signal: AbortSignal.timeout(15000), // 15 second timeout for bulk fetch
      });

      if (response.status === 429) {
        // Rate limited - use cached quote or fallback
        const cachedQuote = getRandomCachedQuote();
        if (cachedQuote) {
          return NextResponse.json(cachedQuote, {
            status: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET',
              'Access-Control-Allow-Headers': 'Content-Type',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'X-Quote-Source': 'collection',
            },
          });
        }
        
        // No cache available, use fallback
        const fallbackQuote = getRandomFallbackQuote();
        return NextResponse.json(fallbackQuote, {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'X-Quote-Source': 'fallback-rate-limited',
          },
        });
      }

      if (!response.ok) {
        throw new Error(`ZenQuotes API responded with status: ${response.status}`);
      }

      const data = await response.json();
      
      // Validate response
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Invalid response format from ZenQuotes API');
      }

      // Transform all quotes to our expected format and update cache
      const transformedQuotes = data
        .filter(quote => quote.q && quote.a) // Filter out invalid quotes
        .map(quote => ({
          quote: quote.q,
          author: quote.a
        }));

      if (transformedQuotes.length === 0) {
        throw new Error('No valid quotes received from ZenQuotes API');
      }

      // Replace cache with fresh quotes
      quoteCache = transformedQuotes;
      lastFetchTime = now;

      // Return a random quote from the fresh cache
      const randomQuote = getRandomCachedQuote();
      if (!randomQuote) {
        throw new Error('Failed to get quote from fresh cache');
      }

      return NextResponse.json(randomQuote, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Quote-Source': 'zen-api',
          'X-Cache-Size': quoteCache.length.toString(),
        },
      });

    } catch (apiError) {
      // Try cached quote first
      const cachedQuote = getRandomCachedQuote();
      if (cachedQuote) {
        return NextResponse.json(cachedQuote, {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'X-Quote-Source': 'collection',
          },
        });
      }
      
      // Use fallback quote
      const fallbackQuote = getRandomFallbackQuote();
      return NextResponse.json(fallbackQuote, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Quote-Source': 'fallback-api-error',
        },
      });
    }

  } catch (error) {
    // Last resort - always return a fallback quote
    const fallbackQuote = getRandomFallbackQuote();
    return NextResponse.json(fallbackQuote, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Quote-Source': 'fallback-error',
      },
    });
  }
}

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}