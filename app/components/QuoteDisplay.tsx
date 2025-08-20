'use client';

import { useState, useEffect } from 'react';
import { Quote, QuoteLoadingState, AnalysisState } from '../../lib/types/quote';
import { fetchRandomQuote, QuoteError } from '../../lib/services/quotes';
import { useQuoteSaveState } from '../../lib/hooks/useQuoteJournal';
import { useAuthorModal, useAuthorClick } from '../../lib/hooks/useAuthorModal';
import Button from './ui/Button';
import Card from './ui/Card';
import AuthorModal from './AuthorModal';

interface QuoteDisplayProps {
  className?: string;
}

export default function QuoteDisplay({ className = '' }: QuoteDisplayProps) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loadingState, setLoadingState] = useState<QuoteLoadingState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [quoteSource, setQuoteSource] = useState<string>('api');
  
  // Analysis state management
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    isAnalyzing: false,
    currentMood: null,
    error: null,
    lastAnalyzedQuote: null
  });
  
  // Use custom hook for quote save state management
  const { isSaved, savingState, toggleSave } = useQuoteSaveState(quote);
  
  // Use custom hooks for author modal functionality
  const { modalState, openModal, closeModal } = useAuthorModal();
  const { handleAuthorClick } = useAuthorClick(openModal);

  const loadQuote = async () => {
    setLoadingState('loading');
    setError(null);
    
    // Reset analysis state when loading new quote
    setAnalysisState({
      isAnalyzing: false,
      currentMood: null,
      error: null,
      lastAnalyzedQuote: null
    });
    
    // Reset theme to default
    applyTheme('default');

    try {
      const response = await fetch('/api/quotes', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch quote from server');
      }

      const newQuote = await response.json();
      const source = response.headers.get('X-Quote-Source') || 'api';
      
      setQuote(newQuote);
      setQuoteSource(source);
      setLoadingState('success');
    } catch (err) {
      console.error('Failed to fetch quote:', err);
      
      if (err instanceof QuoteError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred while loading the quote.');
      }
      
      setLoadingState('error');
    }
  };

  const analyzeQuote = async () => {
    if (!quote || analysisState.isAnalyzing) return;
    
    // Don't re-analyze the same quote
    if (analysisState.lastAnalyzedQuote === quote.quote) return;

    setAnalysisState(prev => ({
      ...prev,
      isAnalyzing: true,
      error: null
    }));

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quote: quote.quote }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze quote');
      }

      const data = await response.json();
      const mood = data.mood;
      const color = data.color || '#6366f1';
      
      setAnalysisState({
        isAnalyzing: false,
        currentMood: mood,
        error: null,
        lastAnalyzedQuote: quote.quote
      });
      
      // Apply the AI-generated color theme
      applyDynamicTheme(mood, color);
      
    } catch (err) {
      console.error('Failed to analyze quote:', err);
      
      let errorMessage = 'Unable to analyze quote mood.';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setAnalysisState({
        isAnalyzing: false,
        currentMood: null,
        error: errorMessage,
        lastAnalyzedQuote: quote.quote
      });
      
      // Apply default theme on error
      applyTheme('default');
    }
  };

  const applyDynamicTheme = (mood: string, color: string) => {
    const root = document.documentElement;
    
    // Remove all existing theme classes
    const themeClasses = [
      'theme-inspirational', 'theme-motivational', 'theme-reflective',
      'theme-philosophical', 'theme-humorous', 'theme-melancholic',
      'theme-optimistic', 'theme-contemplative', 'theme-wise', 'theme-uplifting'
    ];
    
    themeClasses.forEach(cls => root.classList.remove(cls));
    
    // Generate complementary colors from the AI-provided color
    const { primary, secondary, accent, background, surface, muted } = generateColorPalette(color);
    
    // Apply dynamic CSS variables
    root.style.setProperty('--zen-primary', primary);
    root.style.setProperty('--zen-secondary', secondary);
    root.style.setProperty('--zen-accent', accent);
    root.style.setProperty('--zen-accent-hover', darkenColor(accent, 10));
    root.style.setProperty('--zen-background', background);
    root.style.setProperty('--zen-surface', surface);
    root.style.setProperty('--zen-surface-elevated', lightenColor(surface, 3));
    root.style.setProperty('--zen-muted', muted);
    root.style.setProperty('--zen-border', lightenColor(accent, 40));
    root.style.setProperty('--zen-shadow', `${hexToRgba(accent, 0.08)}`);
    root.style.setProperty('--zen-shadow-lg', `${hexToRgba(accent, 0.12)}`);
    
    // Add transition class for smooth theme changes
    root.classList.add('theme-transition');
    
    // Remove transition class after animation completes
    setTimeout(() => {
      root.classList.remove('theme-transition');
    }, 600);
  };

  const applyTheme = (theme: string) => {
    const root = document.documentElement;
    
    // Remove all existing theme classes and custom properties
    const themeClasses = [
      'theme-inspirational', 'theme-motivational', 'theme-reflective',
      'theme-philosophical', 'theme-humorous', 'theme-melancholic',
      'theme-optimistic', 'theme-contemplative', 'theme-wise', 'theme-uplifting'
    ];
    
    themeClasses.forEach(cls => root.classList.remove(cls));
    
    // Reset to default CSS variables by removing custom properties
    const customProps = [
      '--zen-primary', '--zen-secondary', '--zen-accent', '--zen-accent-hover',
      '--zen-background', '--zen-surface', '--zen-surface-elevated', '--zen-muted',
      '--zen-border', '--zen-shadow', '--zen-shadow-lg'
    ];
    
    customProps.forEach(prop => root.style.removeProperty(prop));
    
    // Add transition class for smooth theme changes
    root.classList.add('theme-transition');
    
    // Remove transition class after animation completes
    setTimeout(() => {
      root.classList.remove('theme-transition');
    }, 600);
  };

  // Helper functions for color manipulation
  const generateColorPalette = (baseColor: string) => {
    const primary = darkenColor(baseColor, 30);
    const secondary = darkenColor(baseColor, 20);
    const accent = baseColor;
    const background = lightenColor(baseColor, 45);
    const surface = '#ffffff';
    const muted = darkenColor(baseColor, 15);
    
    return { primary, secondary, accent, background, surface, muted };
  };

  const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const lightenColor = (hex: string, percent: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    const newR = Math.min(255, Math.round(r + (255 - r) * (percent / 100)));
    const newG = Math.min(255, Math.round(g + (255 - g) * (percent / 100)));
    const newB = Math.min(255, Math.round(b + (255 - b) * (percent / 100)));
    
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  };

  const darkenColor = (hex: string, percent: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    const newR = Math.max(0, Math.round(r * (1 - percent / 100)));
    const newG = Math.max(0, Math.round(g * (1 - percent / 100)));
    const newB = Math.max(0, Math.round(b * (1 - percent / 100)));
    
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  };

  useEffect(() => {
    loadQuote();
  }, []);

  // Cleanup effect to reset theme on unmount
  useEffect(() => {
    return () => {
      // Reset to default theme when component unmounts
      applyTheme('default');
    };
  }, []);

  const handleRetry = () => {
    loadQuote();
  };

  const handleToggleFavorite = async () => {
    await toggleSave();
  };

  if (loadingState === 'loading') {
    return (
      <div className={`text-center ${className}`}>
        <Card variant="elevated" padding="lg" className="max-w-4xl mx-auto">
          {/* Loading skeleton with Zen Garden styling */}
          <div className="space-y-6">
            <div className="zen-shimmer h-8 sm:h-10 md:h-12 rounded-lg mx-auto max-w-3xl"></div>
            <div className="zen-shimmer h-6 sm:h-7 md:h-8 rounded-lg mx-auto max-w-2xl"></div>
            <div className="zen-shimmer h-6 sm:h-7 md:h-8 rounded-lg mx-auto max-w-xl"></div>
            
            {/* Author skeleton */}
            <div className="pt-4">
              <div className="zen-shimmer h-5 sm:h-6 rounded-lg mx-auto max-w-xs"></div>
            </div>
          </div>
          
          {/* Loading message */}
          <div className="mt-8 flex items-center justify-center space-x-2">
            <div className="zen-pulse w-2 h-2 bg-zen-accent rounded-full"></div>
            <div className="zen-pulse w-2 h-2 bg-zen-accent rounded-full" style={{ animationDelay: '0.2s' }}></div>
            <div className="zen-pulse w-2 h-2 bg-zen-accent rounded-full" style={{ animationDelay: '0.4s' }}></div>
          </div>
          <p className="text-zen-muted mt-4 text-sm sm:text-base font-light">
            Loading your daily dose of wisdom...
          </p>
        </Card>
      </div>
    );
  }

  if (loadingState === 'error') {
    return (
      <div className={`text-center ${className}`}>
        <Card variant="outlined" padding="lg" className="max-w-2xl mx-auto border-zen-error/20 bg-zen-error/5">
          {/* Error icon */}
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-zen-error/10 rounded-full flex items-center justify-center">
              <svg 
                className="w-6 h-6 sm:w-8 sm:h-8 text-zen-error" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
                />
              </svg>
            </div>
          </div>
          
          <h3 className="text-lg sm:text-xl font-medium text-zen-primary mb-3">
            Unable to Load Quote
          </h3>
          <p className="text-zen-secondary mb-6 text-sm sm:text-base leading-relaxed">
            {error}
          </p>
          
          <Button
            onClick={handleRetry}
            variant="primary"
            size="md"
            className="min-w-[120px]"
          >
            Try Again
          </Button>
        </Card>
        
        {/* Author Modal */}
        <AuthorModal
          isOpen={modalState.isOpen}
          isLoading={modalState.isLoading}
          biography={modalState.biography}
          error={modalState.error}
          authorName={quote?.author || ''}
          onClose={closeModal}
        />
      </div>
    );
  }

  if (loadingState === 'success' && quote) {
    const getSourceIndicator = () => {
      switch (quoteSource) {
        case 'cache':
          return {
            icon: '💾',
            text: 'From our collection',
            color: 'text-zen-muted',
            explanation: 'Recently fetched quotes saved in our system'
          };
        case 'cache-rate-limited':
          return {
            icon: '💾',
            text: 'From our collection',
            color: 'text-zen-warning',
            explanation: 'ZenQuotes API is rate limited, showing saved quotes from our system'
          };
        case 'cache-api-error':
          return {
            icon: '💾',
            text: 'From our collection',
            color: 'text-zen-muted',
            explanation: 'ZenQuotes API is temporarily unavailable, showing saved quotes from our system'
          };
        case 'fallback-rate-limited':
          return {
            icon: '📚',
            text: 'Curated quote',
            color: 'text-zen-warning',
            explanation: 'ZenQuotes API is rate limited, showing curated quotes from our library'
          };
        case 'fallback-api-error':
        case 'fallback-error':
          return {
            icon: '📚',
            text: 'Curated quote',
            color: 'text-zen-muted',
            explanation: 'ZenQuotes API is temporarily unavailable, showing curated quotes from our library'
          };
        case 'api':
        default:
          return {
            icon: '🌐',
            text: 'Fresh from ZenQuotes',
            color: 'text-zen-accent',
            explanation: 'Live quote from ZenQuotes API'
          };
      }
    };

    const sourceInfo = getSourceIndicator();

    return (
      <div className={`text-center ${className}`}>
        <Card variant="elevated" padding="lg" className="max-w-4xl mx-auto">
          {/* Quote content */}
          <div className="space-y-8">
            {/* Main quote */}
            <blockquote className="relative">
              {/* Opening quote mark */}
              <div className="absolute -top-4 -left-2 sm:-left-4 text-4xl sm:text-6xl md:text-7xl text-zen-accent/20 font-serif leading-none select-none" aria-hidden="true">
                "
              </div>
              
              <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-light text-zen-primary leading-relaxed tracking-wide px-4 sm:px-8 md:px-12 relative z-10">
                {quote.quote}
              </p>
              
              {/* Closing quote mark */}
              <div className="absolute -bottom-8 -right-2 sm:-right-4 text-4xl sm:text-6xl md:text-7xl text-zen-accent/20 font-serif leading-none select-none" aria-hidden="true">
                "
              </div>
            </blockquote>
            
            {/* Author attribution */}
            <div className="pt-4">
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-zen-accent to-transparent mx-auto mb-4"></div>
              <cite className="text-base sm:text-lg md:text-xl text-zen-secondary font-medium not-italic">
                — <button
                  onClick={(e) => handleAuthorClick(e, quote.author)}
                  onKeyDown={(e) => handleAuthorClick(e, quote.author)}
                  className="text-zen-secondary hover:text-zen-accent focus:text-zen-accent underline decoration-dotted underline-offset-4 hover:decoration-solid focus:decoration-solid transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-zen-accent focus:ring-offset-2 focus:ring-offset-zen-surface rounded-sm px-1 py-0.5 -mx-1 -my-0.5"
                  aria-label={`Learn more about ${quote.author}`}
                  title={`Click to learn more about ${quote.author}`}
                >
                  {quote.author}
                </button>
                <span className="text-xs sm:text-sm text-zen-muted font-light ml-2 opacity-75">
                  (click here to learn more about me)
                </span>
              </cite>
            </div>

            {/* Source indicator */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center space-x-2 text-xs sm:text-sm">
                <span className="text-lg" aria-hidden="true">{sourceInfo.icon}</span>
                <span className={`${sourceInfo.color} font-medium`}>
                  {sourceInfo.text}
                </span>
              </div>
              <p className="text-xs text-zen-muted font-light max-w-md mx-auto leading-relaxed">
                {sourceInfo.explanation}
              </p>
            </div>
            
            {/* Mood indicator */}
            {analysisState.currentMood && (
              <div className="text-center mb-4">
                <div className="inline-flex items-center space-x-2 px-4 py-2 bg-zen-accent/10 rounded-full">
                  <span className="mood-indicator text-lg" aria-hidden="true">🎨</span>
                  <span className="text-sm font-medium text-zen-accent capitalize">
                    {analysisState.currentMood} vibe
                  </span>
                </div>
              </div>
            )}

            {/* Analysis error display */}
            {analysisState.error && (
              <div className="text-center mb-4">
                <div className="inline-flex items-center space-x-2 px-4 py-2 bg-zen-error/10 rounded-full">
                  <span className="text-lg" aria-hidden="true">⚠️</span>
                  <span className="text-sm text-zen-error">
                    {analysisState.error}
                  </span>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              {/* Favorite button */}
              <Button
                onClick={handleToggleFavorite}
                variant={isSaved ? "primary" : "secondary"}
                size="md"
                className="min-w-[140px] group"
                disabled={savingState !== 'idle'}
                aria-label={isSaved ? "Remove from favorites" : "Add to favorites"}
              >
                <span className="mr-2 transition-transform duration-200 group-hover:scale-110">
                  {savingState === 'saving' ? '⏳' : savingState === 'removing' ? '⏳' : isSaved ? '❤️' : '🤍'}
                </span>
                <span className="group-hover:tracking-wide transition-all duration-200">
                  {savingState === 'saving' ? 'Saving...' :
                   savingState === 'removing' ? 'Removing...' :
                   isSaved ? 'Saved' : 'Save Quote'}
                </span>
              </Button>

              {/* Analyze Quote button */}
              <Button
                onClick={analyzeQuote}
                variant="secondary"
                size="md"
                className="min-w-[140px] group"
                disabled={analysisState.isAnalyzing || analysisState.lastAnalyzedQuote === quote.quote}
                aria-label="Analyze quote mood and change theme"
                title={analysisState.lastAnalyzedQuote === quote.quote ? "Quote already analyzed" : "Analyze quote mood"}
              >
                <span className="mr-2 transition-transform duration-200 group-hover:scale-110">
                  {analysisState.isAnalyzing ? '🔄' : analysisState.currentMood ? '🎨' : '🔍'}
                </span>
                <span className="group-hover:tracking-wide transition-all duration-200">
                  {analysisState.isAnalyzing ? 'Analyzing...' :
                   analysisState.lastAnalyzedQuote === quote.quote ? 'Analyzed' :
                   'Analyze Quote'}
                </span>
              </Button>

              {/* New quote button */}
              <Button
                onClick={handleRetry}
                variant="secondary"
                size="md"
                className="min-w-[140px] group"
              >
                <span className="mr-2">✨</span>
                <span className="group-hover:tracking-wide transition-all duration-200">
                  New Quote
                </span>
              </Button>
            </div>
          </div>
        </Card>
        
        {/* Author Modal */}
        <AuthorModal
          isOpen={modalState.isOpen}
          isLoading={modalState.isLoading}
          biography={modalState.biography}
          error={modalState.error}
          authorName={quote?.author || ''}
          onClose={closeModal}
        />
      </div>
    );
  }

  // Fallback state (should not normally be reached)
  return (
    <div className={`text-center ${className}`}>
      <Card variant="default" padding="lg" className="max-w-2xl mx-auto">
        <p className="text-zen-muted text-base sm:text-lg font-light">
          Ready to load your quote...
        </p>
      </Card>
      
      {/* Author Modal */}
      <AuthorModal
        isOpen={modalState.isOpen}
        isLoading={modalState.isLoading}
        biography={modalState.biography}
        error={modalState.error}
        authorName={quote?.author || ''}
        onClose={closeModal}
      />
    </div>
  );
}