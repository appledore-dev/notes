'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp'
import { useUser } from '@/hooks/use-user'
import { ReloadIcon } from '@radix-ui/react-icons'
import { useState } from 'react'
import { toast } from 'sonner'

export function DialogLogin({ title, description, children }: {
  title?: string
  description?: string
  children: React.ReactNode
}) {
  const { fetchUser } = useUser()
  const [openLogin, setOpenLogin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'ask-email' | 'ask-otp'>('ask-email')

  return <Dialog open={openLogin} onOpenChange={setOpenLogin}>
    <DialogTrigger asChild>
      {children}
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          {title || 'Sign in with Email'}
        </DialogTitle>
        <DialogDescription>
          {description || 'Enter your email address to receive a one-time password for signing in.'}
        </DialogDescription>
      </DialogHeader>
      {step === 'ask-email' ? <form onSubmit={async e => {
        e.preventDefault()
        if (!email) return

        setLoading(true)
        const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/otp`, {
          method: 'POST',
          body: JSON.stringify({
            email: email,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        })
        await new Promise(resolve => setTimeout(resolve, 2500))
        setLoading(false)
        if (!resp.ok) {
          toast('Error', {
            description: await resp.text(),
          })
          return
        }
        toast('Success', {
          description: 'Check your email for the OTP.',
        })
        setStep('ask-otp')
      }}>
        <div className="space-y-2 pb-6">
          <Input
            type="email"
            placeholder="Email"
            autoFocus
            required
            readOnly={loading}
            value={email}
            onChange={e => setEmail(e.target.value)}
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
      </form> : <></>}
      {step === 'ask-otp' ? <form onSubmit={async e => {
        e.preventDefault()
        if (!email || !otp) return

        setLoading(true)
        const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/otp-verify`, {
          method: 'POST',
          body: JSON.stringify({
            email: email,
            verification_code: otp,
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
        const json = await resp.json() as {
          access_token: string
        }
        toast('Success', {
          description: 'Logged in successfully.',
        })

        localStorage.setItem('access_token', json.access_token)
        setTimeout(() => {
          fetchUser()
        }, 500)

        setOpenLogin(false)
      }}>
        <div className="space-y-2 pb-6">
          <InputOTP maxLength={6} value={otp} onChange={setOtp} autoFocus>
            <InputOTPGroup className="[&>div]:grow [&>div]:h-full [&>div]:w-full [&>div]:aspect-square [&>div]:md:text-4xl [&>div]:text-2xl w-full">
              <InputOTPSlot index={0} autoFocus tabIndex={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup className="[&>div]:grow [&>div]:h-full [&>div]:w-full [&>div]:aspect-square [&>div]:md:text-4xl [&>div]:text-2xl w-full">
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="ghost">
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" disabled={loading}>
            {loading ? <ReloadIcon className="animate-spin !size-4" /> : <></>}
            Verify OTP
          </Button>
        </DialogFooter>
      </form> : <></>}
    </DialogContent>
  </Dialog>
}
