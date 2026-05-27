import {
  DeviceMobileIcon,
  ForkKnifeIcon,
  PhoneIcon,
  ChatCircleIcon,
  ArrowsClockwiseIcon,
  TargetIcon,
  ShieldCheckIcon,
} from '@phosphor-icons/react/dist/ssr';
import type { Icon } from '@phosphor-icons/react';

const features: { icon: Icon; title: string; body: string }[] = [
  {
    icon: DeviceMobileIcon,
    title: 'Custom Coaching App',
    body: 'All your workouts, check-ins, and progress tracking in one private app. No spreadsheets, no confusion.',
  },
  {
    icon: ForkKnifeIcon,
    title: 'Personalized Meal Planning',
    body: 'Macros built around your food preferences and schedule — not a generic diet. Including travel and social eating strategies.',
  },
  {
    icon: PhoneIcon,
    title: 'Weekly Check-In Calls',
    body: 'Every week we review data, crush plateaus, and adjust your plan. You never go a week without knowing exactly what to do.',
  },
  {
    icon: ChatCircleIcon,
    title: 'Direct Messaging Access',
    body: 'Message me any time your schedule changes, a question comes up, or you need a plan modification. Real coaching, not a bot.',
  },
  {
    icon: ArrowsClockwiseIcon,
    title: 'Adaptive Programming',
    body: 'Business trips, long work weeks, injuries — your plan adapts in real time. You never fall off because life got in the way.',
  },
  {
    icon: TargetIcon,
    title: 'Results Guarantee',
    body: "If you follow the program and don't see results in 12 weeks, you don't pay. I back my work.",
  },
];

export default function WhatYouGet() {
  return (
    <section id='what-you-get' className='py-24 px-6 md:px-12' style={{ background: '#0a0a0a' }}>
      <div className='max-w-5xl mx-auto'>
        <div className='text-center mb-16'>
          <p className='text-xs font-bold tracking-widest uppercase mb-4' style={{ color: '#c49a4a' }}>
            The Program
          </p>
          <h2 className='font-display font-black text-4xl sm:text-5xl text-white leading-tight'>
            Everything You Get in{' '}
            <span style={{
              background: 'linear-gradient(135deg, #c49a4a 0%, #e8c97a 50%, #c49a4a 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              12 Weeks
            </span>
          </h2>
          <p className='text-gray-400 text-lg mt-4 max-w-xl mx-auto'>
            No generic plans. No guesswork. Every piece is custom-built for your life.
          </p>
        </div>

        <div className='grid sm:grid-cols-2 lg:grid-cols-3 gap-5'>
          {features.map((f) => (
            <div key={f.title} className='card-glow rounded-2xl p-7' style={{ background: '#111111' }}>
              <div className='mb-4 flex h-11 w-11 items-center justify-center rounded-xl' style={{ background: 'rgba(196,154,74,0.1)' }}>
                <f.icon size={22} color='#c49a4a' weight='duotone' />
              </div>
              <h3 className='font-display font-bold text-white text-lg mb-2'>{f.title}</h3>
              <p className='text-gray-400 text-sm leading-relaxed'>{f.body}</p>
            </div>
          ))}
        </div>

        {/* Guarantee callout */}
        <div className='mt-12 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-6 text-center md:text-left'
          style={{ background: 'rgba(196,154,74,0.06)', border: '1px solid rgba(196,154,74,0.2)' }}>
          <div className='flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl' style={{ background: 'rgba(196,154,74,0.12)' }}>
            <ShieldCheckIcon size={28} color='#c49a4a' weight='duotone' />
          </div>
          <div>
            <h3 className='font-display font-bold text-white text-xl mb-1'>The Results Guarantee</h3>
            <p className='text-gray-400 leading-relaxed max-w-2xl'>
              Follow the program, do the check-ins, and if you don&apos;t hit your goal by week 12 — you pay nothing.
              I&apos;ve worked with enough busy professionals to know this system works. I put my money behind that.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
