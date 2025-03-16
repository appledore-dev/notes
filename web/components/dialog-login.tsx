'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useUser } from '@/hooks/use-user'
import { ReloadIcon } from '@radix-ui/react-icons'
import { useState } from 'react'
import { toast } from 'sonner'

export function DialogLogin({ children }: { children: React.ReactNode }) {
  const { fetchUser } = useUser()
  const [openLogin, setOpenLogin] = useState(false)
  const [loading, setLoading] = useState(false)

  return <Dialog open={openLogin} onOpenChange={setOpenLogin}>
    <DialogTrigger asChild>
      {children}
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          Sign in with Email
        </DialogTitle>
        <DialogDescription>
          Enter your email address to receive a one-time password (OTP) for signing in.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={async e => {
        e.preventDefault()
        const data = Object.fromEntries(new FormData(e.currentTarget))
        if (!data.email) return

        setLoading(true)
        const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/otp`, {
          method: 'POST',
          body: JSON.stringify({
            email: data.email,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        })
        setLoading(false)
        if (!resp.ok) {
          toast('Error', {
            description: await resp.text(),
          })
          return
        }
        await new Promise(resolve => setTimeout(resolve, 2500))
        toast('Success', {
          description: 'Check your email for the OTP.',
        })
      }}>
        <div className="space-y-2 pb-6">
          <Input
            type="email"
            name="email"
            placeholder="Email"
            autoFocus
            required
            readOnly={loading}
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="ghost">
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" disabled={loading}>
            {loading ? <ReloadIcon className="animate-spin !size-4" /> : <></>}
            Send OTP
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
}
