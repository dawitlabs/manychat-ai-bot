const testimonials = [
  {
    name: 'Marcus T.',
    role: 'VP of Sales · Boston',
    result: '-22 lbs in 10 weeks',
    quote:
      "I work 60-hour weeks and travel 3 days a month. Kyle built my program around that from day one. I stopped losing progress every time a work trip came up. The custom app made everything dead simple.",
    initials: 'MT',
  },
  {
    name: 'James R.',
    role: 'Software Engineer · NYC',
    result: '+14 lbs muscle, -8% body fat',
    quote:
      "I'd tried gym apps, YouTube programs, even a gym trainer — none of it stuck. Kyle's check-ins were the difference. Every week felt like forward momentum instead of starting over.",
    initials: 'JR',
  },
  {
    name: 'Daniel K.',
    role: 'Attorney · Chicago',
    result: 'First 6-pack at 38',
    quote:
      "I didn't believe 12 weeks was enough time. I was wrong. The meal planning was the thing I always skipped before — Kyle made it so simple I actually followed it.",
    initials: 'DK',
  },
];

export default function Results() {
  return (
    <section id='results' className='py-24 px-6 md:px-12' style={{ background: '#0f0f0f' }}>
      <div className='max-w-5xl mx-auto'>
        <div className='text-center mb-16'>
          <p className='text-xs font-bold tracking-widest uppercase mb-4' style={{ color: '#c49a4a' }}>
            Client Results
          </p>
          <h2 className='font-display font-black text-4xl sm:text-5xl text-white leading-tight'>
            Busy Professionals.
            <br />
            <span style={{
              background: 'linear-gradient(135deg, #c49a4a 0%, #e8c97a 50%, #c49a4a 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Real Results.
            </span>
          </h2>
        </div>

        <div className='grid md:grid-cols-3 gap-6'>
          {testimonials.map((t) => (
            <div key={t.name} className='card-glow rounded-2xl p-7 flex flex-col' style={{ background: '#111111' }}>
              {/* Result badge */}
              <div className='inline-flex self-start items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-6'
                style={{ background: 'rgba(196,154,74,0.12)', border: '1px solid rgba(196,154,74,0.25)', color: '#c49a4a' }}>
                ↑ {t.result}
              </div>

              {/* Quote */}
              <blockquote className='text-gray-300 text-sm leading-relaxed flex-1 mb-6'>
                &ldquo;{t.quote}&rdquo;
              </blockquote>

              {/* Author */}
              <div className='flex items-center gap-3 pt-5' style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div className='h-10 w-10 rounded-full flex items-center justify-center font-display font-bold text-sm flex-shrink-0'
                  style={{ background: 'rgba(196,154,74,0.15)', color: '#c49a4a' }}>
                  {t.initials}
                </div>
                <div>
                  <p className='text-white font-semibold text-sm'>{t.name}</p>
                  <p className='text-gray-500 text-xs'>{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom stats bar */}
        <div className='mt-14 grid grid-cols-3 gap-6 rounded-2xl p-8 text-center'
          style={{ background: 'rgba(196,154,74,0.05)', border: '1px solid rgba(196,154,74,0.12)' }}>
          {[
            { num: '50+', label: 'Busy Professionals Coached' },
            { num: '12', label: 'Weeks Average to Goal' },
            { num: '100%', label: 'Would Recommend' },
          ].map((s) => (
            <div key={s.label}>
              <div className='font-display font-black text-4xl mb-1' style={{ color: '#c49a4a' }}>{s.num}</div>
              <div className='text-gray-400 text-sm'>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
