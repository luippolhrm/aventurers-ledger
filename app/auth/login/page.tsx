"use client"

import type React from "react"

import { AuthService } from "@/lib/application/services"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthLayout } from "@/components/auth-layout"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useMemo } from "react"
import { useLanguage } from "@/lib/language-context"
import { ErrorService } from "@/lib/infrastructure/errors"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { t } = useLanguage()
  const authService = useMemo(() => new AuthService(), [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      await authService.signIn({ email, password })
      router.push("/dashboard")
      router.refresh()
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : ErrorService.fromUnknownError(error).message
      setError(errorMessage || t.auth.loginError)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError(null)

    try {
      await authService.signInWithOAuth("google")
      // El redirect se maneja automáticamente por OAuth
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : ErrorService.fromUnknownError(error).message
      setError(errorMessage || t.auth.loginError)
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout title={t.auth.login} description={t.auth.loginDescription}>
      <form onSubmit={handleLogin}>
        <div className="flex flex-col gap-6">
          <Button
            type="button"
            variant="outline"
            className="w-full border-amber-700 bg-amber-50 text-amber-900 hover:bg-amber-100"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {t.auth.signInWithGoogle}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-amber-300" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-gradient-to-b from-yellow-50 to-amber-100 px-2 text-amber-700 font-semibold">
                {t.auth.orContinueWith}
              </span>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email" className="text-amber-900">
              {t.auth.email}
            </Label>
            <Input
              id="email"
              type="email"
              placeholder={t.auth.emailPlaceholder}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-amber-400 bg-white/60 focus:border-amber-600"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password" className="text-amber-900">
              {t.auth.password}
            </Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-amber-400 bg-white/60 focus:border-amber-600"
            />
          </div>
          {error && <p className="text-sm text-amber-700 font-semibold">{error}</p>}
          <Button
            type="submit"
            className="w-full bg-amber-700 hover:bg-amber-800 text-white font-semibold"
            disabled={isLoading}
          >
            {isLoading ? t.auth.loggingIn : t.auth.login}
          </Button>
        </div>
        <div className="mt-4 text-center text-sm text-amber-800">
          {t.auth.noAccount}{" "}
          <Link
            href="/auth/sign-up"
            className="font-semibold text-amber-900 hover:text-amber-700 underline underline-offset-2"
          >
            {t.auth.signUp}
          </Link>
        </div>
      </form>
    </AuthLayout>
  )
}
