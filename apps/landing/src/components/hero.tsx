export default function Hero() {
  return (
    <section className='relative min-h-screen flex flex-col items-center justify-center text-center px-5 sm:px-6 pt-24 pb-14 overflow-hidden'>
      {/* Background radial glow */}
      <div
        aria-hidden
        className='absolute inset-0 pointer-events-none'
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 20%, rgba(196,154,74,0.12) 0%, transparent 70%)',
        }}
      />

      {/* Noise texture overlay */}
      <div
        aria-hidden
        className='absolute inset-0 pointer-events-none opacity-[0.03]'
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
        }}
      />

      <div className='relative z-10 max-w-4xl mx-auto'>
        {/* Badge */}
        <div className='inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 text-xs font-semibold tracking-widest uppercase animate-fade-up'
          style={{ border: '1px solid rgba(196,154,74,0.35)', background: 'rgba(196,154,74,0.08)', color: '#c49a4a' }}>
          <span className='h-1.5 w-1.5 rounded-full bg-gold inline-block' style={{ background: '#c49a4a' }} />
          12-Week Elite Coaching Program
        </div>

        {/* H1 */}
        <h1 className='font-display font-black text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[1.0] tracking-tight animate-fade-up-delay-1 mb-6'>
          <span className='block text-white'>Helping Busy People</span>
          <span className='block text-gold-gradient' style={{
            background: 'linear-gradient(135deg, #c49a4a 0%, #e8c97a 50%, #c49a4a 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Build Their
          </span>
          <span className='block text-white'>Dream Bodies</span>
        </h1>

        {/* Tagline */}
        <p className='text-gray-400 text-lg sm:text-xl md:text-2xl max-w-2xl mx-auto leading-relaxed animate-fade-up-delay-2 mb-10'>
          12 weeks. Fully customized. Built around a{' '}
          <span className='text-white font-semibold'>50+ hour work week.</span>{' '}
          Guaranteed results — or you don&apos;t pay.
        </p>

        {/* CTAs */}
        <div className='flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-up-delay-3 mb-16'>
          <a
            href='https://calendly.com/kyle-briere-largedumbbells/30'
            target='_blank'
            rel='noopener noreferrer'
            className='btn-gold px-8 py-4 rounded-xl text-black font-display font-bold text-base tracking-wide w-full sm:w-auto text-center'>
            Apply for a Spot →
          </a>
          <a
            href='#blueprint'
            className='btn-ghost px-8 py-4 rounded-xl text-white font-display font-semibold text-base tracking-wide w-full sm:w-auto text-center'>
            Get the Free Blueprint
          </a>
        </div>

        {/* Stats row */}
        <div className='grid grid-cols-3 gap-3 sm:gap-6 max-w-2xl mx-auto animate-fade-up-delay-4'
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '1.5rem' }}>
          {[
            { num: '12', unit: 'Weeks', label: 'to your dream body' },
            { num: '100%', unit: 'Custom', label: 'no templates' },
            { num: '✓', unit: 'Guaranteed', label: 'money back' },
          ].map((stat) => (
            <div key={stat.unit} className='text-center'>
              <div className='font-display font-black text-2xl sm:text-4xl' style={{ color: '#c49a4a' }}>
                {stat.num}
              </div>
              <div className='font-display font-bold text-white text-xs sm:text-base mt-0.5'>{stat.unit}</div>
              <div className='text-gray-500 text-[10px] sm:text-xs mt-0.5 hidden xs:block sm:block'>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom fade */}
      <div
        aria-hidden
        className='absolute bottom-0 left-0 right-0 h-32 pointer-events-none'
        style={{ background: 'linear-gradient(to bottom, transparent, #0a0a0a)' }}
      />
    </section>
  );
}
