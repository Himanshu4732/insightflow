import React from 'react';
import { clsx } from 'clsx';

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
}

export const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = 'md', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'animate-spin rounded-full border-t-2 border-r-2 border-accent',
          {
            'h-4 w-4 border-2': size === 'sm',
            'h-8 w-8 border-2': size === 'md',
            'h-12 w-12 border-3': size === 'lg',
          },
          className
        )}
        {...props}
      >
        <span className="sr-only">Loading...</span>
      </div>
    );
  }
);

Spinner.displayName = 'Spinner';
