'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useUser } from '@/hooks/use-user'

export function SidebarBanner() {
  const { fetchUser } = useUser()

  return (
    <Card className="shadow-none py-0">
      <form>
        <CardHeader className="p-4 pb-0">
          <CardTitle>
            Login
          </CardTitle>
          <CardDescription>
            Sign in with your email to securely save your documents.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2.5 p-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                className="w-full bg-sidebar-primary text-sidebar-primary-foreground shadow-none"
                size="sm"
              >
                Sign in with Email
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  Sign in with Email
                </DialogTitle>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </CardContent>
      </form>
    </Card>
  )
}
