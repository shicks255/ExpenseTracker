import * as React from 'react';
import * as RadioPrimitive from '@radix-ui/react-radio-group';

import { cn } from '@/lib/utils';

type RadioProps = React.ComponentProps<typeof RadioPrimitive.Item> & {
  label?: React.ReactNode;
};

const Radio = React.forwardRef<React.ElementRef<typeof RadioPrimitive.Item>, RadioProps>(
  ({ className, label, children, ...props }, ref) => {
    return (
      <RadioPrimitive.Item
        ref={ref}
        className={cn(
          'relative inline-flex items-center gap-2 rounded-md text-sm font-medium focus:outline-none disabled:opacity-50 disabled:pointer-events-none',
          className,
        )}
        {...props}
      >
        <RadioPrimitive.Indicator className="absolute left-0 inline-flex h-4 w-4 items-center justify-center rounded-full border border-input bg-transparent text-current transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary">
          <span className="h-2 w-2 rounded-full bg-current" />
        </RadioPrimitive.Indicator>

        <span className="pl-6" data-slot="radio-label">
          {label ?? children}
        </span>
      </RadioPrimitive.Item>
    );
  },
);

Radio.displayName = 'Radio';

function RadioGroup({
  className,
  children,
  ...props
}: React.ComponentProps<typeof RadioPrimitive.Root>) {
  return (
    <RadioPrimitive.Root className={cn('flex flex-col gap-2', className)} {...props}>
      {children}
    </RadioPrimitive.Root>
  );
}

export { Radio, RadioGroup };
