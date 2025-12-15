"use client"

import type React from "react"

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  description: string
}

export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-gradient-to-br from-yellow-900/10 via-amber-900/5 to-orange-900/10 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="relative rounded-lg border-2 border-amber-700 bg-gradient-to-b from-yellow-50 to-amber-100 p-8 shadow-2xl">
          {/* Decorative corner ornaments */}
          <div className="absolute left-4 top-4 h-3 w-3 border-l-2 border-t-2 border-amber-700"></div>
          <div className="absolute right-4 top-4 h-3 w-3 border-r-2 border-t-2 border-amber-700"></div>
          <div className="absolute bottom-4 left-4 h-3 w-3 border-l-2 border-b-2 border-amber-700"></div>
          <div className="absolute bottom-4 right-4 h-3 w-3 border-r-2 border-b-2 border-amber-700"></div>

          {/* Header */}
          <div className="mb-8 space-y-2 text-center">
            <h1 className="font-serif text-3xl font-bold text-amber-900">{title}</h1>
            <p className="text-sm text-amber-700/80">{description}</p>
          </div>

          {/* Content */}
          {children}
        </div>
      </div>
    </div>
  )
}
