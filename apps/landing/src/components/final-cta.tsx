import { CheckIcon, CalendarIcon, EnvelopeIcon } from '@phosphor-icons/react/dist/ssr';

const perks = [
  'Free 30-min call',
  'No commitment',
  'Results guaranteed',
];

export default function FinalCta() {
  return (
    <section className='py-28 px-6 md:px-12 relative overflow-hidden' style={{ background: '#0a0a0a' }}>
      {/* Gold radial glow */}
      <div aria-hidden className='absolute inset-0 pointer-events-none'
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(196,154,74,0.1) 0%, transparent 70%)' }} />

      <div className='relative z-10 max-w-3xl mx-auto text-center'>
        <div className='inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 text-xs font-semibold tracking-widest uppercase'
          style={{ border: '1px solid rgba(196,154,74,0.35)', background: 'rgba(196,154,74,0.08)', color: '#c49a4a' }}>
          Limited Spots Available
        </div>

        <h2 className='font-display font-black text-5xl sm:text-6xl md:text-7xl text-white leading-[1.0] tracking-tight mb-6'>
          Ready to Build
          <br />
          <span style={{
            background: 'linear-gradient(135deg, #c49a4a 0%, #e8c97a 50%, #c49a4a 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Your Dream Body?
          </span>
        </h2>

        <p className='text-gray-400 text-xl max-w-xl mx-auto leading-relaxed mb-12'>
          Book a free 30-minute strategy call. We&apos;ll map out your 12-week plan — no obligation, no hard sell.
        </p>

        <div className='flex flex-col sm:flex-row gap-4 justify-center items-center mb-10'>
          <a
            href='https://calendly.com/kyle-briere-largedumbbells/30'
            target='_blank'
            rel='noopener noreferrer'
            className='btn-gold px-10 py-5 rounded-xl text-black font-display font-bold text-lg tracking-wide w-full sm:w-auto text-center inline-flex items-center justify-center gap-2'>
            <CalendarIcon size={20} weight='bold' />
            Apply for a Spot
          </a>
          <a
            href='mailto:kyle.briere@largedumbbells.com'
            className='btn-ghost px-10 py-5 rounded-xl text-white font-display font-semibold text-lg tracking-wide w-full sm:w-auto text-center inline-flex items-center justify-center gap-2'>
            <EnvelopeIcon size={20} weight='regular' />
            Email Kyle
          </a>
        </div>

        <div className='flex flex-wrap justify-center gap-6 text-gray-500 text-sm'>
          {perks.map((p) => (
            <span key={p} className='flex items-center gap-1.5'>
              <CheckIcon size={14} color='#c49a4a' weight='bold' />
              {p}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
