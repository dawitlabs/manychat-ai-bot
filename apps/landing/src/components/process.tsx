const steps = [
  {
    number: '01',
    title: 'Deep-Dive Assessment',
    body: "We start with a full audit of your schedule, eating habits, training history, and goals. No assumptions — everything is built from your actual life.",
    detail: 'Nutrition audit · Lifestyle intake · Training assessment · Goal clarity session',
  },
  {
    number: '02',
    title: 'Your Custom Program is Built',
    body: "I build your training split and nutrition targets from scratch — designed to fit your work hours, travel schedule, and food preferences. No templates.",
    detail: 'Custom macros · Week-by-week training plan · Custom app setup · Meal prep strategy',
  },
  {
    number: '03',
    title: 'Weekly Coaching & Adjustments',
    body: "Every week, I review your check-in data and adjust your plan. Plateaus get solved. Travel weeks get handled. Progress stays linear.",
    detail: 'Weekly check-ins · Plan adjustments · Direct messaging access · Progress tracking',
  },
];

export default function Process() {
  return (
    <section id='how-it-works' className='py-24 px-6 md:px-12' style={{ background: '#0f0f0f' }}>
      <div className='max-w-5xl mx-auto'>
        <div className='text-center mb-16'>
          <p className='text-xs font-bold tracking-widest uppercase mb-4' style={{ color: '#c49a4a' }}>
            The Process
          </p>
          <h2 className='font-display font-black text-4xl sm:text-5xl text-white leading-tight'>
            How It Works —
            <br />
            <span style={{
              background: 'linear-gradient(135deg, #c49a4a 0%, #e8c97a 50%, #c49a4a 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              No Guesswork
            </span>
          </h2>
          <p className='text-gray-400 text-lg mt-4 max-w-xl mx-auto'>
            This is exactly how I work with every client. Same process. Fully custom outputs.
          </p>
        </div>

        <div className='space-y-6'>
          {steps.map((step, i) => (
            <div
              key={step.number}
              className='card-glow rounded-2xl p-8 md:p-10 flex flex-col md:flex-row gap-8'
              style={{ background: '#111111' }}>
              {/* Step number */}
              <div className='flex-shrink-0'>
                <div className='font-display font-black text-6xl md:text-7xl leading-none select-none'
                  style={{ color: 'rgba(196,154,74,0.15)' }}>
                  {step.number}
                </div>
              </div>
              {/* Content */}
              <div className='flex-1'>
                <div className='flex items-center gap-3 mb-3'>
                  <div className='h-px flex-1' style={{ background: 'rgba(196,154,74,0.2)' }} />
                  <span className='text-xs font-bold tracking-widest uppercase' style={{ color: '#c49a4a' }}>
                    Step {i + 1}
                  </span>
                </div>
                <h3 className='font-display font-bold text-white text-2xl mb-3'>{step.title}</h3>
                <p className='text-gray-400 leading-relaxed mb-4'>{step.body}</p>
                <p className='text-xs font-semibold tracking-wide' style={{ color: 'rgba(196,154,74,0.7)' }}>
                  {step.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
