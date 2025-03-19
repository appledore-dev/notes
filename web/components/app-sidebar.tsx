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
import { GitHubLogoIcon } from '@radix-ui/react-icons'
import { ChevronDownIcon, CommandIcon, ComputerIcon, LogOutIcon, MoonStarIcon, PlusIcon, SunIcon } from 'lucide-react'
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
  // const isMobile = useIsMobile()
  // const r = useRouter()
  // const [loading, setLoading] = useState(false)

  const [data, setData] = useState<{
    navMain: {
      title: string
      url: string
      isActive?: boolean
    }[]
  }>({
    navMain: [
      {
        title: 'New Document',
        url: '/',
      },
    ],
  })

  useEffect(() => {
    setData({
      navMain: [
        {
          title: "New Document",
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
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarMenu className="gap-1">
            {data.navMain.map((item, i) => (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton asChild isActive={item.isActive}>
                  <Link href={item.url} className={cn('flex items-center gap-2 truncate', i === 0 ? 'font-medium' : '')}>
                    {i === 0 ? <PlusIcon className="!size-3.5" /> : <></>}
                    <span className="truncate">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
                {/* <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuAction showOnHover className="hover:cursor-pointer">
                      <MoreHorizontal />
                      <span className="sr-only">More</span>
                    </SidebarMenuAction>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-56 rounded-lg"
                    side={isMobile ? "bottom" : "right"}
                    align={isMobile ? "end" : "start"}
                  >
                    <DropdownMenuItem className="gap-2">
                      <Edit3Icon className="!text-primary/60" />
                      <span>Edit Title</span>
                    </DropdownMenuItem>
                    <Popover modal>
                      <PopoverTrigger asChild>
                        <DropdownMenuItem className="gap-2 !text-destructive" onSelect={e => e.preventDefault()}>
                          <Trash2Icon className="!text-destructive/60" />
                          <span>Remove</span>
                        </DropdownMenuItem>
                      </PopoverTrigger>
                      <PopoverContent className="w-80" align="end">
                        <div className="grid gap-4">
                          <div className="space-y-2">
                            <h4 className="font-medium leading-none">
                              Delete Confirmation
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Are you sure you want to delete <span className="font-medium">{item?.title}?</span> This action cannot be undone.
                            </p>
                          </div>
                          <div className="flex justify-end">
                            <Button variant="outline" size="sm" className="gap-2 !text-red-400" onClick={async () => {
                              setLoading(true)
                              const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/docs/${item?.url.split('/').at(-1)}`, {
                                method: 'DELETE',
                                headers: {
                                  'Content-Type': 'application/json',
                                  Authorization: `Bearer ${localStorage.getItem('access_token')}`,
                                },
                              })
                              setLoading(false)
                              if (!res.ok) {
                                toast('Error', {
                                  description: await res.text(),
                                })
                                return
                              }
                              toast('Success', {
                                description: 'Document deleted successfully!',
                              })
                              r.replace('/')
                            }} disabled={loading}>
                              <Trash2Icon className="!size-3.5" />
                              Confirm
                            </Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </DropdownMenuContent>
                </DropdownMenu> */}
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
        <div className="p-1 space-y-2">
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
                  <Button variant="ghost" className="w-full justify-start gap-2 rounded-xl" onClick={() => {
                    localStorage.removeItem('access_token')
                    location.replace('/')
                  }}>
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
            <Link href="https://github.com/hatchways-community/senior-full-stack-engineer-ai-work-sample-a8f597bb35ef46998c617b1f2bfc4981" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary">
              <GitHubLogoIcon className="!size-3.5" />
            </Link>
          </div>
        </div>
      </SidebarFooter>}
    </Sidebar>
  )
}
