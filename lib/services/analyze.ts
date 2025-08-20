import { AnalyzeRequest, AnalyzeResponse, AnalyzeError as AnalyzeErrorResponse } from '../types/quote';

/**
 * Custom error class for analyze-related errors
 */
export class QuoteAnalysisError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'QuoteAnalysisError';
  }
}

/**
 * Analyzes the mood of a quote using the secure serverless endpoint
 * 
 * @param quote - The quote text to analyze
 * @returns Promise<string> A promise that resolves to the mood string
 * @throws AnalyzeError When the request fails or returns invalid data
 */
export async function analyzeQuoteMood(quote: string): Promise<string> {
  if (!quote || typeof quote !== 'string' || quote.trim().length === 0) {
    throw new QuoteAnalysisError('Quote text is required for analysis');
  }

  if (quote.length > 1000) {
    throw new QuoteAnalysisError('Quote is too long for analysis (maximum 1000 characters)');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

  try {
    const requestBody: AnalyzeRequest = {
      quote: quote.trim()
    };

    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Handle different HTTP status codes
      if (response.status === 429) {
        throw new QuoteAnalysisError('Analysis temporarily unavailable. Please try again in a moment.');
      } else if (response.status >= 500) {
        throw new QuoteAnalysisError('Quote analysis is currently unavailable. Please try again later.');
      } else if (response.status === 400) {
        // Try to get specific error message from response
        try {
          const errorData: AnalyzeErrorResponse = await response.json();
          throw new QuoteAnalysisError(errorData.error || 'Invalid request for quote analysis.');
        } catch {
          throw new QuoteAnalysisError('Invalid request for quote analysis.');
        }
      } else {
        throw new QuoteAnalysisError('Unable to analyze quote. Please try again.');
      }
    }

    const data: AnalyzeResponse = await response.json();

    // Validate the response structure
    if (!data || typeof data !== 'object') {
      throw new QuoteAnalysisError('Received invalid response from analysis service.');
    }

    if (!data.mood || typeof data.mood !== 'string') {
      throw new QuoteAnalysisError('Analysis response is incomplete or malformed.');
    }

    // Return the validated mood
    return data.mood.trim().toLowerCase();

  } catch (error) {
    clearTimeout(timeoutId);

    // Handle different types of errors
    if (error instanceof QuoteAnalysisError) {
      // Re-throw our custom errors as-is
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new QuoteAnalysisError('Analysis is taking longer than expected. Using default theme.');
      }

      if (error.message.includes('fetch') || error.message.includes('network')) {
        throw new QuoteAnalysisError('Unable to analyze quote. Please check your connection.');
      }

      // For other known errors, wrap them
      throw new QuoteAnalysisError('An unexpected error occurred during analysis.', error);
    }

    // For unknown error types
    throw new QuoteAnalysisError('An unknown error occurred during quote analysis.');
  }
}

/**
 * Type guard to check if an error is an AnalyzeError
 */
export function isAnalyzeError(error: unknown): error is QuoteAnalysisError {
  return error instanceof QuoteAnalysisError;
}

/**
 * Maps AI-generated moods to predefined theme categories
 * Provides fallback mapping for unrecognized moods
 */
export function mapMoodToTheme(mood: string): string {
  const normalizedMood = mood.toLowerCase().trim();
  
  // Direct mappings for expected moods from the API
  const moodMap: Record<string, string> = {
    'inspirational': 'inspirational',
    'motivational': 'motivational',
    'reflective': 'reflective',
    'philosophical': 'philosophical',
    'humorous': 'humorous',
    'melancholic': 'melancholic',
    'optimistic': 'optimistic',
    'contemplative': 'contemplative',
    'wise': 'wise',
    'uplifting': 'uplifting',
    
    // Additional mappings for similar moods
    'thoughtful': 'reflective',
    'peaceful': 'contemplative',
    'energetic': 'motivational',
    'sad': 'melancholic',
    'happy': 'uplifting',
    'positive': 'optimistic',
    'encouraging': 'inspirational',
    'funny': 'humorous',
    'deep': 'philosophical',
    'spiritual': 'contemplative',
    'hopeful': 'optimistic',
    'empowering': 'motivational'
  };

  return moodMap[normalizedMood] || 'reflective'; // Default to reflective theme
}