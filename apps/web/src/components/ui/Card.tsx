import React from 'react';
import { clsx } from 'clsx';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverEffect = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'bg-surface/60 backdrop-blur-md border border-border/50 rounded-xl p-6 transition-all duration-300',
          {
            'hover:border-border-hover/80 hover:bg-surface/80 hover:shadow-lg hover:shadow-accent/5': hoverEffect,
          },
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
