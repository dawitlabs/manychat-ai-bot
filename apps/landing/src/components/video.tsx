export default function Video() {
  return (
    <section className='py-24 px-6 md:px-12' style={{ background: '#0a0a0a' }}>
      <div className='max-w-4xl mx-auto text-center'>
        <p className='text-xs font-bold tracking-widest uppercase mb-4' style={{ color: '#c49a4a' }}>
          Watch This First
        </p>
        <h2 className='font-display font-black text-4xl sm:text-5xl text-white leading-tight mb-4'>
          90-Second Overview
        </h2>
        <p className='text-gray-400 text-lg max-w-xl mx-auto mb-12'>
          See the custom app, the meal planning process, and exactly why busy professionals are getting results they couldn&apos;t get on their own.
        </p>

        {/* Video embed container */}
        <div className='relative rounded-2xl overflow-hidden'
          style={{ border: '1px solid rgba(196,154,74,0.25)', boxShadow: '0 0 60px rgba(196,154,74,0.08)' }}>
          {/* 16:9 aspect ratio wrapper */}
          <div className='relative w-full' style={{ paddingBottom: '56.25%' }}>
            <iframe
              className='absolute inset-0 w-full h-full'
              src='https://www.youtube.com/embed/oDDK9C4qZO0?rel=0&showinfo=0&controls=1'
              title='Large Dumbbells — 90 Second Overview'
              allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
              allowFullScreen
              style={{ border: 'none' }}
            />
          </div>
        </div>

        {/* Mini CTA under video */}
        <div className='mt-10 flex flex-col sm:flex-row gap-4 justify-center'>
          <a
            href='https://calendly.com/kyle-briere-largedumbbells/30'
            target='_blank'
            rel='noopener noreferrer'
            className='btn-gold px-8 py-4 rounded-xl text-black font-display font-bold text-base tracking-wide'>
            Apply for a Spot →
          </a>
        </div>
      </div>
    </section>
  );
}
