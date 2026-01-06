/**
 * Tipos y interfaces para ProfileRepository
 */

export interface Profile {
  id: string
  display_name: string | null
  username: string | null
  role: "GM" | "PLAYER"
  created_at: string
  updated_at: string | null
}

export type CreateProfile = Omit<Profile, "id" | "created_at" | "updated_at"> & {
  id: string // Required for profile creation
}

export type UpdateProfile = Partial<Omit<Profile, "id" | "created_at" | "updated_at">>

