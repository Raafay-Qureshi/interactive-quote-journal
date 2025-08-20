import Link from 'next/link';
import QuoteDisplay from './components/QuoteDisplay';
import Button from './components/ui/Button';

export default function Home() {
  return (
    <div className="min-h-screen bg-zen-background">
      {/* Subtle background pattern for visual interest */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, var(--zen-primary) 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }} />
      </div>
      
      <div className="relative">
        <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-16">
          {/* Header */}
          <header className="text-center mb-12 sm:mb-16 lg:mb-20 zen-fade-in">
            {/* Navigation */}
            <div className="flex justify-end mb-6">
              <Link href="/journal">
                <Button variant="secondary" size="sm" className="opacity-70 hover:opacity-100 transition-opacity duration-200">
                  <span className="mr-2">📚</span>
                  My Journal
                </Button>
              </Link>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-zen-primary mb-4 sm:mb-6 tracking-tight">
              Interactive Quote Journal
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-zen-secondary max-w-2xl mx-auto leading-relaxed font-light">
              Discover wisdom, save inspiration, and visualize the vibe of meaningful quotes
            </p>
            
            {/* Decorative element */}
            <div className="mt-6 sm:mt-8 flex justify-center">
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-zen-accent to-transparent"></div>
            </div>
          </header>

          {/* Quote Display - Main Content */}
          <main className="flex items-center justify-center min-h-[50vh] sm:min-h-[60vh]">
            <div className="w-full max-w-4xl px-4">
              <QuoteDisplay className="zen-fade-in" />
            </div>
          </main>

          {/* Footer */}
          <footer className="text-center mt-12 sm:mt-16 lg:mt-20 zen-fade-in">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-px bg-gradient-to-r from-transparent via-zen-muted to-transparent"></div>
            </div>
            <p className="text-sm text-zen-muted font-light">
              Powered by{' '}
              <a 
                href="https://zenquotes.io" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-zen-accent hover:text-zen-accent-hover transition-colors duration-200 underline decoration-1 underline-offset-2"
              >
                ZenQuotes API
              </a>
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
