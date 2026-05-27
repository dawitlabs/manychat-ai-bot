import { ClockIcon, ClipboardTextIcon, TrendDownIcon } from '@phosphor-icons/react/dist/ssr';

const problems = [
  {
    icon: ClockIcon,
    title: "You're already maxed out",
    body: "You're pulling 50+ hours a week. By the time you get home, the last thing you have energy for is figuring out macros and planning gym splits on your own.",
  },
  {
    icon: ClipboardTextIcon,
    title: "Generic plans don't work for you",
    body: "You've tried the YouTube workouts. The generic apps. The cookie-cutter meal plans. They're built for people with 3 hours a day — not for someone running on your schedule.",
  },
  {
    icon: TrendDownIcon,
    title: "Progress stalls without accountability",
    body: "You start strong, life gets busy, momentum dies. Without a coach in your corner adjusting your plan week by week, results plateau and the cycle repeats.",
  },
];

export default function Problem() {
  return (
    <section className='py-24 px-6 md:px-12' style={{ background: '#0f0f0f' }}>
      <div className='max-w-5xl mx-auto'>
        <div className='text-center mb-16'>
          <p className='text-xs font-bold tracking-widest uppercase mb-4' style={{ color: '#c49a4a' }}>
            Sound Familiar?
          </p>
          <h2 className='font-display font-black text-4xl sm:text-5xl text-white leading-tight'>
            Why Most Busy Professionals
            <br />
            <span style={{
              background: 'linear-gradient(135deg, #c49a4a 0%, #e8c97a 50%, #c49a4a 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Never See Results
            </span>
          </h2>
        </div>

        <div className='grid md:grid-cols-3 gap-6'>
          {problems.map((p) => (
            <div key={p.title} className='card-glow rounded-2xl p-8' style={{ background: '#111111' }}>
              <div className='mb-5 flex h-12 w-12 items-center justify-center rounded-xl' style={{ background: 'rgba(196,154,74,0.1)' }}>
                <p.icon size={24} color='#c49a4a' weight='duotone' />
              </div>
              <h3 className='font-display font-bold text-white text-xl mb-3'>{p.title}</h3>
              <p className='text-gray-400 leading-relaxed text-sm'>{p.body}</p>
            </div>
          ))}
        </div>

        <div className='mt-16 rounded-2xl p-8 md:p-12 text-center' style={{ background: 'rgba(196,154,74,0.06)', border: '1px solid rgba(196,154,74,0.15)' }}>
          <p className='font-display font-bold text-white text-2xl sm:text-3xl leading-snug max-w-2xl mx-auto'>
            &ldquo;You don&apos;t have a willpower problem.
            <br />
            You have a{' '}
            <span style={{
              background: 'linear-gradient(135deg, #c49a4a 0%, #e8c97a 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              system problem.
            </span>
            &rdquo;
          </p>
          <p className='text-gray-400 mt-4 text-sm'>— Kyle Briere, Large Dumbbells</p>
        </div>
      </div>
    </section>
  );
}
