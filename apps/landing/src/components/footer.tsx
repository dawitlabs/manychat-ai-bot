import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{ background: '#060606', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className='max-w-5xl mx-auto px-6 md:px-12 py-16'>
        <div className='grid md:grid-cols-3 gap-12 mb-12'>
          {/* Brand */}
          <div>
            <Link href='/' className='flex items-center gap-3 mb-4'>
              <Image
                src='https://img1.wsimg.com/isteam/ip/c7b141a3-7808-46ba-98e2-793d60c5f411/IMG_0897.jpeg'
                alt='Large Dumbbells'
                width={40}
                height={40}
                className='rounded-lg object-cover'
                unoptimized
              />
              <span className='font-display font-bold text-white tracking-wide'>LARGE DUMBBELLS</span>
            </Link>
            <p className='text-gray-500 text-sm leading-relaxed max-w-xs'>
              Fully customized fitness & nutrition coaching for busy professionals. 12 weeks. Guaranteed results.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <p className='font-display font-bold text-white text-sm mb-4 tracking-wide uppercase'>Navigate</p>
            <ul className='space-y-3 text-sm text-gray-400'>
              {[
                { label: 'How It Works', href: '#how-it-works' },
                { label: 'The Program', href: '#what-you-get' },
                { label: 'Client Results', href: '#results' },
                { label: 'About Kyle', href: '#about' },
              ].map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className='hover:text-gold transition-colors' style={{ '--tw-text-opacity': '1' } as React.CSSProperties}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact + CTA */}
          <div>
            <p className='font-display font-bold text-white text-sm mb-4 tracking-wide uppercase'>Get In Touch</p>
            <ul className='space-y-3 text-sm text-gray-400 mb-6'>
              <li>
                <a href='mailto:kyle.briere@largedumbbells.com' className='hover:text-white transition-colors'>
                  kyle.briere@largedumbbells.com
                </a>
              </li>
              <li>
                <a href='tel:+15084317061' className='hover:text-white transition-colors'>
                  (508) 431-7061
                </a>
              </li>
            </ul>
            <a
              href='https://calendly.com/kyle-briere-largedumbbells/30'
              target='_blank'
              rel='noopener noreferrer'
              className='btn-gold inline-block px-5 py-3 rounded-lg text-black font-display font-bold text-sm tracking-wide'>
              Book a Free Call →
            </a>
          </div>
        </div>

        <div className='hr-gold mb-8' />

        <div className='flex flex-col sm:flex-row items-center justify-between gap-4 text-gray-600 text-xs'>
          <p>© {new Date().getFullYear()} Large Dumbbells. All rights reserved.</p>
          <p>Built for busy people who are serious about results.</p>
        </div>
      </div>
    </footer>
  );
}
