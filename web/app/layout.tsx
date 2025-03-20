import { ThemeProvider } from '@/components/ui/theme-provider'
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
  title: 'Notes AI Assistant - Helpedby AI',
  description: 'A simple notes app with AI assistant.',
  authors: { name: 'M Gilang Januar' },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://notes.helpedby.ai',
    title: 'Notes AI Assistant - Helpedby AI',
    description: 'A simple notes app with AI assistant.',
    images: 'https://notes.helpedby.ai/og.png'
  },
  twitter: {
    card: 'summary_large_image',
    site: '@mgilangjanuar',
    creator: '@mgilangjanuar',
    title: 'Notes AI Assistant - Helpedby AI',
    description: 'A simple notes app with AI assistant.',
    images: 'https://notes.helpedby.ai/x.png'
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={GeistSans.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange={false}
        >
          <TooltipProvider delayDuration={0}>
            <UserProvider>
              {children}
            </UserProvider>
          </TooltipProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  )
}
