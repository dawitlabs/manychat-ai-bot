'use client';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail
} from '@/components/ui/sidebar';
import { navGroups } from '@/config/nav-config';
import { useMediaQuery } from '@/hooks/use-media-query';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import { Icons } from '../icons';

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isOpen } = useMediaQuery();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/auth/sign-in');
    router.refresh();
  };

  React.useEffect(() => {
    // Side effects based on sidebar state changes
  }, [isOpen]);

  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader className='py-4 px-3'>
        <div className='flex items-center gap-3'>
          <div className='relative flex-shrink-0'>
            <div className='relative h-9 w-9 rounded-xl overflow-hidden shadow-lg bg-[#cd853f]'>
              <img
                src='https://img1.wsimg.com/isteam/ip/c7b141a3-7808-46ba-98e2-793d60c5f411/IMG_0897.jpeg'
                alt='Kyle Briere'
                className='h-full w-full object-cover object-top'
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <span className='absolute inset-0 flex items-center justify-center text-white font-bold text-sm pointer-events-none select-none' aria-hidden>KB</span>
            </div>
            <span className='absolute -top-0.5 -right-0.5 flex h-3 w-3'>
              <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75' />
              <span className='relative inline-flex h-3 w-3 rounded-full bg-green-500' />
            </span>
          </div>
          <div className='group-data-[collapsible=icon]:hidden'>
            <p className='text-sm font-bold tracking-tight'>Kyle AI</p>
            <p className='text-muted-foreground text-[11px] flex items-center gap-1'>
              <span className='text-green-500 font-medium'>● Live</span>
              <span>· Fitness Bot</span>
            </p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className='overflow-x-hidden'>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label || 'ungrouped'} className='py-0'>
            {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
            <SidebarMenu>
              {group.items.map((item) => {
                const Icon = item.icon ? Icons[item.icon as keyof typeof Icons] : Icons.logo;
                return item?.items && item?.items?.length > 0 ? (
                  <Collapsible
                    key={item.title}
                    asChild
                    defaultOpen={item.isActive}
                    className='group/collapsible'
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={item.title} isActive={pathname === item.url}>
                          {item.icon && <Icon />}
                          <span>{item.title}</span>
                          <Icons.chevronRight className='ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items?.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild isActive={pathname === subItem.url}>
                                <Link href={subItem.url}>
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                ) : (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={pathname === item.url}
                    >
                      <Link href={item.url}>
                        <Icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className='px-3 pb-3'>
        <div className='rounded-lg bg-muted/50 border border-border/50 px-3 py-2.5'>
          <div className='flex items-center justify-between'>
            <div className='group-data-[collapsible=icon]:hidden'>
              <p className='text-xs font-semibold'>Kyle Briere</p>
              <p className='text-muted-foreground text-[10px]'>Large Dumbbells Fitness</p>
            </div>
            <button
              onClick={handleLogout}
              className='flex h-7 w-7 items-center justify-center rounded-full bg-muted hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors'
              title='Sign out'
            >
              <Icons.x className='h-3.5 w-3.5' />
            </button>
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
