'use client'

import { DialogLogin } from '@/components/dialog-login'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function SidebarBanner() {
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
          <DialogLogin>
            <Button
              className="w-full bg-sidebar-primary text-sidebar-primary-foreground shadow-none"
              size="sm"
            >
              Sign in with Email
            </Button>
          </DialogLogin>
        </CardContent>
      </form>
    </Card>
  )
}
