import { TooltipProvider } from '@/components/ui/tooltip'
import { UserProvider } from '@/hooks/use-user'
import { GeistSans } from 'geist/font/sans'
import type { Metadata, Viewport } from 'next'
import { Toaster } from 'sonner'
import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  height: 'device-height',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: 'AI Text Editor',
  description: 'No description',
  authors: { name: 'M Gilang Januar' },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={GeistSans.className}>
        <TooltipProvider delayDuration={0}>
          <UserProvider>
            {children}
          </UserProvider>
        </TooltipProvider>
        <Toaster />
      </body>
    </html>
  )
}
