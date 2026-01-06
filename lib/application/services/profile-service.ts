import {
  SupabaseProfileRepository,
  type ProfileRepository,
  type Profile,
  type UpdateProfile,
} from "@/lib/infrastructure/repositories/profile-repository"
import { ErrorService, ErrorCode } from "@/lib/infrastructure/errors"
import { ValidationUtils } from "../utils/validation"

/**
 * Servicio de aplicación para manejo de perfiles de usuario
 * Contiene la lógica de negocio relacionada con perfiles
 */
export class ProfileService {
  constructor(
    private profileRepo: ProfileRepository = new SupabaseProfileRepository()
  ) {}

  /**
   * Obtiene un perfil por su ID
   * @param profileId ID del perfil (coincide con el ID del usuario)
   * @returns Profile del usuario
   * @throws AppError si el profileId es inválido o hay un error
   */
  async getProfile(profileId: string): Promise<Profile> {
    ValidationUtils.validateId(profileId, "Profile ID")

    const profile = await this.profileRepo.getById(profileId)
    if (!profile) {
      throw ErrorService.create(ErrorCode.NOT_FOUND, "Profile not found")
    }

    return profile
  }

  /**
   * Obtiene un perfil por username
   * @param username Username del perfil
   * @returns Profile del usuario o null si no existe
   * @throws AppError si hay un error
   */
  async getProfileByUsername(username: string): Promise<Profile | null> {
    ValidationUtils.validateNonEmptyString(username, "Username")
    return this.profileRepo.getByUsername(username)
  }

  /**
   * Actualiza un perfil
   * @param profileId ID del perfil
   * @param updates Datos parciales del perfil a actualizar
   * @returns Profile actualizado
   * @throws AppError si hay un error
   */
  async updateProfile(profileId: string, updates: UpdateProfile): Promise<Profile> {
    ValidationUtils.validateId(profileId, "Profile ID")

    // Validar que el username no esté duplicado si se está actualizando
    if (updates.username) {
      const existing = await this.profileRepo.getByUsername(updates.username)
      if (existing && existing.id !== profileId) {
        throw ErrorService.create(
          ErrorCode.VALIDATION_ERROR,
          "Username is already taken"
        )
      }
    }

    return this.profileRepo.update(profileId, updates)
  }

  /**
   * Verifica si un username está disponible
   * @param username Username a verificar
   * @returns true si está disponible, false en caso contrario
   */
  async isUsernameAvailable(username: string): Promise<boolean> {
    ValidationUtils.validateNonEmptyString(username, "Username")
    return this.profileRepo.isUsernameAvailable(username)
  }
}

