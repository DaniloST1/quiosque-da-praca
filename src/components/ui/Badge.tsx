import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'best_seller' | 'promotion' | 'recommended' | 'default';
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variants = {
      best_seller: 'bg-amber-100 text-amber-800 border-amber-200',
      promotion: 'bg-red-100 text-red-700 border-red-200',
      recommended: 'bg-blue-100 text-blue-700 border-blue-200',
      default: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    };

    const icons = {
      best_seller: '🏆',
      promotion: '🔥',
      recommended: '⭐',
      default: '',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
          variants[variant],
          className
        )}
        {...props}
      >
        {icons[variant] && <span>{icons[variant]}</span>}
        {children}
      </span>
    );
  }
);
Badge.displayName = 'Badge';
