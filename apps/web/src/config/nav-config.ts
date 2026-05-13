import { NavGroup } from '@/types';

export const navGroups: NavGroup[] = [
  {
    label: 'Command Center',
    items: [
      {
        title: 'Overview',
        url: '/dashboard/overview',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['o', 'o'],
        items: []
      },
      {
        title: 'Bot Activity',
        url: '/dashboard/activity',
        icon: 'activity',
        isActive: false,
        shortcut: ['b', 'a'],
        items: []
      }
    ]
  },
  {
    label: 'Leads',
    items: [
      {
        title: 'Pipeline',
        url: '/dashboard/pipeline',
        icon: 'kanban',
        isActive: false,
        shortcut: ['p', 'p'],
        items: []
      },
      {
        title: 'All Leads',
        url: '/dashboard/leads',
        icon: 'users',
        isActive: false,
        shortcut: ['l', 'l'],
        items: []
      },
      {
        title: 'Conversations',
        url: '/dashboard/conversations',
        icon: 'chat',
        isActive: false,
        shortcut: ['c', 'c'],
        items: []
      }
    ]
  },
  {
    label: 'AI Engine',
    items: [
      {
        title: 'AI Control',
        url: '/dashboard/ai-control',
        icon: 'sparkles',
        isActive: false,
        shortcut: ['a', 'c'],
        items: []
      },
      {
        title: 'Templates',
        url: '/dashboard/templates',
        icon: 'fileText',
        isActive: false,
        shortcut: ['t', 't'],
        items: []
      },
      {
        title: 'Objection Handlers',
        url: '/dashboard/objections',
        icon: 'shield',
        isActive: false,
        shortcut: ['o', 'h'],
        items: []
      }
    ]
  },
  {
    label: 'Performance',
    items: [
      {
        title: 'Analytics',
        url: '/dashboard/analytics',
        icon: 'trendingUp',
        isActive: false,
        shortcut: ['a', 'n'],
        items: []
      },
      {
        title: 'Reports',
        url: '/dashboard/reports',
        icon: 'barChart',
        isActive: false,
        shortcut: ['r', 'r'],
        items: []
      }
    ]
  },
  {
    label: 'Setup',
    items: [
      {
        title: 'Integrations',
        url: '/dashboard/integrations',
        icon: 'link',
        isActive: false,
        shortcut: ['i', 'i'],
        items: []
      },
      {
        title: 'Bot Settings',
        url: '/dashboard/settings',
        icon: 'settings',
        isActive: false,
        shortcut: ['s', 's'],
        items: []
      }
    ]
  }
];
