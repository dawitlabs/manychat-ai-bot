import PageContainer from '@/components/layout/page-container';
import { BotSettingsView } from '@/features/bot-settings/components/bot-settings-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bot Settings — Kyle AI'
};

export default function SettingsPage() {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col gap-4'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Bot Settings</h2>
          <p className='text-muted-foreground text-sm'>Configure the AI, response settings, and integrations</p>
        </div>
        <BotSettingsView />
      </div>
    </PageContainer>
  );
}
