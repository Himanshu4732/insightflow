import React from 'react';
import { clsx } from 'clsx';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'neutral', children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={clsx(
          'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium font-sans border transition-colors duration-150',
          {
            'bg-success/10 text-success border-success/20': variant === 'success',
            'bg-warning/10 text-warning border-warning/20': variant === 'warning',
            'bg-danger/10 text-danger border-danger/20': variant === 'danger',
            'bg-accent/10 text-accent border-accent/20': variant === 'info',
            'bg-raised text-text-muted border-border': variant === 'neutral',
          },
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
