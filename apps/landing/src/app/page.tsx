import Nav from '@/components/nav';
import Hero from '@/components/hero';
import Problem from '@/components/problem';
import Video from '@/components/video';
import Blueprint from '@/components/blueprint';
import Process from '@/components/process';
import WhatYouGet from '@/components/what-you-get';
import Results from '@/components/results';
import AboutKyle from '@/components/about-kyle';
import Faq from '@/components/faq';
import FinalCta from '@/components/final-cta';
import Footer from '@/components/footer';

export default function Home() {
  return (
    <main className='overflow-hidden'>
      <Nav />
      <Hero />
      <Problem />
      <Video />
      <Blueprint />
      <Process />
      <WhatYouGet />
      <Results />
      <AboutKyle />
      <Faq />
      <FinalCta />
      <Footer />
    </main>
  );
}
