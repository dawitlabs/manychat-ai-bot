'use client';

import * as React from 'react';
import { ConversationTable } from './conversation-table';
import { ChatThread } from './chat-thread';
import { useLeads } from '@/lib/api-client';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from '@/components/ui/resizable';

export function ConversationsView() {
  const [selectedLeadId, setSelectedLeadId] = React.useState<string | null>(null);
  const { leads } = useLeads();

  // Derive from live query data so pause/send updates reflect immediately
  const selectedLead = leads.find((l) => l.user_id === selectedLeadId) ?? null;

  return (
    <ResizablePanelGroup direction='horizontal' className='h-full rounded-lg border'>
      <ResizablePanel defaultSize={55} minSize={35}>
        <div className='h-full p-4'>
          <ConversationTable
            onSelectLead={(lead) => setSelectedLeadId(lead.user_id)}
            selectedLeadId={selectedLeadId}
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
