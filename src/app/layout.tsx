import type { Metadata } from 'next'
import './globals.css'
import Footer from '@/src/components/footer'

export const metadata: Metadata = {
  title: "Lisp Interpreter",
  description: "Open-source web app for writing Lisp code in the browser. Includes code evaluation and example programs like arithmetic and Fibonacci.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="flex flex-col min-h-screen h-full">
        <main className="flex-1 overflow-auto">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}