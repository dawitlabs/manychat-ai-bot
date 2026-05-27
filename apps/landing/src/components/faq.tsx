'use client';

import { useState } from 'react';

const faqs = [
  {
    q: "I work 60+ hours a week. Do I actually have time for this?",
    a: "Yes — this program is specifically designed around that schedule. We're talking 45-60 minutes in the gym, 3-4 times a week, with meals that work around your hours. Most of my clients are executives, engineers, and attorneys. Your schedule is the starting point, not an obstacle.",
  },
  {
    q: "What if I travel a lot for work?",
    a: "Travel weeks are planned for. Your program has hotel gym alternatives, on-the-road nutrition strategies, and real-time adjustments from me when things change. Travel is one of the first things we build around.",
  },
  {
    q: "I've tried other coaches before and it didn't work. Why is this different?",
    a: "Most programs fail busy people because they're built for someone with 3 hours a day and no job stress. I build everything around your actual constraints — your hours, your eating habits, your energy levels. And weekly check-ins mean your plan evolves with you, not against you.",
  },
  {
    q: "How does the results guarantee work?",
    a: "Simple: follow the program, do your weekly check-ins, and track what I ask you to track. If you don't hit your goal by week 12, you don't pay for the program. I've backed this with every client I've worked with.",
  },
  {
    q: "What does the application call look like?",
    a: "It's a free 30-minute call where I learn about your schedule, your goals, and what's gotten in the way before. No hard sell. If I think the program is right for you, I'll tell you. If it's not, I'll tell you that too.",
  },
  {
    q: "Do I need a gym membership?",
    a: "A gym with standard equipment is ideal, but we can work around what you have access to. Let me know your situation on the call and I'll build accordingly.",
  },
];

export default function Faq() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className='py-24 px-6 md:px-12' style={{ background: '#0f0f0f' }}>
      <div className='max-w-3xl mx-auto'>
        <div className='text-center mb-14'>
          <p className='text-xs font-bold tracking-widest uppercase mb-4' style={{ color: '#c49a4a' }}>
            FAQ
          </p>
          <h2 className='font-display font-black text-4xl sm:text-5xl text-white leading-tight'>
            Common Questions
          </h2>
        </div>

        <div className='space-y-3'>
          {faqs.map((faq, i) => (
            <div key={i} className='rounded-xl overflow-hidden' style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.06)' }}>
              <button
                className='w-full text-left px-7 py-5 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors'
                onClick={() => setOpen(open === i ? null : i)}>
                <span className='font-display font-semibold text-white text-base'>{faq.q}</span>
                <span className='flex-shrink-0 text-lg font-light transition-transform duration-200'
                  style={{ color: '#c49a4a', transform: open === i ? 'rotate(45deg)' : 'none' }}>
                  +
                </span>
              </button>
              {open === i && (
                <div className='px-7 pb-6'>
                  <div className='h-px mb-4' style={{ background: 'rgba(255,255,255,0.06)' }} />
                  <p className='text-gray-400 leading-relaxed text-sm'>{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
