'use client'

import TiptapEditor from '@/components/editor-editor'
import { Content } from '@tiptap/react'
import { useEffect, useState } from 'react'

export default function Home() {
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

  return <div className="container mx-auto px-4">
    <TiptapEditor defaultValue={value} onChange={content => setValue(content)} />
  </div>
}
