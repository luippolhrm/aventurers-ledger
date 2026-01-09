"use client"

import type React from "react"
import type { User } from "@supabase/supabase-js"
import { useLanguage } from "@/lib/language-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthService } from "@/lib/application/services"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { ErrorService } from "@/lib/infrastructure/errors"

interface ProfilePageContentProps {
  user: User
}

export default function ProfilePageContent({ user }: ProfilePageContentProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [displayNameLoading, setDisplayNameLoading] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [displayName, setDisplayName] = useState(user.user_metadata?.full_name || "")
  const authService = useMemo(() => new AuthService(), [])

  // Sincronizar displayName cuando cambie el usuario
  useEffect(() => {
    setDisplayName(user.user_metadata?.full_name || "")
  }, [user.user_metadata?.full_name])

  const getUserInitials = () => {
    const name = displayName || user.user_metadata?.full_name
    if (name) {
      return name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    if (user.email) {
      return user.email[0].toUpperCase()
    }
    return "U"
  }

  const getUserDisplayName = () => {
    return displayName || user.user_metadata?.full_name || user.email || "Usuario"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const handleUpdateDisplayName = async () => {
    if (!displayName.trim()) {
      toast.error(t.profile.displayNameEmpty)
      return
    }

    if (displayName === (user.user_metadata?.full_name || "")) {
      return // No hay cambios
    }

    setDisplayNameLoading(true)

    try {
      await authService.updateUserMetadata({ full_name: displayName.trim() })
      toast.success(t.profile.displayNameUpdated)
      router.refresh() // Refrescar para obtener el usuario actualizado
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : ErrorService.fromUnknownError(error).message
      toast.error(errorMessage || t.profile.displayNameError)
    } finally {
      setDisplayNameLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error(t.profile.passwordMismatch)
      return
    }

    setPasswordLoading(true)

    try {
      await authService.updatePassword(newPassword)
      toast.success(t.profile.passwordUpdated)
      setNewPassword("")
      setConfirmPassword("")
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : ErrorService.fromUnknownError(error).message
      toast.error(errorMessage || t.profile.passwordError)
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="grid gap-6">
        {/* Profile Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t.profile.profileInformation}</CardTitle>
            <CardDescription>{t.profile.viewAccountDetails}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.user_metadata?.avatar_url || "/placeholder.svg"} alt={getUserDisplayName()} />
                <AvatarFallback className="text-2xl">{getUserInitials()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-lg font-medium">{getUserDisplayName()}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>{t.profile.email}</Label>
                <Input value={user.email || ""} disabled />
              </div>

              <div className="grid gap-2">
                <Label>{t.profile.displayName}</Label>
                <div className="flex gap-2">
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={t.profile.displayName}
                    disabled={displayNameLoading}
                  />
                  <Button
                    onClick={handleUpdateDisplayName}
                    disabled={displayNameLoading || displayName === (user.user_metadata?.full_name || "")}
                    type="button"
                  >
                    {displayNameLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t.profile.updateDisplayName}
                  </Button>
                </div>
              </div>

              <div className="grid gap-2">
                <Label>{t.profile.accountCreated}</Label>
                <Input value={formatDate(user.created_at)} disabled />
              </div>

              <div className="grid gap-2">
                <Label>{t.profile.accountProvider}</Label>
                <Input
                  value={user.app_metadata?.provider === "google" ? t.profile.googleAccount : t.profile.email}
                  disabled
                  className="capitalize"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Change Password Card - Only for email users */}
        {user.app_metadata?.provider !== "google" && (
          <Card>
            <CardHeader>
              <CardTitle>{t.profile.changePassword}</CardTitle>
              <CardDescription>{t.profile.passwordSettings}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="newPassword">{t.profile.newPassword}</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t.profile.enterNewPasswordPlaceholder}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">{t.profile.confirmNewPassword}</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t.profile.confirmNewPasswordPlaceholder}
                    required
                  />
                </div>

                <Button type="submit" disabled={passwordLoading}>
                  {passwordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t.profile.updatePassword}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
