'use client';

import * as React from 'react';
import { ConversationTable } from './conversation-table';
import { ChatThread } from './chat-thread';
import { Lead } from '@/lib/mock-data';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from '@/components/ui/resizable';

export function ConversationsView() {
  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null);

  return (
    <ResizablePanelGroup direction='horizontal' className='h-full rounded-lg border'>
      <ResizablePanel defaultSize={55} minSize={35}>
        <div className='h-full p-4'>
          <ConversationTable
            onSelectLead={setSelectedLead}
            selectedLeadId={selectedLead?.user_id || null}
          />
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={45} minSize={30}>
        <div className='h-full'>
          <ChatThread lead={selectedLead} />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
