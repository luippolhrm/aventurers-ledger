"use client"

import type React from "react"
import type { User } from "@supabase/supabase-js"
import { useLanguage } from "@/lib/language-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useState, useMemo } from "react"
import { AuthService } from "@/lib/application/services"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { ErrorService } from "@/lib/infrastructure/errors"

interface ProfilePageContentProps {
  user: User
}

export default function ProfilePageContent({ user }: ProfilePageContentProps) {
  const { t } = useLanguage()
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const authService = useMemo(() => new AuthService(), [])

  const getUserInitials = () => {
    if (user.user_metadata?.full_name) {
      return user.user_metadata.full_name
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
    return user.user_metadata?.full_name || user.email || "User"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error(t.auth.passwordMismatch)
      return
    }

    setPasswordLoading(true)

    try {
      await authService.updatePassword(newPassword)
      toast.success("Password updated successfully")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : ErrorService.fromUnknownError(error).message
      toast.error(errorMessage || "Failed to update password")
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">{t.userMenu.profile}</h1>

      <div className="grid gap-6">
        {/* Profile Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>View your account details</CardDescription>
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
                <Label>Email</Label>
                <Input value={user.email || ""} disabled />
              </div>

              <div className="grid gap-2">
                <Label>Display Name</Label>
                <Input value={user.user_metadata?.full_name || ""} disabled />
              </div>

              <div className="grid gap-2">
                <Label>Account Created</Label>
                <Input value={formatDate(user.created_at)} disabled />
              </div>

              <div className="grid gap-2">
                <Label>Provider</Label>
                <Input
                  value={user.app_metadata?.provider === "google" ? "Google" : "Email"}
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
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                  />
                </div>

                <Button type="submit" disabled={passwordLoading}>
                  {passwordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Password
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
