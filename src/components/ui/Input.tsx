import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1 w-full text-left">
        {label && (
          <label htmlFor={id} className="text-[11px] font-medium text-editor-muted">
            {label}
          </label>
        )}
        <input
          id={id}
          type={type}
          ref={ref}
          className={cn(
            'h-7 w-full rounded bg-[#1e1e24] px-2.5 py-1 text-xs text-editor-text border border-[#383842] focus:border-editor-accent focus:outline-none focus:ring-1 focus:ring-editor-accent disabled:opacity-50',
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = 'Input';
