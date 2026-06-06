'use client'

import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useIsMobile } from '@/hooks/use-mobile'
import { LANGUAGES } from '@/lib/constant'
import { cn } from '@/lib/utils'
import { ReloadIcon } from '@radix-ui/react-icons'
import { Extension, getAttributes } from '@tiptap/core'
import Blockquote from '@tiptap/extension-blockquote'
import BulletList from '@tiptap/extension-bullet-list'
import CodeBlock from '@tiptap/extension-code-block'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import ListItem from '@tiptap/extension-list-item'
import OrderedList from '@tiptap/extension-ordered-list'
import Placeholder from '@tiptap/extension-placeholder'
import Strike from '@tiptap/extension-strike'
import Typography from '@tiptap/extension-typography'
import Underline from '@tiptap/extension-underline'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import {
  BubbleMenu,
  Content,
  Editor,
  EditorContent,
  FloatingMenu,
  JSONContent,
  useEditor
} from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { all, createLowlight } from 'lowlight'
import {
  BoldIcon,
  ChevronRightIcon,
  CodeIcon,
  DramaIcon,
  Edit3Icon,
  EraserIcon,
  GlobeIcon,
  HighlighterIcon,
  ItalicIcon,
  Link2Icon,
  Link2OffIcon,
  ListIcon,
  ListMinusIcon,
  ListOrderedIcon,
  ListPlusIcon,
  SmilePlusIcon,
  SparklesIcon,
  StrikethroughIcon,
  TextQuoteIcon,
  UnderlineIcon
} from 'lucide-react'
import { ReactNode, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

const lowlight = createLowlight(all)

// Highlighted selection - not to lose focus when focusing on other element on the page - GitHub
// source: https://github.com/ueberdosis/tiptap/discussions/4963#discussioncomment-10242905
const DECO_NAME = 'onBlurHighlight'
const ACTION_TYPES = {
  BLUR: 'blur',
  FOCUS: 'focus',
}
const OnBlurHighlight = Extension.create({
  name: DECO_NAME,

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey(DECO_NAME),

        state: {
          init(_config) {
            return DecorationSet.empty
          },

          apply: (transaction, oldState) => {
            const { selection, doc } = transaction
            const decoTransform = transaction.getMeta(DECO_NAME)
            const hasSelection = selection && selection.from !== selection.to

            if (!hasSelection || decoTransform?.action === ACTION_TYPES.FOCUS) {
              return DecorationSet.empty
            }

            if (hasSelection && decoTransform?.action === ACTION_TYPES.BLUR) {
              const decoration = Decoration.inline(selection.from, selection.to, {
                class: 'relative bg-red-300/70 dark:bg-red-300/40 py-[5px]',
              })

              return DecorationSet.create(doc, [decoration])
            }

            return oldState
          },
        },

        props: {
          decorations(state) {
            return this.getState(state)
          },
          handleDOMEvents: {
            blur: view => {
              const { tr } = view.state

              const transaction = tr.setMeta(DECO_NAME, {
                from: tr.selection.from,
                to: tr.selection.to,
                action: ACTION_TYPES.BLUR,
              })

              view.dispatch(transaction)
            },

            focus: view => {
              const { tr } = view.state

              const transaction = tr.setMeta(DECO_NAME, {
                from: tr.selection.from,
                to: tr.selection.to,
                action: ACTION_TYPES.FOCUS,
              })

              view.dispatch(transaction)
            },
          },
        },
      }),
    ]
  },
})

