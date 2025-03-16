'use client'

import { SidebarBanner } from '@/components/sidebar-banner'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useUser } from '@/hooks/use-user'
import { cn } from '@/lib/utils'
import { ChevronDownIcon, CommandIcon, ComputerIcon, LogOutIcon, MoonStarIcon, SunIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const p = usePathname()
  const { theme, setTheme } = useTheme()
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
        isActive: item.url === p.split(':')[0],
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
            {data.navMain.map((item, i) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={item.isActive}>
                  <Link href={item.url} className={cn('grid grid-cols-1', i === 0 ? 'font-medium' : '')}>
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
      </SidebarFooter> : <SidebarFooter>
        <div className="p-1 space-y-1">
          <Card className="shadow-none py-0 hover:cursor-pointer">
            <Collapsible className="data-[state=open]:[&_svg.opacity-50]:rotate-180 [&_svg]:transition-all [&_svg]:duration-300">
              <CollapsibleTrigger asChild>
                <CardHeader className="p-4 gap-0">
                  <CardTitle className="flex items-center gap-4 justify-between font-medium text-sm">
                    <div className="grid grid-cols-1 flex-1">
                      <span className="truncate">{user?.user.email}</span>
                    </div>
                    <ChevronDownIcon className="!size-3.5 opacity-50" />
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="p-0.5 pt-0 grid grid-cols-1 gap-2">
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <LogOutIcon className="!size-4 !text-red-400" />
                    Logout
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </Card>
          <div className="flex items-center gap-4 justify-between">
            <Tabs defaultValue={theme} onValueChange={setTheme}>
              <TabsList>
                <TabsTrigger value="light">
                  <SunIcon className="!size-3" />
                </TabsTrigger>
                <TabsTrigger value="dark">
                  <MoonStarIcon className="!size-3" />
                </TabsTrigger>
                <TabsTrigger value="system">
                  <ComputerIcon className="!size-3" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <span className="text-xs text-muted-foreground">
              v0.1
            </span>
          </div>
          {/* <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Card className="shadow-none py-0 hover:cursor-pointer">
                <CardHeader className="p-4 gap-0">
                  <CardTitle className="flex items-center gap-4 justify-between font-medium text-sm">
                    <div className="grid grid-cols-1 flex-1">
                      <span className="truncate">{user?.user.email}</span>
                    </div>
                    <ChevronUpIcon className="!size-3.5 opacity-50" />
                  </CardTitle>
                </CardHeader>
              </Card>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64">
              <Tabs defaultValue={theme} onValueChange={setTheme}>
                <TabsList>
                  <TabsTrigger value="light">
                    <SunIcon className="!size-3" />
                  </TabsTrigger>
                  <TabsTrigger value="dark">
                    <MoonStarIcon className="!size-3" />
                  </TabsTrigger>
                  <TabsTrigger value="system">
                    <ComputerIcon className="!size-3" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 !text-red-400">
                <LogOutIcon className="!size-4 !text-red-400" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu> */}
        </div>
      </SidebarFooter>}
    </Sidebar>
  )
}
