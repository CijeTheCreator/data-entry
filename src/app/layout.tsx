import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from 'react-hot-toast'
import './globals.css'

export const metadata: Metadata = {
  title: 'Entrify - Smart Document Processing',
  description: 'Transform any document into structured data with AI-powered automation. Upload once, extract forever.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link
            href="https://fonts.googleapis.com/css2?family=Proxima+Nova:wght@400;500;600;700&display=swap"
            rel="stylesheet"
          />
        </head>
        <body className="font-sans">
          <div className="min-h-screen bg-background">
            {children}
          </div>
          <Toaster position="top-right" />
        </body>
      </html>
    </ClerkProvider>
  )
}