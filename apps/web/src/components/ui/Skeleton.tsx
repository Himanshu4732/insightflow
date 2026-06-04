import React from 'react';
import { clsx } from 'clsx';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'animate-pulse bg-raised rounded-md border border-border/30',
          className
        )}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';
