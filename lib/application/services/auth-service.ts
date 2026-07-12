import { createBrowserClient } from "@/lib/supabase/client"
import type { SupabaseClient, AuthApiError } from "@supabase/supabase-js"
import { ErrorService, ErrorCode } from "@/lib/infrastructure/errors"
import { ValidationUtils } from "../utils/validation"

export interface SignUpData {
  email: string
  password: string
  displayName: string
}

export interface SignInData {
  email: string
  password: string
}

/**
 * Servicio de aplicación para autenticación
 * Maneja sign-up, sign-in, sign-out y actualización de contraseñas
 * 
 * Nota: El perfil se crea automáticamente mediante trigger de la base de datos
 * No es necesario crear el perfil manualmente después del sign-up
 */
export class AuthService {
  constructor(private supabase: SupabaseClient = createBrowserClient()) {}

  /**
   * Registra un nuevo usuario
   * El perfil se crea automáticamente mediante trigger de la base de datos
   * @param data Datos del usuario a registrar
   * @returns Usuario creado
   * @throws AppError si hay un error de validación o infraestructura
   */
  async signUp(data: SignUpData): Promise<{ user: any; session: any }> {
    // Validar email con formato correcto
    ValidationUtils.validateEmail(data.email, "Email")
    ValidationUtils.validateNonEmptyString(data.password, "Password")
    ValidationUtils.validateNonEmptyString(data.displayName, "Display name")

    if (data.password.length < 6) {
      throw ErrorService.create(
        ErrorCode.WEAK_PASSWORD,
        "La contraseña debe tener al menos 6 caracteres"
      )
    }

    const { data: authData, error } = await this.supabase.auth.signUp({
      email: data.email.trim(),
      password: data.password,
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
          `${typeof window !== "undefined" ? window.location.origin : ""}/dashboard`,
        data: {
          display_name: data.displayName,
        },
      },
    })

    if (error) {
      // Usar fromAuthError para errores de autenticación
      throw ErrorService.fromAuthError(error as AuthApiError)
    }

    if (!authData.user) {
      throw ErrorService.create(ErrorCode.VALIDATION_ERROR, "No se pudo crear el usuario")
    }

    // El perfil se crea automáticamente mediante trigger
    // No es necesario crearlo manualmente aquí

    return {
      user: authData.user,
      session: authData.session,
    }
  }

  /**
   * Inicia sesión con email y contraseña
   * @param data Credenciales de inicio de sesión
   * @returns Sesión creada
   * @throws AppError si hay un error de validación o infraestructura
   */
  async signIn(data: SignInData): Promise<{ user: any; session: any }> {
    // Validar email con formato correcto
    ValidationUtils.validateEmail(data.email, "Email")
    ValidationUtils.validateNonEmptyString(data.password, "Password")

    const { data: authData, error } = await this.supabase.auth.signInWithPassword({
      email: data.email.trim(),
      password: data.password,
    })

    if (error) {
      // Usar fromAuthError para errores de autenticación
      throw ErrorService.fromAuthError(error as AuthApiError)
    }

    if (!authData.user || !authData.session) {
      throw ErrorService.create(ErrorCode.INVALID_CREDENTIALS, "Credenciales inválidas")
    }

    return {
      user: authData.user,
      session: authData.session,
    }
  }

  /**
   * Inicia sesión con OAuth (Google, etc.)
   * @param provider Proveedor OAuth
   * @param redirectTo URL de redirección después de la autenticación
   * @throws AppError si hay un error
   */
  async signInWithOAuth(
    provider: "google" | "github" | "discord",
    redirectTo?: string
  ): Promise<void> {
    const origin = typeof window !== "undefined" ? window.location.origin : ""
    const redirectUrl = redirectTo || `${origin}/auth/callback`

    const { error } = await this.supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectUrl,
      },
    })

    if (error) {
      // Usar fromAuthError para errores de autenticación
      throw ErrorService.fromAuthError(error as AuthApiError)
    }
  }

  /**
   * Cierra la sesión del usuario actual
   * @throws AppError si hay un error
   */
  async signOut(): Promise<void> {
    const { error } = await this.supabase.auth.signOut()

    if (error) {
      throw ErrorService.fromUnknownError(error)
    }
  }

  /**
   * Actualiza la contraseña del usuario actual
   * @param newPassword Nueva contraseña
   * @throws AppError si hay un error de validación o infraestructura
   */
  async updatePassword(newPassword: string): Promise<void> {
    ValidationUtils.validateNonEmptyString(newPassword, "Password")

    if (newPassword.length < 6) {
      throw ErrorService.create(
        ErrorCode.WEAK_PASSWORD,
        "La contraseña debe tener al menos 6 caracteres"
      )
    }

    const { error } = await this.supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      // Usar fromAuthError para errores de autenticación
      throw ErrorService.fromAuthError(error as AuthApiError)
    }
  }

  /**
   * Actualiza los metadatos del usuario (como full_name)
   * @param metadata Objeto con los metadatos a actualizar
   * @throws AppError si hay un error
   */
  async updateUserMetadata(metadata: { full_name?: string }): Promise<void> {
    const { error } = await this.supabase.auth.updateUser({
      data: metadata,
    })

    if (error) {
      throw ErrorService.fromUnknownError(error)
    }
  }

  /**
   * Obtiene la sesión actual del usuario
   * @returns Sesión actual o null si no hay sesión
   */
  async getSession(): Promise<{ session: any; user: any } | null> {
    const {
      data: { session },
      error,
    } = await this.supabase.auth.getSession()

    if (error) {
      throw ErrorService.fromUnknownError(error)
    }

    if (!session || !session.user) {
      return null
    }

    return {
      session,
      user: session.user,
    }
  }

  /**
   * Obtiene el usuario actual
   * @returns Usuario actual o null si no hay usuario
   */
  async getUser(): Promise<any | null> {
    const {
      data: { user },
      error,
    } = await this.supabase.auth.getUser()

    if (error) {
      throw ErrorService.fromUnknownError(error)
    }

    return user
  }
}

