'use client'

import TiptapEditor from '@/components/editor-editor'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  SidebarTrigger
} from '@/components/ui/sidebar'
import { useUser } from '@/hooks/use-user'
import { Content } from '@tiptap/react'
import { Trash2Icon } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

export default function Page() {
  const { user } = useUser()
  const params = useParams()
  const [value, setValue] = useState<Content>(null)
  const [doc, setDoc] = useState<{
    id: string
    title: string
    content_json: any
    content_text: string
  } | null>(null)
  const [loading, setLoading] = useState(false)

    const fetchDoc = useCallback(async () => {
      if (!user) return
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/docs/${params.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      })
      if (res.ok) {
        const data = await res.json()
        setDoc(data?.doc || null)
        setValue(data?.doc?.content_json || null)
      }
    }, [user, params.id])

    useEffect(() => {
      fetchDoc()
    }, [fetchDoc])

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
            {doc?.title || 'Untitled Document'}
          </span>
        </div>
      </div>
    </header>
    <div className="flex flex-1 flex-col gap-4 p-4 py-0">
      <TiptapEditor
        defaultValue={value}
        onChange={content => setValue(content)}
        action={(editor) => <div className="flex gap-2">
          <Button size="sm" onClick={async () => {
            if (!user) return
            setLoading(true)
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/docs/${params.id}`, {
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
            setLoading(false)
            if (res.ok) {
              const data = await res.json()
              setDoc(data?.doc || null)
              setValue(data?.doc?.content_json || null)
            }
          }} disabled={loading}>
            Update
          </Button>
          <Button size="icon" variant="ghost" className="!size-8 px-0 !text-red-400" disabled={loading}>
            <Trash2Icon className="size-3.5" />
          </Button>
        </div>}
      />
    </div>
  </>
}
