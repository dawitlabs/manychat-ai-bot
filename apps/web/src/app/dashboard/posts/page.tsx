import PageContainer from '@/components/layout/page-container';
import { PostsView } from '@/features/posts/components/posts-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Post Library — Kyle AI'
};

export default function PostsPage() {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col gap-4'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Post Library</h2>
          <p className='text-muted-foreground text-sm'>Teach the bot what each reel or post was about so it chats in context</p>
        </div>
        <PostsView />
      </div>
    </PageContainer>
  );
}
