'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import Blockquote from '@tiptap/extension-blockquote'
import BulletList from '@tiptap/extension-bullet-list'
import CodeBlock from '@tiptap/extension-code-block'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import ListItem from '@tiptap/extension-list-item'
import OrderedList from '@tiptap/extension-ordered-list'
import Placeholder from '@tiptap/extension-placeholder'
import Strike from '@tiptap/extension-strike'
import Typography from '@tiptap/extension-typography'
import Underline from '@tiptap/extension-underline'
import { Editor, EditorContent, JSONContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { BoldIcon, HighlighterIcon, ItalicIcon, Link2Icon, Link2OffIcon, ListIcon, ListOrderedIcon, QuoteIcon, StrikethroughIcon, UnderlineIcon } from 'lucide-react'

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
      CodeBlock,
      Underline,
      Strike,
      BulletList,
      OrderedList,
      ListItem,
      Blockquote,
      Highlight,
      Link.configure({
        openOnClick: true,
        autolink: true,
        linkOnPaste: true,
        defaultProtocol: 'https',
        protocols: ['http', 'https', 'mailto', 'tel'],
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        }
      })
    ],
    content: value,
    onUpdate({ editor }) {
      onChange?.(editor.getJSON(), editor)
    }
  })

  const getSelectionText = () => {
    if (!editor) return ''
    const { view, state } = editor
    const { from, to } = view.state.selection
    return state.doc.textBetween(from, to, '')
  }

  return editor ? <div className="relative space-y-2 pt-2 flex flex-col w-full justify-start max-w-prose mx-auto">
    <div className="flex gap-2 items-center overflow-x-auto no-scrollbar flex-nowrap p-0.5">
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
          <SelectItem value="1" className="text-2xl font-bold">Heading 1</SelectItem>
          <SelectItem value="2" className="text-xl font-semibold">Heading 2</SelectItem>
          <SelectItem value="3" className="text-lg font-semibold">Heading 3</SelectItem>
          <SelectItem value="p" className="text-base">Paragraph</SelectItem>
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
      <Button size="sm" variant={editor.isActive('underline') ? 'default' : 'outline'} className="p-0 size-8" onClick={() => {
        editor.chain().focus().toggleUnderline().run()
      }}>
        <UnderlineIcon className="!size-3.5" />
      </Button>
      <Separator orientation="vertical" className="!h-8 mx-1" />
      <Button size="sm" variant={editor.isActive('strike') ? 'default' : 'outline'} className="p-0 size-8" onClick={() => {
        editor.chain().focus().toggleStrike().run()
      }}>
        <StrikethroughIcon className="!size-3.5" />
      </Button>
      <Button size="sm" variant={editor.isActive('highlight') ? 'default' : 'outline'} className="p-0 size-8" onClick={() => {
        editor.chain().focus().toggleHighlight().run()
      }}>
        <HighlighterIcon className="!size-3.5" />
      </Button>
      <Button size="sm" variant={editor.isActive('blockquote') ? 'default' : 'outline'} className="p-0 size-8" onClick={() => {
        editor.chain().focus().toggleBlockquote().run()
      }}>
        <QuoteIcon className="!size-3.5" />
      </Button>
      {editor.isActive('link') ? <Button size="sm" variant="default" className="p-0 size-8" onClick={() => {
        editor.chain().focus().unsetLink().run()
      }}>
        <Link2OffIcon className="!size-3.5" />
      </Button> : <Popover>
        <PopoverTrigger asChild>
          <Button size="sm" variant="outline" className="p-0 size-8">
            <Link2Icon className="!size-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <form className="grid gap-4" onSubmit={e => {
            e.preventDefault()
            const data = Object.fromEntries(new FormData(e.currentTarget).entries())
            if (editor.state.selection.empty) {
              editor.commands.insertContent({
                type: 'text',
                text: data.link as string,
                marks: [
                  {
                    type: 'link',
                    attrs: {
                      href: data.link,
                    }
                  }
                ]
              })
            } else {
              // replace the current link text with the new one
              editor.commands.setLink({
                href: data.link as string
              })
            }
          }}>
            <div className="grid gap-2">
              <div className="grid grid-cols-1 items-center gap-2">
                <Label htmlFor="tiptap-extension-link-url">URL</Label>
                <Input
                  id="tiptap-extension-link-url"
                  defaultValue={editor.getAttributes('link').href}
                  className="h-8"
                  name="link"
                  placeholder="https://example.com"
                  required
                  type="url"
                />
              </div>
            </div>
            <div className="flex justify-end gap-1">
              <Button size="sm" variant="outline" type="submit">
                {getSelectionText() ? 'Set' : 'Insert'} Link
              </Button>
            </div>
          </form>
        </PopoverContent>
      </Popover>}
      <Separator orientation="vertical" className="!h-8 mx-1" />
      <Button size="sm" variant={editor.isActive('orderedList') ? 'default' : 'outline'} className="p-0 size-8" onClick={() => {
        editor.chain().focus().toggleOrderedList().run()
      }}>
        <ListOrderedIcon className="!size-3.5" />
      </Button>
      <Button size="sm" variant={editor.isActive('bulletList') ? 'default' : 'outline'} className="p-0 size-8" onClick={() => {
        editor.chain().focus().toggleBulletList().run()
      }}>
        <ListIcon className="!size-3.5" />
      </Button>
    </div>
    <EditorContent
      editor={editor}
      className="pb-4"
    />
  </div> : <></>
}
