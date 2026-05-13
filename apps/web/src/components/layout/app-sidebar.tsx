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
import { usePathname } from 'next/navigation';
import * as React from 'react';
import { Icons } from '../icons';

export default function AppSidebar() {
  const pathname = usePathname();
  const { isOpen } = useMediaQuery();

  React.useEffect(() => {
    // Side effects based on sidebar state changes
  }, [isOpen]);

  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader className='py-4 px-3'>
        <div className='flex items-center gap-3'>
          <div className='relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg flex-shrink-0'>
            <Icons.sparkles className='size-4 text-white' />
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
        <div className='group-data-[collapsible=icon]:hidden rounded-lg bg-muted/50 border border-border/50 px-3 py-2.5'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-xs font-semibold'>Kyle Briere</p>
              <p className='text-muted-foreground text-[10px]'>Large Dumbbells Fitness</p>
            </div>
            <div className='flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold'>
              KB
            </div>
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
