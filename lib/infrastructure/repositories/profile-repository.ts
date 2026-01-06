import { createBrowserClient } from "@/lib/supabase/client"
import type { SupabaseClient } from "@supabase/supabase-js"
import { ErrorService, ErrorCode } from "@/lib/infrastructure/errors"
import type { Profile, CreateProfile, UpdateProfile } from "./profile-repository.types"

// Re-export types
export type { Profile, CreateProfile, UpdateProfile } from "./profile-repository.types"

/**
 * Interfaz del repositorio de Profiles
 * Define el contrato que deben cumplir todas las implementaciones
 */
export interface ProfileRepository {
  /**
   * Obtiene un perfil por su ID
   */
  getById(profileId: string): Promise<Profile | null>

  /**
   * Obtiene un perfil por username
   */
  getByUsername(username: string): Promise<Profile | null>

  /**
   * Crea un nuevo perfil
   * Nota: Normalmente el trigger de la base de datos crea el perfil automáticamente
   * Este método es útil para casos especiales o migraciones
   */
  create(profile: CreateProfile): Promise<Profile>

  /**
   * Actualiza un perfil
   */
  update(profileId: string, updates: UpdateProfile): Promise<Profile>

  /**
   * Verifica si un username está disponible
   */
  isUsernameAvailable(username: string): Promise<boolean>
}

/**
 * Implementación de ProfileRepository usando Supabase
 */
export class SupabaseProfileRepository implements ProfileRepository {
  constructor(private supabase: SupabaseClient = createBrowserClient()) {}

  async getById(profileId: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("*")
      .eq("id", profileId)
      .maybeSingle()

    if (error && error.code !== "PGRST116") {
      throw ErrorService.fromSupabaseError(error)
    }

    return data ? this.mapToProfile(data) : null
  }

  async getByUsername(username: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("*")
      .eq("username", username)
      .maybeSingle()

    if (error && error.code !== "PGRST116") {
      throw ErrorService.fromSupabaseError(error)
    }

    return data ? this.mapToProfile(data) : null
  }

  async create(profile: CreateProfile): Promise<Profile> {
    const { data, error } = await this.supabase
      .from("profiles")
      .insert({
        id: profile.id,
        display_name: profile.display_name,
        username: profile.username,
        role: profile.role || "PLAYER",
      })
      .select()
      .single()

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    if (!data) {
      throw ErrorService.create(ErrorCode.VALIDATION_ERROR, "Failed to create profile")
    }

    return this.mapToProfile(data)
  }

  async update(profileId: string, updates: UpdateProfile): Promise<Profile> {
    const { data, error } = await this.supabase
      .from("profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profileId)
      .select()
      .single()

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    if (!data) {
      throw ErrorService.create(ErrorCode.NOT_FOUND, "Profile not found")
    }

    return this.mapToProfile(data)
  }

  async isUsernameAvailable(username: string): Promise<boolean> {
    const existing = await this.getByUsername(username)
    return existing === null
  }

  /**
   * Mapea los datos de Supabase a Profile
   */
  private mapToProfile(data: any): Profile {
    return {
      id: data.id,
      display_name: data.display_name || null,
      username: data.username || null,
      role: data.role || "PLAYER",
      created_at: data.created_at,
      updated_at: data.updated_at || null,
    }
  }
}

