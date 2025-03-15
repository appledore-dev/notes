'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useIsMobile } from '@/hooks/use-mobile'
import { LANGUAGES } from '@/lib/constant'
import { cn } from '@/lib/utils'
import { ReloadIcon } from '@radix-ui/react-icons'
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
import { BubbleMenu, Content, Editor, EditorContent, JSONContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { BoldIcon, ChevronRightIcon, DramaIcon, Edit3Icon, EraserIcon, GlobeIcon, HighlighterIcon, ItalicIcon, Link2Icon, Link2OffIcon, ListIcon, ListMinusIcon, ListOrderedIcon, ListPlusIcon, SmilePlusIcon, StrikethroughIcon, TextQuoteIcon, UnderlineIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export default function TiptapEditor({ defaultValue, onChange }: {
  defaultValue?: Content,
  onChange?: (value: JSONContent, editor: Editor) => void
}) {
  const isMobile = useIsMobile()
  const editor = useEditor({
    autofocus: 'start',
    editorProps: {
      attributes: {
        class: cn('p-4 !h-[calc(100svh-2rem-36px)] overflow-y-auto no-scrollbar focus:outline-none border rounded-md border-dashed'),
      },
    },
    extensions: [
      StarterKit,
      Typography,
      Placeholder.configure({
        placeholder: 'Type something and select the text to use AI...',
        showOnlyWhenEditable: true,
      }),
      CodeBlock,
      Underline,
      Strike,
      BulletList,
      OrderedList,
      ListItem,
      Blockquote,
      Highlight.configure({
        multicolor: true,
      }),
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
    onUpdate({ editor }) {
      const json = editor.getJSON()
      onChange?.(json, editor)
    }
  })

  useEffect(() => {
    if (editor && defaultValue) {
      editor.commands.setContent(defaultValue)
    }
  }, [defaultValue, editor])

  const [loadingAi, setLoadingAi] = useState<string>()
  const [openPopover, setOpenPopover] = useState<string>()

  const getSelectionText = () => {
    if (!editor) return null
    const { view, state } = editor
    const { from, to } = view.state.selection
    return {
      from,
      to,
      text: state.doc.textBetween(from, to, '')
    }
  }

  const runAi = async (prompt: string) => {
    if (!editor) return

    setLoadingAi(prompt)
    editor.chain().focus().setHighlight({ color: 'black' }).run()

    const selection = getSelectionText() as { from: number, to: number, text: string }

    const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        context: selection.text,
      }),
    })
    setLoadingAi(undefined)
    setOpenPopover(undefined)

    if (!resp.ok) {
      toast('Error', {
        description: await resp.text(),
      })
      return
    }

    const json = await resp.json()
    editor.chain().focus().unsetHighlight().run()
    editor.commands.insertContent(json.result.trim())
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
      <Separator orientation="vertical" className="!h-8 mx-0" />
      <Button size="sm" variant={editor.isActive('strike') ? 'default' : 'outline'} className="p-0 size-8" onClick={() => {
        editor.chain().focus().toggleStrike().run()
      }}>
        <StrikethroughIcon className="!size-3.5" />
      </Button>
      <Button size="sm" variant={editor.isActive('highlight') && editor.getAttributes('highlight').color !== 'black' ? 'default' : 'outline'} className="p-0 size-8" onClick={() => {
        editor.chain().focus().toggleHighlight().run()
      }}>
        <HighlighterIcon className="!size-3.5" />
      </Button>
      <Button size="sm" variant={editor.isActive('blockquote') ? 'default' : 'outline'} className="p-0 size-8" onClick={() => {
        editor.chain().focus().toggleBlockquote().run()
      }}>
        <TextQuoteIcon className="!size-3.5" />
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
                {getSelectionText()?.text ? 'Set' : 'Insert'} Link
              </Button>
            </div>
          </form>
        </PopoverContent>
      </Popover>}
      <Separator orientation="vertical" className="!h-8 mx-0" />
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
    <BubbleMenu
      editor={editor}
      tippyOptions={{ placement: 'bottom-start', duration: 100, zIndex: 40 }}
      className={cn('relative flex flex-col gap-0.5 max-h-80 overflow-y-auto no-scrollbar items-start flex-nowrap p-1 rounded-md border shadow-md bg-background z-30', editor?.isEditable ? '' : 'hidden')}
      shouldShow={() => {
        return !!getSelectionText()?.text
      }}
    >
      <Button size="sm" className="gap-2 font-normal w-full justify-start" variant="ghost" onClick={() => runAi('simplify')} disabled={!!loadingAi}>
        {loadingAi === 'simplify' ? <ReloadIcon className="!size-3.5 animate-spin" /> : <Edit3Icon className="!size-3.5" />}
        Simplify
      </Button>
      <Button size="sm" className="gap-2 font-normal w-full justify-start" variant="ghost" onClick={() => runAi('fix spelling and grammar')} disabled={!!loadingAi}>
        {loadingAi === 'fix spelling and grammar' ? <ReloadIcon className="!size-3.5 animate-spin" /> : <EraserIcon className="!size-3.5" />}
        Fix spelling & grammar
      </Button>
      <Popover open={openPopover === 'tone'} onOpenChange={o => setOpenPopover(o ? 'tone' : undefined)}>
        <PopoverTrigger asChild>
          <Button size="sm" className="gap-6 font-normal w-full justify-between" variant="ghost" disabled={!!loadingAi}>
            <div className="flex items-center gap-2">
              {loadingAi?.startsWith('rephrase with') ? <ReloadIcon className="!size-3.5 animate-spin" /> : <DramaIcon className="!size-3.5" />}
              <span>Rephrase with tone...</span>
            </div>
            <ChevronRightIcon className="!size-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent side={isMobile ? 'bottom' : 'right'} align="start" className="p-1 flex flex-col gap-1 overflow-y-auto max-h-96 z-40" sideOffset={isMobile ? 8 : 12} alignOffset={isMobile ? -6 : 0}>
          <Button size="sm" className="font-normal w-full justify-start" variant="ghost" onClick={() => runAi('rephrase with authoritative tone')} disabled={!!loadingAi}>
            Authoritative
          </Button>
          <Button size="sm" className="font-normal w-full justify-start" variant="ghost" onClick={() => runAi('rephrase with conversational tone')} disabled={!!loadingAi}>
            Conversational
          </Button>
          <Button size="sm" className="font-normal w-full justify-start" variant="ghost" onClick={() => runAi('rephrase with cynical tone')} disabled={!!loadingAi}>
            Cynical
          </Button>
          <Button size="sm" className="font-normal w-full justify-start" variant="ghost" onClick={() => runAi('rephrase with emotional tone')} disabled={!!loadingAi}>
            Emotional
          </Button>
          <Button size="sm" className="font-normal w-full justify-start" variant="ghost" onClick={() => runAi('rephrase with encouraging tone')} disabled={!!loadingAi}>
            Encouraging
          </Button>
          <Button size="sm" className="font-normal w-full justify-start" variant="ghost" onClick={() => runAi('rephrase with formal tone')} disabled={!!loadingAi}>
            Formal
          </Button>
          <Button size="sm" className="font-normal w-full justify-start" variant="ghost" onClick={() => runAi('rephrase with friendly tone')} disabled={!!loadingAi}>
            Friendly
          </Button>
          <Button size="sm" className="font-normal w-full justify-start" variant="ghost" onClick={() => runAi('rephrase with humorous tone')} disabled={!!loadingAi}>
            Humorous
          </Button>
          <Button size="sm" className="font-normal w-full justify-start" variant="ghost" onClick={() => runAi('rephrase with informal tone')} disabled={!!loadingAi}>
            Informal
          </Button>
          <Button size="sm" className="font-normal w-full justify-start" variant="ghost" onClick={() => runAi('rephrase with inspiring tone')} disabled={!!loadingAi}>
            Inspiring
          </Button>
          <Button size="sm" className="font-normal w-full justify-start" variant="ghost" onClick={() => runAi('rephrase with neutral tone')} disabled={!!loadingAi}>
            Neutral
          </Button>
          <Button size="sm" className="font-normal w-full justify-start" variant="ghost" onClick={() => runAi('rephrase with nostalgic tone')} disabled={!!loadingAi}>
            Nostalgic
          </Button>
          <Button size="sm" className="font-normal w-full justify-start" variant="ghost" onClick={() => runAi('rephrase with optimistic tone')} disabled={!!loadingAi}>
            Optimistic
          </Button>
          <Button size="sm" className="font-normal w-full justify-start" variant="ghost" onClick={() => runAi('rephrase with persuasive tone')} disabled={!!loadingAi}>
            Persuasive
          </Button>
          <Button size="sm" className="font-normal w-full justify-start" variant="ghost" onClick={() => runAi('rephrase with pessimistic tone')} disabled={!!loadingAi}>
            Pessimistic
          </Button>
          <Button size="sm" className="font-normal w-full justify-start" variant="ghost" onClick={() => runAi('rephrase with reflective tone')} disabled={!!loadingAi}>
            Reflective
          </Button>
          <Button size="sm" className="font-normal w-full justify-start" variant="ghost" onClick={() => runAi('rephrase with sarcastic tone')} disabled={!!loadingAi}>
            Sarcastic
          </Button>
          <Button size="sm" className="font-normal w-full justify-start" variant="ghost" onClick={() => runAi('rephrase with urgent tone')} disabled={!!loadingAi}>
            Urgent
          </Button>
        </PopoverContent>
      </Popover>
      <Popover open={openPopover === 'translate'} onOpenChange={o => setOpenPopover(o ? 'translate' : undefined)}>
        <PopoverTrigger asChild>
          <Button size="sm" className="gap-6 font-normal w-full justify-between" variant="ghost" disabled={!!loadingAi}>
            <div className="flex gap-2 items-center">
              {loadingAi?.startsWith('translate to') ? <ReloadIcon className="!size-3.5 animate-spin" /> : <GlobeIcon className="!size-3.5" />}
              <span>Translate to...</span>
            </div>
            <ChevronRightIcon className="!size-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent side={isMobile ? 'bottom' : 'right'} align="start" className="p-1 flex flex-col gap-1 overflow-y-auto max-h-96 z-40" sideOffset={isMobile ? 8 : 12} alignOffset={isMobile ? -6 : 0}>
          {LANGUAGES.map((lang) => (
            <Button key={lang.code} size="sm" className="font-normal w-full justify-start" variant="ghost" onClick={() => runAi(`translate to ${lang.name}`)} disabled={!!loadingAi}>
              {lang.name}
            </Button>
          ))}
        </PopoverContent>
      </Popover>
      <Button size="sm" className="gap-2 font-normal w-full justify-start" variant="ghost" onClick={() => runAi('make it shorter')} disabled={!!loadingAi}>
        {loadingAi === 'make it shorter' ? <ReloadIcon className="!size-3.5 animate-spin" /> : <ListMinusIcon className="!size-3.5" />}
        Make it shorter
      </Button>
      <Button size="sm" className="gap-2 font-normal w-full justify-start" variant="ghost" onClick={() => runAi('make it longer')} disabled={!!loadingAi}>
        {loadingAi === 'make it longer' ? <ReloadIcon className="!size-3.5 animate-spin" /> : <ListPlusIcon className="!size-3.5" />}
        Make it longer
      </Button>
      <Button size="sm" className="gap-2 font-normal w-full justify-start" variant="ghost" onClick={() => runAi('emojify')} disabled={!!loadingAi}>
        {loadingAi === 'emojify' ? <ReloadIcon className="!size-3.5 animate-spin" /> : <SmilePlusIcon className="!size-3.5" />}
        Emojify
      </Button>
    </BubbleMenu>
  </div> : <></>
}
