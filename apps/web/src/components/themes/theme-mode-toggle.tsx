'use client';

import { Icons } from '@/components/icons';
import { useTheme } from 'next-themes';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function ThemeModeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === 'dark';

  const handleToggle = React.useCallback(
    (e: React.MouseEvent) => {
      const newMode = isDark ? 'light' : 'dark';
      const root = document.documentElement;

      if (!document.startViewTransition) {
        setTheme(newMode);
        return;
      }

      root.style.setProperty('--x', `${e.clientX}px`);
      root.style.setProperty('--y', `${e.clientY}px`);
      document.startViewTransition(() => setTheme(newMode));
    },
    [isDark, setTheme]
  );

  if (!mounted) {
    return (
      <Button variant='outline' size='sm' className='h-8 w-20 gap-1.5 px-2.5' disabled>
        <span className='h-3.5 w-3.5' />
      </Button>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          className='h-8 gap-1.5 px-2.5 text-xs font-medium'
          onClick={handleToggle}
        >
          {isDark ? (
            <>
              <Icons.sun className='h-3.5 w-3.5 text-yellow-400' />
              <span>Day</span>
            </>
          ) : (
            <>
              <Icons.moon className='h-3.5 w-3.5 text-blue-400' />
              <span>Night</span>
            </>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        Switch to {isDark ? 'light' : 'dark'} mode
      </TooltipContent>
    </Tooltip>
  );
}
