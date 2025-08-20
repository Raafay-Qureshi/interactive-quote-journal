'use client';

import { useEffect, useRef } from 'react';
import { AuthorBiography, AuthorModalState } from '../../lib/types/quote';
import Button from './ui/Button';
import Card from './ui/Card';

interface AuthorModalProps {
  isOpen: boolean;
  isLoading: boolean;
  biography: AuthorBiography | null;
  error: string | null;
  authorName: string;
  onClose: () => void;
}

export default function AuthorModal({
  isOpen,
  isLoading,
  biography,
  error,
  authorName,
  onClose,
}: AuthorModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Handle focus management and body scroll lock
  useEffect(() => {
    if (isOpen) {
      // Store the previously focused element
      previousActiveElement.current = document.activeElement as HTMLElement;
      
      // Lock body scroll
      document.body.style.overflow = 'hidden';
      
      // Focus the close button after modal opens
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 100);
    } else {
      // Restore body scroll
      document.body.style.overflow = '';
      
      // Restore focus to previously focused element
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Handle focus trap within modal
  useEffect(() => {
    if (!isOpen) return;

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const modal = modalRef.current;
      if (!modal) return;

      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  // Handle backdrop click
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="author-modal-title"
      aria-describedby="author-modal-description"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200"
      >
        <Card variant="elevated" padding="lg" className="relative">
          {/* Close button */}
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-zen-surface hover:bg-zen-muted/10 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-zen-accent focus:ring-offset-2 focus:ring-offset-zen-surface"
            aria-label="Close author biography"
          >
            <svg
              className="w-5 h-5 text-zen-secondary hover:text-zen-primary transition-colors duration-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Modal content */}
          <div className="pr-12">
            {/* Header */}
            <div className="mb-6">
              <h2
                id="author-modal-title"
                className="text-2xl sm:text-3xl font-light text-zen-primary mb-2"
              >
                About {authorName}
              </h2>
              <div className="w-16 h-px bg-gradient-to-r from-zen-accent to-transparent"></div>
            </div>

            {/* Content */}
            <div id="author-modal-description" className="space-y-6">
              {isLoading && (
                <div className="space-y-4">
                  {/* Loading skeleton */}
                  <div className="zen-shimmer h-4 rounded-lg w-full"></div>
                  <div className="zen-shimmer h-4 rounded-lg w-5/6"></div>
                  <div className="zen-shimmer h-4 rounded-lg w-4/6"></div>
                  <div className="zen-shimmer h-4 rounded-lg w-3/6"></div>
                  
                  {/* Loading message */}
                  <div className="flex items-center justify-center space-x-2 py-8">
                    <div className="zen-pulse w-2 h-2 bg-zen-accent rounded-full"></div>
                    <div className="zen-pulse w-2 h-2 bg-zen-accent rounded-full" style={{ animationDelay: '0.2s' }}></div>
                    <div className="zen-pulse w-2 h-2 bg-zen-accent rounded-full" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                  <p className="text-zen-muted text-sm text-center font-light">
                    Searching for information about {authorName}...
                  </p>
                </div>
              )}

              {error && !isLoading && (
                <div className="text-center py-8">
                  {/* Error icon */}
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-12 h-12 bg-zen-muted/10 rounded-full flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-zen-muted"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-medium text-zen-primary mb-2">
                    No Information Available
                  </h3>
                  <p className="text-zen-secondary text-sm leading-relaxed max-w-md mx-auto">
                    We couldn't find biographical information about {authorName} at this time. 
                    This might be because the author is not well-documented on Wikipedia or 
                    there was a temporary issue accessing the information.
                  </p>
                </div>
              )}

              {biography && !isLoading && !error && (
                <div className="space-y-6">
                  {/* Author image if available */}
                  {biography.thumbnail && (
                    <div className="flex justify-center">
                      <img
                        src={biography.thumbnail}
                        alt={`Portrait of ${biography.name}`}
                        className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-2 border-zen-accent/20 shadow-lg"
                        onError={(e) => {
                          // Hide image if it fails to load
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* Biography text */}
                  <div className="prose prose-zen max-w-none">
                    <p className="text-zen-secondary leading-relaxed text-sm sm:text-base">
                      {biography.summary}
                    </p>
                  </div>

                  {/* Wikipedia link */}
                  {biography.url && (
                    <div className="pt-4 border-t border-zen-muted/20">
                      <a
                        href={biography.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-zen-surface border border-zen-border text-zen-primary hover:bg-zen-surface-elevated focus:ring-zen-accent transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
                      >
                        <span>Read more on Wikipedia</span>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}