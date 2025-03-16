'use client'

import TiptapEditor from '@/components/editor-editor'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import {
  SidebarTrigger
} from '@/components/ui/sidebar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useUser } from '@/hooks/use-user'
import { ReloadIcon } from '@radix-ui/react-icons'
import { JSONContent } from '@tiptap/react'
import { CheckIcon, Trash2Icon, TriangleAlertIcon } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

export default function Page() {
  const r = useRouter()
  const { user } = useUser()
  const params = useParams()
  const [doc, setDoc] = useState<{
    id: string
    title: string
    content_json: JSONContent
    content_text: string
  } | null>(null)
  const defaultValue = useMemo<JSONContent | undefined>(() => {
    return doc?.content_json
  }, [doc])
  const [loading, setLoading] = useState(false)

    const fetchDoc = useCallback(async () => {
      if (user === null) r.replace('/')

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/docs/${decodeURIComponent(params.id?.toString() || '').split(':')[0]}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      })
      if (res.ok) {
        const data = await res.json()
        setDoc(data?.doc || null)
      } else {
        r.replace('/')
      }
    }, [user, params.id, r])

    useEffect(() => {
      fetchDoc()
    }, [fetchDoc])

  return <>
    <header className="flex h-16 shrink-0 items-center gap-6 justify-between px-4">
      <div className="flex gap-2 items-center max-w-prose mx-auto w-full">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <div className="grid grid-cols-1 text-sm">
          <Dialog>
            <DialogTrigger asChild>
              <span className="truncate hover:cursor-pointer">
                {doc?.title || ''}
              </span>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  Update title
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={async e => {
                e.preventDefault()

                setLoading(true)
                const formData = new FormData(e.currentTarget)

                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/docs/${doc?.id}`, {
                  method: 'PUT',
                  body: JSON.stringify({
                    title: formData.get('title'),
                    content_json: doc?.content_json,
                    content_text: doc?.content_text,
                  }),
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

                if (res.ok) {
                  fetchDoc()
                  toast('Success', {
                    description: 'Document updated successfully!',
                  })
                  r.replace(`/${doc?.id}:${new Date().getTime()}`)
                }
              }}>
                <div className="pb-6">
                  <Input
                    placeholder="Document Title"
                    name="title"
                    defaultValue={doc?.title || ''}
                    required
                    autoFocus
                  />
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="ghost">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button type="submit" disabled={loading}>
                    Update
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
    <div className="flex flex-1 flex-col gap-4 p-4 py-0">
      <TiptapEditor
        defaultValue={defaultValue}
        onChange={content => setDoc(prev => ({ ...prev, content_json: content } as any))}
        action={(editor) => <div className="flex gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0}>
                <Button size="sm" onClick={async () => {
                  if (!user) return
                  setLoading(true)
                  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/docs/${doc?.id}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                      title: doc?.title || 'Untitled Document',
                      content_json: editor.getJSON(),
                      content_text: editor.getHTML(),
                    }),
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${localStorage.getItem('access_token')}`,
                    },
                  })
                  await new Promise(resolve => setTimeout(resolve, 1000))
                  setLoading(false)
                  if (res.ok) {
                    const data = await res.json()
                    setDoc(data?.doc || null)
                  }
                }} disabled={loading || doc?.content_text === editor.getHTML()} className="gap-2">
                  <span className="hidden md:inline">
                    {loading ? <ReloadIcon className="animate-spin !size-3.5" /> : doc?.content_text === editor.getHTML() ? <CheckIcon className="!size-3.5" /> : <TriangleAlertIcon className="!size-3.5" />}
                  </span>
                  {doc?.content_text === editor.getHTML() ? 'Updated' : 'Update'}
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">
              Updated at {new Date().toLocaleTimeString('en-US')}
            </TooltipContent>
          </Tooltip>
          <Popover>
            <PopoverTrigger asChild>
              <Button size="icon" variant="ghost" className="!size-8 px-0 !text-red-400" disabled={loading}>
                <Trash2Icon className="size-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">
                    Delete Confirmation
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Are you sure you want to delete <span className="font-medium">{doc?.title}?</span> This action cannot be undone.
                  </p>
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" className="gap-2 !text-red-400" onClick={async () => {
                    setLoading(true)
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/docs/${doc?.id}`, {
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
        </div>}
      />
    </div>
  </>
}
