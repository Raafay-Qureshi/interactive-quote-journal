'use client';

import { useState, useCallback } from 'react';
import { AuthorBiography, AuthorModalState } from '../types/quote';
import { getAuthorBiography } from '../services/wikipedia';

/**
 * Custom hook for managing author modal state and Wikipedia API integration
 */
export function useAuthorModal() {
  const [modalState, setModalState] = useState<AuthorModalState>({
    isOpen: false,
    isLoading: false,
    biography: null,
    error: null,
  });

  /**
   * Open modal and fetch author biography
   */
  const openModal = useCallback(async (authorName: string) => {
    if (!authorName || authorName.trim() === '') {
      return;
    }

    // Open modal immediately with loading state
    setModalState({
      isOpen: true,
      isLoading: true,
      biography: null,
      error: null,
    });

    try {
      const result = await getAuthorBiography(authorName);
      
      if (result.success && result.data) {
        setModalState({
          isOpen: true,
          isLoading: false,
          biography: result.data,
          error: null,
        });
      } else {
        setModalState({
          isOpen: true,
          isLoading: false,
          biography: null,
          error: result.error || 'Failed to load author information',
        });
      }
    } catch (error) {
      console.error('Error fetching author biography:', error);
      setModalState({
        isOpen: true,
        isLoading: false,
        biography: null,
        error: 'An unexpected error occurred while loading author information',
      });
    }
  }, []);

  /**
   * Close modal and reset state
   */
  const closeModal = useCallback(() => {
    setModalState({
      isOpen: false,
      isLoading: false,
      biography: null,
      error: null,
    });
  }, []);

  /**
   * Check if modal is in any active state (open, loading, or has content)
   */
  const isActive = modalState.isOpen;

  return {
    modalState,
    openModal,
    closeModal,
    isActive,
    // Individual state properties for convenience
    isOpen: modalState.isOpen,
    isLoading: modalState.isLoading,
    biography: modalState.biography,
    error: modalState.error,
  };
}

/**
 * Hook specifically for author name click handling
 * Provides optimized click handler with proper event handling
 */
export function useAuthorClick(onAuthorClick: (authorName: string) => void) {
  const handleAuthorClick = useCallback((
    event: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement>,
    authorName: string
  ) => {
    // Prevent any default behavior
    event.preventDefault();
    event.stopPropagation();

    // Handle keyboard events
    if ('key' in event) {
      if (event.key !== 'Enter' && event.key !== ' ') {
        return;
      }
    }

    // Call the provided handler
    onAuthorClick(authorName);
  }, [onAuthorClick]);

  return { handleAuthorClick };
}