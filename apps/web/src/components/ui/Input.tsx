import React from 'react';
import { clsx } from 'clsx';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, type = 'text', ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label className="block text-xs font-display font-medium text-text-muted">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          className={clsx(
            'w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-hint transition-all duration-200 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-50 disabled:cursor-not-allowed',
            {
              'border-danger focus:ring-danger/20 focus:border-danger': error,
            },
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-danger font-sans">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
