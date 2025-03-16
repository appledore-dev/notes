'use client'

import { DialogLogin } from '@/components/dialog-login'
import TiptapEditor from '@/components/editor-editor'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  SidebarTrigger
} from '@/components/ui/sidebar'
import { useUser } from '@/hooks/use-user'
import { Content } from '@tiptap/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export default function Page() {
  const r = useRouter()
  const { user } = useUser()
  const [value, setValue] = useState<Content>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (value) {
      localStorage.setItem('tiptap-content', JSON.stringify(value))
    }
  }, [value])

  useEffect(() => {
    const content = localStorage.getItem('tiptap-content')
    if (content) {
      setValue(JSON.parse(content))
    }
  }, [])

  return <>
    <header className="flex h-16 shrink-0 items-center gap-6 justify-between px-4">
      <div className="flex gap-2 items-center">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <div className="grid grid-cols-1 text-sm">
          <span className="truncate">
            Untitled Document
          </span>
        </div>
      </div>
    </header>
    <div className="flex flex-1 flex-col gap-4 p-4 py-0">
      <TiptapEditor
        defaultValue={value}
        onChange={content => setValue(content)}
        action={(editor) => user ? <Dialog>
          <DialogTrigger asChild>
            <Button size="sm">
              Save
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Save Document
              </DialogTitle>
              <DialogDescription>
                Input the title of your document to save it.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={async e => {
              e.preventDefault()
              setLoading(true)
              const formData = new FormData(e.currentTarget)

              const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/docs`, {
                method: 'POST',
                body: JSON.stringify({
                  title: formData.get('title'),
                  content_json: value,
                  content_text: editor.getHTML(),
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

                localStorage.removeItem('tiptap-content')
                editor.commands.clearContent()
                setValue(null)

                const json = await res.json()
                r.push(`/${json?.doc?.id}`)
              }
            }}>
              <div className="pb-6">
                <Input
                  placeholder="Document Title"
                  name="title"
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
                  Save
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog> : <DialogLogin>
          <Button size="sm">
            Save
          </Button>
        </DialogLogin>}
      />
    </div>
  </>
}
