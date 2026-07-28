import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    
    const variants = {
      primary: 'bg-[var(--color-primary)] text-white hover:opacity-90 active:scale-95 shadow-md shadow-primary/20',
      secondary: 'bg-[var(--color-secondary)] text-white hover:opacity-90 active:scale-95',
      outline: 'border-2 border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white',
      ghost: 'hover:bg-zinc-100 text-zinc-700 active:scale-95',
      danger: 'bg-red-500 text-white hover:bg-red-600 active:scale-95 shadow-md shadow-red-500/20',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-11 px-6 text-sm font-medium',
      lg: 'h-14 px-8 text-base font-bold',
      icon: 'h-10 w-10 flex items-center justify-center p-0',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center rounded-full transition-all disabled:opacity-50 disabled:pointer-events-none',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
