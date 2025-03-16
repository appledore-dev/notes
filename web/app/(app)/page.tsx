'use client'

import { AppSidebar } from '@/components/app-sidebar'
import TiptapEditor from '@/components/editor-editor'
import { Separator } from '@/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Content } from '@tiptap/react'
import { useEffect, useState } from 'react'

export default function Page() {
  const [value, setValue] = useState<Content>(null)

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

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "19rem",
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-6 justify-between px-4">
          <div className="flex gap-2 items-center">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 py-0">
          <TiptapEditor defaultValue={value} onChange={content => setValue(content)} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
