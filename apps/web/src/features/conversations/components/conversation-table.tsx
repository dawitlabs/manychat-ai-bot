'use client';

import * as React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow } from 'date-fns';
import { Lead } from '@/lib/mock-data';
import { useLeads } from '@/lib/api-client';
import { Icons } from '@/components/icons';

const statusColors: Record<string, string> = {
  New: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  Qualifying: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  Booked: 'bg-green-500/10 text-green-500 border-green-500/20',
  Stalled: 'bg-muted text-muted-foreground border-border',
};

const platformColors: Record<string, string> = {
  instagram: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
  facebook: 'bg-blue-600/10 text-blue-600 border-blue-600/20',
};

interface ConversationTableProps {
  onSelectLead: (lead: Lead) => void;
  selectedLeadId: string | null;
}

export function ConversationTable({ onSelectLead, selectedLeadId }: ConversationTableProps) {
  const { leads } = useLeads();

  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'lastActivity', desc: true }
  ]);
  const [globalFilter, setGlobalFilter] = React.useState('');

  const columns: ColumnDef<Lead>[] = [
    {
      accessorKey: 'first_name',
      header: 'Contact',
      cell: ({ row }) => (
        <div>
          <p className='font-medium'>{row.original.first_name}</p>
          <p className='text-muted-foreground font-mono text-xs'>{row.original.user_id.slice(0, 16)}…</p>
        </div>
      )
    },
    {
      accessorKey: 'platform',
      header: 'Platform',
      cell: ({ row }) => (
        <Badge variant='outline' className={`capitalize text-xs ${platformColors[row.original.platform]}`}>
          {row.original.platform}
        </Badge>
      )
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant='outline' className={`text-xs ${statusColors[row.original.status]}`}>
          {row.original.status}
        </Badge>
      )
    },
    {
      id: 'messages',
      header: 'Messages',
      accessorFn: (row) => row.messages.length,
      cell: ({ row }) => (
        <span className='text-sm tabular-nums'>{row.original.messages.length}</span>
      )
    },
    {
      accessorKey: 'lastActivity',
      header: 'Last Activity',
      cell: ({ row }) => (
        <span className='text-muted-foreground text-sm'>
          {formatDistanceToNow(new Date(row.original.lastActivity), { addSuffix: true })}
        </span>
      )
    },
    {
      accessorKey: 'funnelStep',
      header: 'Funnel Step',
      cell: ({ row }) => (
        <span className='text-muted-foreground text-sm'>Step {row.original.funnelStep}</span>
      )
    }
  ];

  const table = useReactTable({
    data: leads,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className='flex h-full flex-col gap-3'>
      <div className='relative'>
        <Icons.search className='text-muted-foreground absolute top-2.5 left-3 h-4 w-4' />
        <Input
          placeholder='Search leads...'
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className='pl-9'
        />
      </div>
      <div className='flex-1 overflow-auto rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={header.column.getCanSort() ? 'cursor-pointer select-none' : ''}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className='flex items-center gap-1'>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === 'asc' && <Icons.chevronUp className='h-3 w-3' />}
                      {header.column.getIsSorted() === 'desc' && <Icons.chevronDown className='h-3 w-3' />}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className={`cursor-pointer hover:bg-muted/50 transition-colors ${
                  selectedLeadId === row.original.user_id ? 'bg-muted' : ''
                }`}
                onClick={() => onSelectLead(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className='text-muted-foreground text-xs'>{table.getFilteredRowModel().rows.length} leads</p>
    </div>
  );
}
