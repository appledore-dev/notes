'use client'

import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import CodeBlock from '@tiptap/extension-code-block'
import Placeholder from '@tiptap/extension-placeholder'
import Typography from '@tiptap/extension-typography'
import { Editor, EditorContent, JSONContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { BoldIcon, ItalicIcon } from 'lucide-react'

export default function TiptapEditor({ value, onChange }: {
  value?: string,
  onChange?: (value: JSONContent, editor: Editor) => void
}) {
  const editor = useEditor({
    autofocus: 'start',
    editorProps: {
      attributes: {
        class: cn('p-4 !h-[calc(100svh-2rem-36px)] overflow-y-auto no-scrollbar focus:outline-none border rounded-md border-dashed border-primary/60'),
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
    content: value,
    onTransaction({ editor }) {
    },
    onUpdate({ editor }) {
      onChange?.(editor.getJSON(), editor)
    }
  })

  return editor ? <div className="space-y-2 pt-2 flex flex-col w-full justify-start max-w-prose mx-auto">
    <div className="flex gap-1 items-center overflow-x-auto no-scrollbar flex-nowrap p-0.5">
      <Select
        defaultValue="p"
        value={editor.isActive('heading') ? editor.getAttributes('heading').level.toString() : 'p'}
        onValueChange={(v) => {
          if (v === 'p') {
            editor.chain().focus().setParagraph().run()
          } else {
            editor.chain().focus().setHeading({
              level: Number(v) as 1 | 2 | 3
            }).run()
          }
        }}
      >
        <SelectTrigger className="w-[120px] !h-8">
          <SelectValue placeholder="Theme" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Heading 1</SelectItem>
          <SelectItem value="2">Heading 2</SelectItem>
          <SelectItem value="3">Heading 3</SelectItem>
          <SelectItem value="p">Paragraph</SelectItem>
        </SelectContent>
      </Select>
      <Button size="sm" variant={editor.isActive('bold') ? 'default' : 'outline'} className="p-0 size-8" onClick={() => {
        editor.chain().focus().toggleBold().run()
      }}>
        <BoldIcon className="!size-3.5" />
      </Button>
      <Button size="sm" variant={editor.isActive('italic') ? 'default' : 'outline'} className="p-0 size-8" onClick={() => {
        editor.chain().focus().toggleItalic().run()
      }}>
        <ItalicIcon className="!size-3.5" />
      </Button>
    </div>
    <EditorContent
      editor={editor}
      className="pb-4"
    />
  </div> : <></>
}
