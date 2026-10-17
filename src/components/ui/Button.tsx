import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'toolbar';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'secondary', size = 'md', children, disabled, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-editor-accent disabled:opacity-40 disabled:pointer-events-none select-none text-xs';

    const variants = {
      primary: 'bg-editor-accent hover:bg-editor-accentHover text-white shadow-sm',
      secondary: 'bg-[#2a2a30] hover:bg-[#383840] text-editor-text border border-[#3e3e46]',
      ghost: 'bg-transparent hover:bg-[#2d2d34] text-editor-text',
      danger: 'bg-red-600 hover:bg-red-700 text-white',
      toolbar:
        'bg-transparent hover:bg-[#32323a] text-editor-text data-[active=true]:bg-editor-accent data-[active=true]:text-white',
    };

    const sizes = {
      sm: 'h-7 px-2.5 gap-1.5',
      md: 'h-8 px-3.5 gap-2',
      lg: 'h-9 px-4 gap-2 text-sm',
      icon: 'h-8 w-8 p-1.5',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
