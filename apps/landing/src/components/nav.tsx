import Image from 'next/image';
import Link from 'next/link';

export default function Nav() {
  return (
    <header className='fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 md:px-12'
      style={{ background: 'linear-gradient(to bottom, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.0) 100%)', backdropFilter: 'blur(2px)' }}>
      <Link href='/' className='flex items-center gap-3'>
        <Image
          src='https://img1.wsimg.com/isteam/ip/c7b141a3-7808-46ba-98e2-793d60c5f411/IMG_0897.jpeg'
          alt='Large Dumbbells logo'
          width={44}
          height={44}
          className='rounded-lg object-cover'
          unoptimized
        />
        <span className='font-display font-bold text-lg tracking-wide text-white hidden sm:block'>
          LARGE DUMBBELLS
        </span>
      </Link>

      <nav className='hidden lg:flex items-center gap-6 text-sm font-medium text-gray-400'>
        <Link href='#blueprint' className='hover:text-gold transition-colors duration-200'>Free Blueprint</Link>
        <Link href='#how-it-works' className='hover:text-gold transition-colors duration-200'>How It Works</Link>
        <Link href='#what-you-get' className='hover:text-gold transition-colors duration-200'>The Program</Link>
        <Link href='#results' className='hover:text-gold transition-colors duration-200'>Results</Link>
        <Link href='#about' className='hover:text-gold transition-colors duration-200'>About Kyle</Link>
      </nav>

      <a
        href='https://calendly.com/kyle-briere-largedumbbells/30'
        target='_blank'
        rel='noopener noreferrer'
        className='btn-gold px-5 py-2.5 rounded-lg text-black font-display font-bold text-sm tracking-wide'>
        Apply Now
      </a>
    </header>
  );
}
