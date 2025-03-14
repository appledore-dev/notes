'use client'

import { cn } from '@/lib/utils'
import CodeBlock from '@tiptap/extension-code-block'
import Placeholder from '@tiptap/extension-placeholder'
import Typography from '@tiptap/extension-typography'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

export default function TiptapEditor() {
  const editor = useEditor({
    autofocus: 'start',
    editorProps: {
      attributes: {
        class: cn('max-w-prose mx-auto p-4 !h-[calc(100svh-2rem)] focus:outline-none border rounded-md border-dashed border-primary/60'),
      },
    },
    extensions: [
      StarterKit,
      Typography,
      Placeholder.configure({
        placeholder: 'Type something...',
        showOnlyWhenEditable: true,
      }),
      CodeBlock
    ],
    content: '',
  })

  return <EditorContent
    editor={editor}
    className="py-4"
  />
}
