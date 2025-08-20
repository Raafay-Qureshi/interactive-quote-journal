'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuoteJournal } from '../../lib/hooks/useQuoteJournal';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

export default function JournalPage() {
  const {
    journal,
    isLoading: loading,
    error,
    removeQuoteFromJournal,
    refreshJournal
  } = useQuoteJournal();
  
  const [removingQuoteId, setRemovingQuoteId] = useState<string | null>(null);

  const handleRemoveQuote = async (quoteId: string) => {
    setRemovingQuoteId(quoteId);
    await removeQuoteFromJournal(quoteId);
    setRemovingQuoteId(null);
  };

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zen-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-light text-zen-primary mb-4">
              Your Quote Journal
            </h1>
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-zen-accent to-transparent mx-auto"></div>
          </div>

          {/* Loading skeleton */}
          <div className="max-w-4xl mx-auto space-y-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} variant="elevated" padding="lg">
                <div className="space-y-4">
                  <div className="zen-shimmer h-6 rounded-lg max-w-3xl"></div>
                  <div className="zen-shimmer h-6 rounded-lg max-w-2xl"></div>
                  <div className="zen-shimmer h-4 rounded-lg max-w-xs"></div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zen-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-light text-zen-primary mb-4">
            Your Quote Journal
          </h1>
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-zen-accent to-transparent mx-auto mb-6"></div>
          
          {/* Navigation */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link href="/">
              <Button variant="secondary" size="md" className="min-w-[140px]">
                <span className="mr-2">🏠</span>
                Back to Home
              </Button>
            </Link>
            
            {journal.length > 0 && (
              <div className="text-zen-muted text-sm">
                {journal.length} saved quote{journal.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8">
            <Card variant="outlined" padding="lg" className="border-zen-error/20 bg-zen-error/5 text-center">
              <p className="text-zen-error mb-4">{error}</p>
              <Button onClick={refreshJournal} variant="secondary" size="sm">
                Try Again
              </Button>
            </Card>
          </div>
        )}

        {/* Empty state */}
        {journal.length === 0 && !error && (
          <div className="max-w-2xl mx-auto text-center">
            <Card variant="elevated" padding="lg">
              <div className="py-12">
                <div className="text-6xl mb-6">📚</div>
                <h2 className="text-xl sm:text-2xl font-light text-zen-primary mb-4">
                  Your journal is empty
                </h2>
                <p className="text-zen-secondary mb-8 leading-relaxed">
                  Start building your collection of inspiring quotes by saving your favorites from the main page.
                </p>
                <Link href="/">
                  <Button variant="primary" size="md">
                    <span className="mr-2">✨</span>
                    Discover Quotes
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        )}

        {/* Quotes list */}
        {journal.length > 0 && (
          <div className="max-w-4xl mx-auto space-y-6">
            {journal.map((savedQuote) => (
              <Card key={savedQuote._id?.toString()} variant="elevated" padding="lg" className="group">
                <div className="space-y-6">
                  {/* Quote content */}
                  <blockquote className="relative">
                    <div className="absolute -top-2 -left-1 text-2xl sm:text-3xl text-zen-accent/20 font-serif leading-none select-none" aria-hidden="true">
                      "
                    </div>
                    
                    <p className="text-lg sm:text-xl md:text-2xl font-light text-zen-primary leading-relaxed px-4 sm:px-6 relative z-10">
                      {savedQuote.quote}
                    </p>
                    
                    <div className="absolute -bottom-4 -right-1 text-2xl sm:text-3xl text-zen-accent/20 font-serif leading-none select-none" aria-hidden="true">
                      "
                    </div>
                  </blockquote>
                  
                  {/* Author and metadata */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4">
                    <div className="text-center sm:text-left">
                      <cite className="text-base sm:text-lg text-zen-secondary font-medium not-italic block">
                        — {savedQuote.author}
                      </cite>
                      <time className="text-xs sm:text-sm text-zen-muted mt-1 block">
                        Saved on {formatDate(savedQuote.savedAt)}
                      </time>
                    </div>
                    
                    {/* Remove button */}
                    <div className="flex justify-center sm:justify-end">
                      <Button
                        onClick={() => handleRemoveQuote(savedQuote._id!.toString())}
                        variant="secondary"
                        size="sm"
                        className="opacity-60 group-hover:opacity-100 transition-opacity duration-200"
                        disabled={removingQuoteId === savedQuote._id?.toString()}
                        aria-label={`Remove quote by ${savedQuote.author}`}
                      >
                        <span className="mr-1">
                          {removingQuoteId === savedQuote._id?.toString() ? '⏳' : '🗑️'}
                        </span>
                        {removingQuoteId === savedQuote._id?.toString() ? 'Removing...' : 'Remove'}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Footer navigation */}
        {journal.length > 0 && (
          <div className="text-center mt-12">
            <Link href="/">
              <Button variant="primary" size="md" className="min-w-[160px]">
                <span className="mr-2">✨</span>
                Find More Quotes
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}