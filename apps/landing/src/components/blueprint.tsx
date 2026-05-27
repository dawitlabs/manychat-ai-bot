import { ArrowRightIcon, DownloadSimpleIcon } from '@phosphor-icons/react/dist/ssr';

const BLUEPRINT_URL = 'https://api.leadconnectorhq.com/widget/form/nyKDoOCsbzV2kwTLIS0h?notrack=true';

export default function Blueprint() {
  return (
    <section id='blueprint' className='py-24 px-6 md:px-12' style={{ background: '#0a0a0a' }}>
      <div className='max-w-4xl mx-auto'>
        <div className='rounded-2xl p-10 md:p-14 text-center' style={{ border: '1px solid rgba(196,154,74,0.2)', background: '#111111' }}>
          <div className='flex justify-center mb-6'>
            <div className='flex h-16 w-16 items-center justify-center rounded-2xl' style={{ background: 'rgba(196,154,74,0.1)' }}>
              <DownloadSimpleIcon size={32} color='#c49a4a' weight='duotone' />
            </div>
          </div>

          <p className='text-xs font-bold tracking-widest uppercase mb-3' style={{ color: '#c49a4a' }}>
            Free Download
          </p>
          <h2 className='font-display font-black text-3xl sm:text-4xl text-white mb-4'>
            Get the Busy Body Blueprint
          </h2>
          <p className='text-gray-400 text-base max-w-lg mx-auto mb-10'>
            The exact framework Kyle uses with every client — training split, macro targets, and weekly structure built around a 50+ hour work week. Free, no strings attached.
          </p>

          <a
            href={BLUEPRINT_URL}
            target='_blank'
            rel='noopener noreferrer'
            className='btn-gold inline-flex items-center gap-2 px-10 py-4 rounded-xl text-black font-display font-bold text-base tracking-wide'>
            Get The Free Blueprint
            <ArrowRightIcon size={18} weight='bold' />
          </a>

          <p className='text-gray-600 text-xs mt-5'>No credit card. No spam. Just the blueprint.</p>
        </div>
      </div>
    </section>
  );
}
