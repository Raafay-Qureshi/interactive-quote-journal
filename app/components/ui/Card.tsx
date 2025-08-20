'use client';

import { HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ 
    variant = 'default', 
    padding = 'md', 
    children, 
    className = '', 
    ...props 
  }, ref) => {
    const baseClasses = 'rounded-lg transition-all duration-200';
    
    const variantClasses = {
      default: 'bg-zen-surface',
      elevated: 'bg-zen-surface shadow-lg shadow-zen-shadow-lg',
      outlined: 'bg-zen-surface border border-zen-border'
    };
    
    const paddingClasses = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8'
    };
    
    const classes = `${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`;
    
    return (
      <div
        ref={ref}
        className={classes}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;