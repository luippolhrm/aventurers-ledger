"use client"

import type { ReactNode } from "react"
import { Sidebar } from "@/components/sidebar"
import { useLanguage } from "@/lib/language-context"

export default function AppLayout({ children }: { children: ReactNode }) {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen">
      <Sidebar includeProfileSettings={true} />
      <div className="flex-1 flex flex-col ml-0 md:ml-64 min-h-screen">
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          {children}
        </main>
        <footer className="py-6 px-4 text-center text-sm text-muted-foreground border-t border-border">
          <p>{t.footer.text}</p>
        </footer>
      </div>
    </div>
  )
}
