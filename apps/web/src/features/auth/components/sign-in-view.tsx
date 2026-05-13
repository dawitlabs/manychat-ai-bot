'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';

export default function SignInViewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard/overview';

  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push(callbackUrl);
        router.refresh();
      } else {
        toast.error('Wrong password');
        setPassword('');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-background px-4'>
      <div className='w-full max-w-sm space-y-6'>
        <div className='flex flex-col items-center gap-2 text-center'>
          <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-700 shadow-lg'>
            <Icons.zap className='h-6 w-6 text-white' />
          </div>
          <h1 className='text-2xl font-bold tracking-tight'>Kyle AI</h1>
          <p className='text-sm text-muted-foreground'>Fitness Bot Dashboard</p>
        </div>

        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-base'>Sign in</CardTitle>
            <CardDescription className='text-xs'>Enter your dashboard password to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div className='space-y-1.5'>
                <Label htmlFor='password'>Password</Label>
                <Input
                  id='password'
                  type='password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder='••••••••'
                  autoFocus
                  required
                />
              </div>
              <Button type='submit' className='w-full' disabled={loading}>
                {loading ? (
                  <Icons.refresh className='mr-2 h-4 w-4 animate-spin' />
                ) : (
                  <Icons.zap className='mr-2 h-4 w-4' />
                )}
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className='text-center text-xs text-muted-foreground'>
          Large Dumbbells Fitness · Kyle Briere AI Bot
        </p>
      </div>
    </div>
  );
}
