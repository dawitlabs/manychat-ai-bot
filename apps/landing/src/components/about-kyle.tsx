import Image from 'next/image';
import { MapPinIcon, CheckCircleIcon } from '@phosphor-icons/react/dist/ssr';

const credentials = [
  'Certified Strength Coach',
  'Precision Nutrition Level 1',
  '50+ Busy Professionals Coached',
  'Direct line: (508) 431-7061',
];

export default function AboutKyle() {
  return (
    <section id='about' className='py-24 px-6 md:px-12' style={{ background: '#0a0a0a' }}>
      <div className='max-w-5xl mx-auto'>
        <div className='grid md:grid-cols-2 gap-12 md:gap-16 items-center'>
          {/* Left — image */}
          <div className='relative'>
            <div className='rounded-2xl overflow-hidden aspect-[4/5] relative'
              style={{ border: '1px solid rgba(196,154,74,0.2)', background: '#111111' }}>
              <Image
                src='https://img1.wsimg.com/isteam/ip/c7b141a3-7808-46ba-98e2-793d60c5f411/IMG_0897.jpeg'
                alt='Kyle Briere — Large Dumbbells'
                fill
                className='object-cover'
                unoptimized
              />
            </div>
            {/* Floating credential card */}
            <div className='absolute -bottom-5 -right-4 md:-right-8 rounded-xl px-5 py-4 shadow-xl'
              style={{ background: '#1a1a1a', border: '1px solid rgba(196,154,74,0.25)' }}>
              <p className='font-display font-bold text-white text-sm'>Kyle Briere</p>
              <p className='text-gray-400 text-xs mt-0.5'>Certified Strength & Nutrition Coach</p>
              <p className='flex items-center gap-1.5 text-xs mt-1.5 font-semibold' style={{ color: '#c49a4a' }}>
                <MapPinIcon size={12} color='#c49a4a' weight='fill' />
                Based in Massachusetts
              </p>
            </div>
          </div>

          {/* Right — bio */}
          <div>
            <p className='text-xs font-bold tracking-widest uppercase mb-4' style={{ color: '#c49a4a' }}>
              About Kyle
            </p>
            <h2 className='font-display font-black text-4xl sm:text-5xl text-white leading-tight mb-6'>
              I Build Programs for People Who{' '}
              <span style={{
                background: 'linear-gradient(135deg, #c49a4a 0%, #e8c97a 50%, #c49a4a 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Can&apos;t Afford to Waste Time
              </span>
            </h2>
            <div className='space-y-4 text-gray-400 leading-relaxed'>
              <p>
                I started Large Dumbbells because I kept watching busy, high-achieving people burn out trying to follow fitness programs built for people with unlimited free time. CEOs, engineers, attorneys — guys who execute at the highest level at work but couldn&apos;t crack their fitness because the system wasn&apos;t built for them.
              </p>
              <p>
                My approach is simple: I learn your schedule, your stress points, your food preferences, and your goals — then I build a program that fits your actual life. Not the life a 25-year-old personal trainer imagines you have.
              </p>
              <p>
                Every client I work with gets direct access to me. No assistants, no bots, no cookie-cutter templates. You get Kyle — and 12 weeks of a system built specifically for you.
              </p>
            </div>

            {/* Credentials */}
            <ul className='mt-8 space-y-3'>
              {credentials.map((c) => (
                <li key={c} className='flex items-center gap-3 text-sm text-gray-300'>
                  <CheckCircleIcon size={18} color='#c49a4a' weight='duotone' className='flex-shrink-0' />
                  {c}
                </li>
              ))}
            </ul>

            <div className='mt-10'>
              <a
                href='https://calendly.com/kyle-briere-largedumbbells/30'
                target='_blank'
                rel='noopener noreferrer'
                className='btn-gold inline-block px-8 py-4 rounded-xl text-black font-display font-bold text-base tracking-wide'>
                Book a Free Strategy Call →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
