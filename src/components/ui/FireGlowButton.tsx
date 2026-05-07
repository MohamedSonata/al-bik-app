import { forwardRef } from 'react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const FireGlowButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn(
          "bg-brand-crimson text-white hover:text-brand-gold hover:bg-brand-crimson transition-all duration-300 font-heading tracking-wider",
          "hover:animate-[glowPulse_2s_infinite]",
          className
        )}
        {...props}
      >
        {children}
      </Button>
    );
  }
);
FireGlowButton.displayName = "FireGlowButton";