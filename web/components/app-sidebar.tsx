'use client'

import { SidebarBanner } from '@/components/sidebar-banner'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '@/components/ui/sidebar'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useUser } from '@/hooks/use-user'
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { GitHubLogoIcon } from '@radix-ui/react-icons'
import {
  ChevronDownIcon,
  CommandIcon,
  ComputerIcon,
  LogOutIcon,
  MoonStarIcon,
  PlusIcon,
  SearchIcon,
  SunIcon
} from 'lucide-react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const SearchSchema = z.object({
  search: z.string({ required_error: '' }).min(1, 'Search cannot be empty.').trim(),
})

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
    navMain: [],
  })
  const searchForm = useForm<z.infer<typeof SearchSchema>>({
    resolver: zodResolver(SearchSchema),
    defaultValues: {
      search: '',
    },
  })

  useEffect(() => {
    setData({
      navMain: docs.map((item) => ({
        title: item.title,
        url: `/${item.id}`,
      })).map((item) => ({
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
        setDocs(data?.docs)
      }
    }
  }, [user])

  useEffect(() => {
    fetchDocs()
  }, [fetchDocs, p])

  const [openSearch, setOpenSearch] = useState(false)
  const [searchDocs, setSearchDocs] = useState<{
    id: string
    title: string
    content_text: string
  }[]>()
  const { setOpenMobile } = useSidebar()

  return (
    <Sidebar variant="floating" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <CommandIcon className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-medium">
                  Notes AI Assistant
                </span>
                <span className="text-muted-foreground text-xs">
                  by <a href="https://x.com/mgilangjanuar" target="_blank" rel="noopener noreferrer" className="hover:underline underline-offset-4">mgilangjanuar</a>
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarMenu className="gap-1">
            <SidebarMenuItem key="new">
              <SidebarMenuButton asChild isActive={p === '/'}>
                <Link href="/" className={cn('flex items-center gap-2 truncate font-medium')}>
                  <PlusIcon className="!size-3.5" />
                  <span className="truncate">New Document</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <Dialog open={openSearch} onOpenChange={setOpenSearch} modal>
              <DialogTrigger asChild>
                <SidebarMenuItem key="search">
                  <SidebarMenuButton className="truncate gap-2 hover:cursor-pointer">
                    <SearchIcon className="!size-3.5" />
                    <span className="truncate">Search</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </DialogTrigger>
              <DialogContent className="[&_button.absolute.top-4.right-4]:hidden p-0 max-w-full">
                <Form {...searchForm}>
                  <form onSubmit={searchForm.handleSubmit(async (data) => {
                    setSearchDocs(undefined)
                    const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/docs?search=${encodeURIComponent(data.search.split(' ').join(' & '))}`, {
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
                      },
                    })
                    if (!resp.ok) {
                      toast('Error', {
                        description: await resp.text(),
                      })
                      return
                    }
                    const json = await resp.json()
                    setSearchDocs(json.docs)
                  })}>
                    <DialogHeader className="p-0">
                      <FormField
                        control={searchForm.control}
                        name="search"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                {...field}
                                onChange={e => {
                                  field.onChange(e)
                                  setSearchDocs(undefined)
                                }}
                                autoFocus
                                placeholder="Search..."
                                className="w-full !ring-0 border-0 !rounded-b-none outline-0 px-6 py-4 h-full"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <DialogTitle className="hidden"></DialogTitle>
                    </DialogHeader>
                  </form>
                </Form>
                <ScrollArea>
                  <div className="!max-h-[calc(100svh-142px)]">
                    {!searchForm.watch('search') && searchDocs === undefined ? (
                      <div className="flex flex-col gap-2 w-full px-6">
                        <p className="text-muted-foreground text-sm">
                          Search for documents by title or content.
                        </p>
                      </div>
                    ) : <>
                      {searchDocs?.length ? <div className="grid grid-cols-1 gap-4 px-6">
                        {searchDocs.map((item) => (
                          <Link key={item.id} className="flex flex-col gap-1.5 w-full hover:cursor-pointer group" href={`/${item.id}`} onClick={() => {
                            setOpenSearch(false)
                            setOpenMobile(false)
                          }}>
                            <h4 className="group-hover:underline underline-offset-4 scroll-m-20 text-base font-semibold tracking-tight">
                              {item.title}
                            </h4>
                            <p className="text-muted-foreground line-clamp-2 text-sm" dangerouslySetInnerHTML={{
                              __html: (() => {
                                const words = searchForm.watch('search').split(' ')
                                const regex = new RegExp(`(${words.join('|')})`, 'gi')
                                if (!item.content_text.toLowerCase().includes(searchForm.watch('search').toLowerCase())) {
                                  return item.content_text.replace(regex, (match) => `<strong>${match}</strong>`)
                                }
                                if (item.content_text.toLowerCase().indexOf(searchForm.watch('search').toLowerCase()) <= 65) {
                                  return item.content_text.replace(regex, (match) => `<strong>${match}</strong>`)
                                }
                                if (item.content_text.toLowerCase().indexOf(searchForm.watch('search').toLowerCase()) > 65) {
                                  return item.content_text.substring(
                                    item.content_text.toLowerCase().indexOf(searchForm.watch('search').toLowerCase()) - 65,
                                  ).replace(regex, (match) => `<strong>${match}</strong>`)
                                }
                                return item.content_text.replace(regex, (match) => `<strong>${match}</strong>`)
                              })(),
                            }}></p>
                          </Link>
                        ))}
                      </div> : searchDocs ? <div className="flex flex-col gap-2 w-full px-6">
                        <p className="text-muted-foreground text-sm">
                          No documents found.
                        </p>
                      </div> : <></>}
                    </>}
                  </div>
                </ScrollArea>
                <DialogFooter className="p-6 pt-0">
                  <DialogClose asChild>
                    <Button size="sm" variant="ghost" type="button">
                      Close
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Separator className="my-0.5" />
            {data.navMain.map((item) => (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton asChild isActive={item.isActive} onClick={() => setOpenMobile(false)}>
                  <Link href={item.url} className={cn('flex items-center gap-2 truncate')}>
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
            <Link href="https://github.com/appledore-dev/notes" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary">
              <GitHubLogoIcon className="!size-3.5" />
            </Link>
          </div>
        </div>
      </SidebarFooter>}
    </Sidebar>
  )
}