export default function TiptapEditor({ defaultValue, action, onChange, onSave }: {
  defaultValue?: Content,
  action?: (editor: Editor) => ReactNode,
  onChange?: (value: JSONContent, editor: Editor) => void,
  onSave?: (values: { json: JSONContent, html: string }, editor: Editor) => void,
}) {
  const isMobile = useIsMobile()
  const [openPopoverLink, setOpenPopoverLink] = useState(false)
  const editor = useEditor({
    editorProps: {
      attributes: {
        class: cn('p-4 !h-[calc(100svh-2rem-36px-58px)] overflow-y-auto no-scrollbar focus:outline-none border rounded-md border-dashed border-muted-foreground/40'),
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
        autolink: true,
        linkOnPaste: true,
        defaultProtocol: 'https',
        protocols: ['http', 'https', 'mailto', 'tel'],
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        }
      }).extend({
        addOptions() {
          return {
            ...this.parent?.(),
            openOnClick: false
          }
        },
        addProseMirrorPlugins() {
          const plugins: Plugin[] = this.parent?.() || []

          const ctrlClickHandler = new Plugin({
            key: new PluginKey("handleControlClick"),
            props: {
              handleClick(view, pos, event) {
                const attrs = getAttributes(view.state, "link")
                const link = (event.target as HTMLElement)?.closest("a")

                const keyPressed = event.ctrlKey || event.metaKey

                if (keyPressed && link && attrs.href) {
                  window.open(attrs.href, attrs.target)
                  return true
                }

                return false
              }
            }
          })
          plugins.push(ctrlClickHandler)
          return plugins
        }
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      OnBlurHighlight
    ],
    onUpdate({ editor }) {
      const json = editor.getJSON()
      onChange?.(json, editor)

      // window.addEventListener('keydown', (e: KeyboardEvent) => {
      //   if (e.metaKey || e.ctrlKey || e.key?.toLowerCase() === 'meta' || e.key?.toLowerCase() === 'control') {
      //     document.querySelectorAll('.tiptap a').forEach((el) => {
      //       el.classList.add('hover:cursor-pointer')
      //     })
      //   }
      //   window.addEventListener('keyup', (e: KeyboardEvent) => {
      //     document.querySelectorAll('.tiptap a').forEach((el) => {
      //       el.classList.remove('hover:cursor-pointer')
      //     })
      //   })
      // })
    }
  })

  useEffect(() => {
    if (editor && defaultValue) {
      editor.commands.setContent(defaultValue)
    }
  }, [defaultValue, editor])

  // useEffect(() => {
  //   const trigger = (e: KeyboardEvent) => {
  //     if (e.metaKey || e.ctrlKey || e.key?.toLowerCase() === 'meta' || e.key?.toLowerCase() === 'control') {
  //       document.querySelectorAll('.tiptap a').forEach((el) => {
  //         el.classList.add('hover:cursor-pointer')
  //       })
  //     }
  //     window.addEventListener('keyup', (e: KeyboardEvent) => {
  //       document.querySelectorAll('.tiptap a').forEach((el) => {
  //         el.classList.remove('hover:cursor-pointer')
  //       })
  //     })
  //   }
  //   window.addEventListener('keydown', trigger)
  //   return () => {
  //     window.removeEventListener('keydown', trigger)
  //     document.querySelectorAll('.tiptap a').forEach((el) => {
  //       el.classList.remove('hover:cursor-pointer')
  //     })
  //   }
  // }, [])

  const [loadingAi, setLoadingAi] = useState<string>()
  const [openPopover, _setOpenPopover] = useState<string>()
  const [selectedLanguageIndex, setSelectedLanguageIndex] = useState<number>(0)
  const [selectedToneIndex, setSelectedToneIndex] = useState<number>(0)
  const [selectedMainIndex, setSelectedMainIndex] = useState<number>(0)
  const [openDrawer, setOpenDrawer] = useState<boolean>(false)

  const popoverOpenRef = useRef(false)
  const setOpenPopover = (val: string | undefined) => {
    popoverOpenRef.current = !!val
    _setOpenPopover(val)
  }

  const bubbleMenuRef = useRef<HTMLDivElement>(null)
  const floatingMenuRef = useRef<HTMLDivElement>(null)
  const toneContentRef = useRef<HTMLDivElement>(null)
  const translateContentRef = useRef<HTMLDivElement>(null)

  const TONES = [
    'Authoritative',
    'Conversational',
    'Cynical',
    'Emotional',
    'Encouraging',
    'Formal',
    'Friendly',
    'Humorous',
    'Informal',
    'Inspiring',
    'Neutral',
    'Nostalgic',
    'Optimistic',
    'Persuasive',
    'Pessimistic',
    'Reflective',
    'Sarcastic',
    'Urgent',
  ]

  const MAIN_ITEMS = [
    { key: 'simplify', label: 'Simplify', prompt: 'simplify' },
    { key: 'fix', label: 'Fix spelling & grammar', prompt: 'fix spelling and grammar' },
    { key: 'tone', label: 'Rephrase with tone...', hasSubmenu: true },
    { key: 'translate', label: 'Translate to...', hasSubmenu: true },
    { key: 'shorter', label: 'Make it shorter', prompt: 'make it shorter' },
    { key: 'longer', label: 'Make it longer', prompt: 'make it longer' },
    { key: 'emojify', label: 'Emojify', prompt: 'emojify' },
  ]

  const menuHandlerRef = useRef<((e: KeyboardEvent) => void) | null>(null)

  const openToneMenu = () => {
    setOpenPopover('tone')
    setSelectedToneIndex(0)
  }

  const openTranslateMenu = () => {
    if (isMobile) {
      setOpenDrawer(true)
      return
    }

    setOpenPopover('translate')
    setSelectedLanguageIndex(0)
  }

  menuHandlerRef.current = (e: KeyboardEvent) => {
    if (e.shiftKey && e.key.startsWith('Arrow')) return

    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape'].includes(e.key)) return

    const { from, to } = editor!.state.selection
    const isBubbleMenuVisible = popoverOpenRef.current || (editor!.isFocused && from !== to)
    const textBefore = editor!.state.doc.textBetween(from - 1, to)
    const isFloatingMenuVisible = editor!.isFocused && textBefore.endsWith('/') && editor!.state.selection.empty

    if (!isBubbleMenuVisible && !isFloatingMenuVisible) return

    e.preventDefault()
    e.stopPropagation()

    if (openPopover === 'tone') {
      if (e.key === 'ArrowDown') {
        setSelectedToneIndex(prev => prev < TONES.length - 1 ? prev + 1 : prev)
      } else if (e.key === 'ArrowUp') {
        setSelectedToneIndex(prev => prev > 0 ? prev - 1 : prev)
      } else if (e.key === 'Enter') {
        runAi(`rephrase with ${TONES[selectedToneIndex].toLowerCase()} tone`)
      } else if (e.key === 'ArrowLeft' || e.key === 'Escape') {
        setOpenPopover(undefined)
      }
      return
    }

    if (openPopover === 'translate') {
      if (e.key === 'ArrowDown') {
        setSelectedLanguageIndex(prev => prev < LANGUAGES.length - 1 ? prev + 1 : prev)
      } else if (e.key === 'ArrowUp') {
        setSelectedLanguageIndex(prev => prev > 0 ? prev - 1 : prev)
      } else if (e.key === 'Enter') {
        runAi(`translate to ${LANGUAGES[selectedLanguageIndex].name}`)
      } else if (e.key === 'ArrowLeft' || e.key === 'Escape') {
        setOpenPopover(undefined)
      }
      return
    }

    if (isFloatingMenuVisible) {
      if (e.key === 'Enter') {
        const selection = getSelectionText()
        const context = editor!.state.doc.textBetween(0, selection?.to || 0, '').replace(/\//g, '').trim()
        if (!context) {
          toast('Error', {
            description: 'Please write something before using this feature.',
          })
          return
        }
        runAi('continue from the selected text!', context)
      }
      return
    }

    if (e.key === 'ArrowDown') {
      setSelectedMainIndex(prev => prev < MAIN_ITEMS.length - 1 ? prev + 1 : 0)
    } else if (e.key === 'ArrowUp') {
      setSelectedMainIndex(prev => prev > 0 ? prev - 1 : MAIN_ITEMS.length - 1)
    } else if (e.key === 'Enter') {
      const item = MAIN_ITEMS[selectedMainIndex]
      if (item.key === 'tone') {
        openToneMenu()
      } else if (item.key === 'translate') {
        openTranslateMenu()
      } else if (item.prompt) {
        runAi(item.prompt)
      }
    } else if (e.key === 'ArrowRight') {
      const item = MAIN_ITEMS[selectedMainIndex]
      if (item.key === 'tone') {
        openToneMenu()
      } else if (item.key === 'translate') {
        openTranslateMenu()
      }
    }
  }

  useEffect(() => {
    if (!editor) return

    const handler = (e: KeyboardEvent) => {
      menuHandlerRef.current?.(e)
    }
    document.addEventListener('keydown', handler, { capture: true })
    return () => document.removeEventListener('keydown', handler, { capture: true })
  }, [editor])

  useEffect(() => {
    if (!openPopover && bubbleMenuRef.current && !bubbleMenuRef.current.closest('.hidden')) {
      bubbleMenuRef.current.focus()
    }
  }, [openPopover])

  useEffect(() => {
    if (!bubbleMenuRef.current) return
    const selected = bubbleMenuRef.current.querySelector<HTMLElement>(`[data-main-index="${selectedMainIndex}"]`)
    selected?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selectedMainIndex])

  useEffect(() => {
    if (!toneContentRef.current) return
    const selected = toneContentRef.current.children[selectedToneIndex] as HTMLElement
    selected?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selectedToneIndex])

  useEffect(() => {
    if (!translateContentRef.current) return
    const selected = translateContentRef.current.children[selectedLanguageIndex] as HTMLElement
    selected?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selectedLanguageIndex])
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

  const runAi = async (prompt: string, context?: string) => {
    if (!editor) return

    setLoadingAi(prompt)
    const selection = getSelectionText() as { from: number, to: number, text: string }
    const selectedText = context || selection.text

    const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        context: selectedText,
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
    if (context) {
      editor.commands.deleteRange({ from: selection.from - 1, to: selection.to })
    }
    editor.commands.insertContent(json.result.trim())
  }

  return editor ? <div className="relative space-y-2.5 flex flex-col w-full justify-start max-w-prose mx-auto">
    <div className="flex items-center gap-4 justify-between w-full">
      <div className="flex gap-1.5 items-center overflow-x-auto no-scrollbar flex-nowrap p-0.5 flex-1">
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
        <Button size="sm" variant={editor.isActive('codeBlock') ? 'default' : 'outline'} className="p-0 size-8" onClick={() => {
          editor.chain().focus().toggleCodeBlock().run()
        }}>
          <CodeIcon className="!size-3.5" />
        </Button>
        <Popover open={openPopoverLink} onOpenChange={setOpenPopoverLink}>
          <PopoverTrigger asChild>
            <Button size="sm" variant={editor.isActive('link') ? 'default' : 'outline'} className="p-0 size-8">
              <Link2Icon className="!size-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="gap-2 grid grid-cols-1">
              <form className="grid gap-4" onSubmit={e => {
                e.preventDefault()
                const data = Object.fromEntries(new FormData(e.currentTarget).entries())
                if (!data.link) {
                  editor.chain().focus().unsetLink().run()
                  return
                }
                editor.chain().focus().extendMarkRange('link').setLink({ href: data.link as string }).run()
                setOpenPopoverLink(false)
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
                      type="url"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center gap-4">
                  {editor.isActive('link') ? <Button size="sm" variant="ghost" className="gap-2" type="button" onClick={() => {
                    editor.chain().focus().unsetLink().run()
                    setOpenPopoverLink(false)
                  }}>
                    <Link2OffIcon className="!size-3.5" />
                    Unlink
                  </Button> : <span></span>}
                  <Button size="sm" variant="outline" type="submit">
                    {editor.isActive('link') ? 'Update' : 'Add'} Link
                  </Button>
                </div>
              </form>
            </div>
          </PopoverContent>
        </Popover>
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
      {action ? action(editor) : <></>}
    </div>
    <EditorContent
      editor={editor}
      className="pb-4"
    />
    <BubbleMenu
      editor={editor}
      tippyOptions={{ placement: 'bottom-start', duration: 100, zIndex: 40 }}
      shouldShow={({ editor, from, to }) => {
        if (popoverOpenRef.current) return true
        return editor.isFocused && from !== to
      }}
      className={cn('relative flex flex-col gap-0.5 max-h-80 overflow-y-auto no-scrollbar items-start flex-nowrap p-1 rounded-md border shadow-md bg-background z-50', editor?.isEditable ? '' : 'hidden')}
    >
      <div ref={bubbleMenuRef} tabIndex={-1} className="contents">
        <Button size="sm" data-main-index="0" className={cn('gap-2 font-normal w-full justify-start', selectedMainIndex === 0 && !openPopover && 'bg-accent text-accent-foreground')} variant="ghost" onClick={() => runAi('simplify')} disabled={!!loadingAi}>
          {loadingAi === 'simplify' ? <ReloadIcon className="!size-3.5 animate-spin" /> : <Edit3Icon className="!size-3.5" />}
          Simplify
        </Button>
        <Button size="sm" data-main-index="1" className={cn('gap-2 font-normal w-full justify-start', selectedMainIndex === 1 && !openPopover && 'bg-accent text-accent-foreground')} variant="ghost" onClick={() => runAi('fix spelling and grammar')} disabled={!!loadingAi}>
          {loadingAi === 'fix spelling and grammar' ? <ReloadIcon className="!size-3.5 animate-spin" /> : <EraserIcon className="!size-3.5" />}
          Fix spelling & grammar
        </Button>
        <Popover open={openPopover === 'tone'} onOpenChange={o => {
          setOpenPopover(o ? 'tone' : undefined)
          setSelectedToneIndex(0)
        }}>
          <PopoverTrigger asChild>
            <Button
              size="sm"
              data-main-index="2"
              className={cn('gap-6 font-normal w-full justify-between', selectedMainIndex === 2 && !openPopover && 'bg-accent text-accent-foreground')}
              variant="ghost"
              disabled={!!loadingAi}
              onKeyDownCapture={(event) => {
                if (event.key !== 'Enter' && event.key !== 'ArrowRight') return

                event.preventDefault()
                event.stopPropagation()
                openToneMenu()
              }}
            >
              <div className="flex items-center gap-2">
                {loadingAi?.startsWith('rephrase with') ? <ReloadIcon className="!size-3.5 animate-spin" /> : <DramaIcon className="!size-3.5" />}
                <span>Rephrase with tone...</span>
              </div>
              <ChevronRightIcon className="!size-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            side="right"
            align="start"
            className="p-1 flex flex-col gap-1 overflow-y-auto max-h-96 z-40"
            sideOffset={12}
            alignOffset={0}
            ref={toneContentRef}
          >
            {TONES.map((tone, index) => (
              <Button
                key={tone}
                size="sm"
                className={cn('font-normal w-full justify-start', {
                  'bg-accent text-accent-foreground': index === selectedToneIndex,
                })}
                variant="ghost"
                onClick={() => runAi(`rephrase with ${tone.toLowerCase()} tone`)}
                disabled={!!loadingAi}
              >
                {tone}
              </Button>
            ))}
          </PopoverContent>
        </Popover>
        {isMobile ? (
          <Drawer open={openDrawer} onOpenChange={setOpenDrawer}>
            <DrawerTrigger asChild>
              <Button size="sm" data-main-index="3" className={cn('gap-6 font-normal w-full justify-between', selectedMainIndex === 3 && !openPopover && 'bg-accent text-accent-foreground')} variant="ghost" disabled={!!loadingAi}>
                <div className="flex gap-2 items-center">
                  {loadingAi?.startsWith('translate to') ? <ReloadIcon className="!size-3.5 animate-spin" /> : <GlobeIcon className="!size-3.5" />}
                  <span>Translate to...</span>
                </div>
                <ChevronRightIcon className="!size-3.5" />
              </Button>
            </DrawerTrigger>
            <DrawerContent className="flex flex-col gap-0">
              <DrawerHeader>
                <DrawerTitle>Translate to</DrawerTitle>
              </DrawerHeader>
              <div className="flex-1 overflow-y-auto no-scrollbar px-4">
                <div className="grid grid-cols-2 gap-2 pb-4">
                  {LANGUAGES.map((lang) => (
                    <Button
                      key={lang.code}
                      size="sm"
                      className="font-normal justify-start text-sm"
                      variant="outline"
                      onClick={() => {
                        runAi(`translate to ${lang.name}`)
                        setOpenDrawer(false)
                      }}
                      disabled={!!loadingAi}
                    >
                      {lang.name}
                    </Button>
                  ))}
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        ) : (
          <Popover open={openPopover === 'translate'} onOpenChange={o => {
            setOpenPopover(o ? 'translate' : undefined)
            setSelectedLanguageIndex(0)
          }}>
            <PopoverTrigger asChild>
              <Button
                size="sm"
                data-main-index="3"
                className={cn('gap-6 font-normal w-full justify-between', selectedMainIndex === 3 && !openPopover && 'bg-accent text-accent-foreground')}
                variant="ghost"
                disabled={!!loadingAi}
                onKeyDownCapture={(event) => {
                  if (event.key !== 'Enter' && event.key !== 'ArrowRight') return

                  event.preventDefault()
                  event.stopPropagation()
                  openTranslateMenu()
                }}
              >
                <div className="flex gap-2 items-center">
                  {loadingAi?.startsWith('translate to') ? <ReloadIcon className="!size-3.5 animate-spin" /> : <GlobeIcon className="!size-3.5" />}
                  <span>Translate to...</span>
                </div>
                <ChevronRightIcon className="!size-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              side="right"
              align="start"
              className="p-1 flex flex-col gap-1 overflow-y-auto max-h-96 z-40"
              sideOffset={12}
              alignOffset={0}
              ref={translateContentRef}
            >
              {LANGUAGES.map((lang, index) => (
                <Button
                  key={lang.code}
                  size="sm"
                  className={cn('font-normal w-full justify-start', {
                    'bg-accent text-accent-foreground': index === selectedLanguageIndex,
                  })}
                  variant="ghost"
                  onClick={() => runAi(`translate to ${lang.name}`)}
                  disabled={!!loadingAi}
                >
                  {lang.name}
                </Button>
              ))}
            </PopoverContent>
          </Popover>
        )}
        <Button size="sm" data-main-index="4" className={cn('gap-2 font-normal w-full justify-start', selectedMainIndex === 4 && !openPopover && 'bg-accent text-accent-foreground')} variant="ghost" onClick={() => runAi('make it shorter')} disabled={!!loadingAi}>
          {loadingAi === 'make it shorter' ? <ReloadIcon className="!size-3.5 animate-spin" /> : <ListMinusIcon className="!size-3.5" />}
          Make it shorter
        </Button>
        <Button size="sm" data-main-index="5" className={cn('gap-2 font-normal w-full justify-start', selectedMainIndex === 5 && !openPopover && 'bg-accent text-accent-foreground')} variant="ghost" onClick={() => runAi('make it longer')} disabled={!!loadingAi}>
          {loadingAi === 'make it longer' ? <ReloadIcon className="!size-3.5 animate-spin" /> : <ListPlusIcon className="!size-3.5" />}
          Make it longer
        </Button>
        <Button size="sm" data-main-index="6" className={cn('gap-2 font-normal w-full justify-start', selectedMainIndex === 6 && !openPopover && 'bg-accent text-accent-foreground')} variant="ghost" onClick={() => runAi('emojify')} disabled={!!loadingAi}>
          {loadingAi === 'emojify' ? <ReloadIcon className="!size-3.5 animate-spin" /> : <SmilePlusIcon className="!size-3.5" />}
          Emojify
        </Button>
      </div>
    </BubbleMenu>
    <FloatingMenu editor={editor} tippyOptions={{ placement: 'bottom-start', zIndex: 50 }} shouldShow={({ state }) => {
      const { from, to } = state.selection
      const text = state.doc.textBetween(from - 1, to)
      return text.endsWith('/') && state.selection.empty
    }} className={cn('flex flex-col gap-1 max-h-80 overflow-y-auto no-scrollbar item-center flex-nowrap p-1 rounded-md border w-full bg-background z-50 min-w-56', editor?.isEditable ? '' : 'hidden')}>
      <div ref={floatingMenuRef} tabIndex={-1} className="contents">
        <Button size="sm" className="gap-2 font-normal w-full justify-start" variant="ghost" onClick={() => {
          const selection = getSelectionText()
          const context = editor.state.doc.textBetween(0, selection?.to || 0, '').replace(/\//g, '').trim()
          if (!context) {
            toast('Error', {
              description: 'Please write something before using this feature.',
            })
            return
          }
          runAi('continue from the selected text!', context)
        }} disabled={!!loadingAi}>
          {loadingAi === 'continue from the selected text!' ? <ReloadIcon className="!size-3.5 animate-spin" /> : <SparklesIcon className="!size-3.5" />}
          Continue
        </Button>
      </div>
    </FloatingMenu>
  </div> : <></>
}
