'use client';

import { useState, useEffect, useCallback } from 'react';
import { Quote, JournalEntry } from '../types/quote';

interface UseQuoteJournalReturn {
  journal: JournalEntry[];
  isLoading: boolean;
  error: string | null;
  saveQuoteToJournal: (quote: Quote) => Promise<void>;
  removeQuoteFromJournal: (quoteId: string) => Promise<void>;
  checkIfQuoteSaved: (quote: Quote) => boolean;
  refreshJournal: () => void;
}

export function useQuoteJournal(): UseQuoteJournalReturn {
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadJournal = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/journal');
      if (!response.ok) {
        throw new Error('Failed to fetch journal');
      }
      const data: JournalEntry[] = await response.json();
      setJournal(data);
    } catch (err: any) {
      setError(err.message);
      setJournal([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJournal();
  }, [loadJournal]);

  const saveQuoteToJournal = useCallback(
    async (quote: Quote) => {
      try {
        const response = await fetch('/api/journal', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(quote),
        });
        if (!response.ok) {
          throw new Error('Failed to save quote');
        }
        await loadJournal(); // Refresh the journal after saving
      } catch (err: any) {
        setError(err.message);
      }
    },
    [loadJournal]
  );

  const removeQuoteFromJournal = useCallback(
    async (quoteId: string) => {
      try {
        const response = await fetch(`/api/journal/${quoteId}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error('Failed to remove quote');
        }
        await loadJournal(); // Refresh the journal after removing
      } catch (err: any) {
        setError(err.message);
      }
    },
    [loadJournal]
  );

  const checkIfQuoteSaved = useCallback(
    (quote: Quote) => {
      // Simple check based on quote content and author
      return journal.some(
        (entry) => entry.quote === quote.quote && entry.author === quote.author
      );
    },
    [journal]
  );

  const refreshJournal = useCallback(() => {
    loadJournal();
  }, [loadJournal]);

  return {
    journal,
    isLoading,
    error,
    saveQuoteToJournal,
    removeQuoteFromJournal,
    checkIfQuoteSaved,
    refreshJournal,
  };
}

export function useQuoteSaveState(quote: Quote | null) {
  const { journal, saveQuoteToJournal, removeQuoteFromJournal } = useQuoteJournal();
  const [isSaved, setIsSaved] = useState(false);
  const [savingState, setSavingState] = useState<'idle' | 'saving' | 'removing'>('idle');
  const [currentJournalEntry, setCurrentJournalEntry] = useState<JournalEntry | null>(null);

  useEffect(() => {
    if (quote) {
      const entry = journal.find(
        (entry) => entry.quote === quote.quote && entry.author === quote.author
      ) || null;
      setCurrentJournalEntry(entry);
      setIsSaved(!!entry);
    }
  }, [quote, journal]);

  const toggleSave = useCallback(async () => {
    if (!quote || savingState !== 'idle') return;

    setSavingState(isSaved ? 'removing' : 'saving');

    if (isSaved && currentJournalEntry?._id) {
      await removeQuoteFromJournal(currentJournalEntry._id.toString());
    } else {
      await saveQuoteToJournal(quote);
    }
    
    setSavingState('idle');
  }, [quote, isSaved, savingState, currentJournalEntry, saveQuoteToJournal, removeQuoteFromJournal]);

  return {
    isSaved,
    savingState,
    toggleSave,
  };
}