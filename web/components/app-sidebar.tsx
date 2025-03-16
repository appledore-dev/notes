'use client'

import { SidebarBanner } from '@/components/sidebar-banner'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar'
import { useUser } from '@/hooks/use-user'
import { CommandIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const p = usePathname()
  const { user } = useUser()
  const [docs, setDocs] = useState<{
    id: string
    title: string
  }[]>([])

  const [data, setData] = useState<{
    navMain: {
      title: string
      url: string
      isActive?: boolean
    }[]
  }>({
    navMain: [
      {
        title: '+ New Document',
        url: '/',
      },
    ],
  })

  useEffect(() => {
    setData({
      navMain: [
        {
          title: "+ New Document",
          url: "/",
        },
        ...docs.map((item) => ({
          title: item.title,
          url: `/${item.id}`,
        })),
      ].map((item) => ({
        ...item,
        isActive: item.url === p,
      })),
    })
  }, [p, docs])

  const fetchDocs = useCallback(async () => {
    if (user) {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/docs`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      })
      if (res.ok) {
        const data = await res.json()
        setDocs(data?.docs || [])
      }
    }
  }, [user])

  useEffect(() => {
    fetchDocs()
  }, [fetchDocs, p])

  return (
    <Sidebar variant="floating" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <CommandIcon className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">
                    AI Text Editor
                  </span>
                  <span className="text-muted-foreground text-xs">
                    by @mgilangjanuar
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu className="gap-1">
            {data.navMain.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={item.isActive}>
                  <Link href={item.url} className="grid grid-cols-1">
                    <span className="truncate">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      {user === null ? <SidebarFooter>
        <div className="p-1">
          <SidebarBanner />
        </div>
      </SidebarFooter> : <></>}
    </Sidebar>
  )
}
