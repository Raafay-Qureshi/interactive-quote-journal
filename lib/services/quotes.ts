import { Quote } from '../types/quote';

/**
 * Custom error class for quote-related errors
 */
export class QuoteError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'QuoteError';
  }
}

/**
 * Fetches a random quote from our internal API route
 * The API route proxies the request to ZenQuotes API to avoid CORS issues
 * 
 * @returns Promise<Quote> A promise that resolves to a Quote object
 * @throws QuoteError When the request fails or returns invalid data
 */
export async function fetchRandomQuote(): Promise<Quote> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const response = await fetch('/api/quotes', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Try to get error details from response
      let errorMessage = 'Failed to fetch quote from server';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // If we can't parse the error response, use the default message
      }

      if (response.status >= 500) {
        throw new QuoteError('The quote service is temporarily unavailable. Please try again later.');
      } else if (response.status === 404) {
        throw new QuoteError('Quote service not found. Please contact support.');
      } else {
        throw new QuoteError(errorMessage);
      }
    }

    const data = await response.json();

    // Validate the response structure
    if (!data || typeof data !== 'object') {
      throw new QuoteError('Received invalid data format from quote service.');
    }

    if (!data.quote || !data.author) {
      throw new QuoteError('Quote data is incomplete or malformed.');
    }

    if (typeof data.quote !== 'string' || typeof data.author !== 'string') {
      throw new QuoteError('Quote data contains invalid field types.');
    }

    // Return the validated quote
    return {
      quote: data.quote.trim(),
      author: data.author.trim(),
    };

  } catch (error) {
    clearTimeout(timeoutId);

    // Handle different types of errors
    if (error instanceof QuoteError) {
      // Re-throw our custom errors as-is
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new QuoteError('Request timed out. Please check your internet connection and try again.');
      }

      if (error.message.includes('fetch')) {
        throw new QuoteError('Unable to connect to the quote service. Please check your internet connection.');
      }

      // For other known errors, wrap them
      throw new QuoteError('An unexpected error occurred while fetching the quote.', error);
    }

    // For unknown error types
    throw new QuoteError('An unknown error occurred while fetching the quote.');
  }
}

/**
 * Type guard to check if an error is a QuoteError
 */
export function isQuoteError(error: unknown): error is QuoteError {
  return error instanceof QuoteError;
}