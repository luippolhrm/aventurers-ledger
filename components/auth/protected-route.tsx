"use client"

import { useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  children: ReactNode
  /**
   * Ruta a la que redirigir si no hay sesión (default: /auth/login)
   */
  redirectTo?: string
}

/**
 * Componente que protege rutas requiriendo autenticación
 * Redirige a login si no hay sesión activa
 * 
 * Uso:
 * ```tsx
 * export default function ProfilePage() {
 *   return (
 *     <ProtectedRoute>
 *       <ProfileContent />
 *     </ProtectedRoute>
 *   )
 * }
 * ```
 */
export function ProtectedRoute({ children, redirectTo = "/auth/login" }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Solo redirigir cuando termine de cargar y no haya usuario
    if (!loading && !user) {
      router.push(redirectTo)
    }
  }, [user, loading, router, redirectTo])

  // Mostrar loading mientras se verifica la sesión
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verificando sesión...</p>
        </div>
      </div>
    )
  }

  // Si no hay usuario, mostrar loading mientras redirige (evita flicker)
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Redirigiendo...</p>
        </div>
      </div>
    )
  }

  // Usuario autenticado, mostrar contenido
  return <>{children}</>
}
