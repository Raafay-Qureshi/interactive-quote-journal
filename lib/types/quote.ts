/**
 * Quote data model for the Interactive Quote Journal
 * Based on ZenQuotes API response format
 */
export interface Quote {
  quote: string;
  author: string;
}

/**
 * API response from ZenQuotes API
 * The API returns an array with a single quote object
 */
export interface ZenQuoteApiResponse {
  q: string; // quote text
  a: string; // author name
  h: string; // HTML formatted quote (optional)
}

/**
 * Loading states for quote fetching
 */
export type QuoteLoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Error types for quote operations
 */
export interface QuoteError {
  message: string;
  code?: string;
}

/**
 * Saved quote with additional metadata for journal functionality
 */
export interface SavedQuote extends Quote {
  id: string;
  savedAt: Date;
}

/**
 * Journal state for managing saved quotes
 */
export interface JournalState {
  quotes: SavedQuote[];
  totalCount: number;
}

/**
 * Local storage operations result
 */
export interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Author biography data from Wikipedia API
 */
export interface AuthorBiography {
  name: string;
  summary: string;
  url?: string;
  thumbnail?: string;
}

/**
 * Wikipedia search result structure
 */
export interface WikipediaSearchResult {
  query: {
    search: Array<{
      title: string;
      snippet: string;
      pageid: number;
    }>;
  };
}

/**
 * Wikipedia page summary result structure
 */
export interface WikipediaPageResult {
  query: {
    pages: {
      [key: string]: {
        title: string;
        extract: string;
        thumbnail?: {
          source: string;
        };
      };
    };
  };
}

/**
 * Author modal state management
 */
export interface AuthorModalState {
  isOpen: boolean;
  isLoading: boolean;
  biography: AuthorBiography | null;
  error: string | null;
}

/**
 * Wikipedia API service result
 */
export interface WikipediaResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Request payload for quote mood analysis
 */
export interface AnalyzeRequest {
  quote: string;
}

/**
 * Response payload for quote mood analysis
 */
export interface AnalyzeResponse {
  mood: string;
  color?: string;
}

/**
 * Error response for analyze endpoint
 */
export interface AnalyzeError {
  error: string;
}

/**
 * OpenRouter API response structure (OpenAI-compatible format)
 */
export interface OpenRouterApiResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * OpenRouter API request structure (OpenAI-compatible format)
 */
export interface OpenRouterApiRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
}

/**
 * Mood theme configuration for dynamic theming
 */
export interface MoodTheme {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  muted: string;
}

/**
 * Analysis state for quote mood analysis workflow
 */
export interface AnalysisState {
  isAnalyzing: boolean;
  currentMood: string | null;
  error: string | null;
  lastAnalyzedQuote: string | null;
}

/**
 * Supported mood types for theme system
 */
export type MoodType =
  | 'inspirational'
  | 'motivational'
  | 'reflective'
  | 'philosophical'
  | 'humorous'
  | 'melancholic'
  | 'optimistic'
  | 'contemplative'
  | 'wise'
  | 'uplifting'
  | 'default';

/**
 * Theme transition configuration
 */
export interface ThemeTransition {
  duration: number;
  easing: string;
}
import { ObjectId } from 'mongodb';

/**
 * A quote saved to the user's journal in the database.
 * Extends the base Quote type with database-specific fields.
 */
export interface JournalEntry extends Quote {
  _id?: ObjectId;
  savedAt: Date;
}