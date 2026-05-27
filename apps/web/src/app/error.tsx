'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[global error]', error);
  }, [error]);

  return (
    <html>
      <body className='flex min-h-screen flex-col items-center justify-center gap-4 text-center px-6 bg-background text-foreground'>
        <div className='flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10'>
          <Icons.alertCircle className='h-7 w-7 text-destructive' />
        </div>
        <div className='space-y-1'>
          <h2 className='text-lg font-semibold'>Something went wrong</h2>
          <p className='text-muted-foreground text-sm max-w-sm'>
            An unexpected error occurred. Try reloading the page.
          </p>
          {error.digest && (
            <p className='text-muted-foreground/60 text-xs font-mono mt-2'>ref: {error.digest}</p>
          )}
        </div>
        <div className='flex gap-2'>
          <Button onClick={reset} variant='outline' size='sm'>
            <Icons.refresh className='mr-2 h-4 w-4' />
            Try again
          </Button>
          <Button onClick={() => (window.location.href = '/')} size='sm'>
            Go home
          </Button>
        </div>
      </body>
    </html>
  );
}
