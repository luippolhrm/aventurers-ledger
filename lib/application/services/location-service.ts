import {
  SupabaseLocationRepository,
  type LocationRepository,
  type Location,
  type LocationWithShops,
  type CreateLocation,
  type UpdateLocation,
} from "@/lib/infrastructure/repositories/location-repository"
import { CampaignService } from "./campaign-service"
import { ErrorService, ErrorCode } from "@/lib/infrastructure/errors"
import { ValidationUtils } from "../utils/validation"

/**
 * Servicio de aplicación para gestión de ubicaciones
 * Maneja la lógica de negocio relacionada con ubicaciones
 */
export class LocationService {
  constructor(
    private locationRepo: LocationRepository = new SupabaseLocationRepository(),
    private campaignService: CampaignService = new CampaignService()
  ) {}

  /**
   * Obtiene una ubicación por su ID
   */
  async getLocation(locationId: string): Promise<Location> {
    ValidationUtils.validateId(locationId, "Location ID")

    const location = await this.locationRepo.getById(locationId)
    if (!location) {
      throw ErrorService.create(ErrorCode.NOT_FOUND, "Location not found")
    }

    return location
  }

  /**
   * Obtiene una ubicación con sus tiendas
   */
  async getLocationWithShops(locationId: string): Promise<LocationWithShops> {
    ValidationUtils.validateId(locationId, "Location ID")

    const location = await this.locationRepo.getByIdWithShops(locationId)
    if (!location) {
      throw ErrorService.create(ErrorCode.NOT_FOUND, "Location not found")
    }

    return location
  }

  /**
   * Obtiene todas las ubicaciones de una campaña
   */
  async getLocationsByCampaign(campaignId: string): Promise<Location[]> {
    ValidationUtils.validateId(campaignId, "Campaign ID")
    return this.locationRepo.getByCampaignId(campaignId)
  }

  /**
   * Crea una nueva ubicación
   * Valida que el usuario tenga acceso a la campaña
   */
  async createLocation(location: CreateLocation, userId: string): Promise<Location> {
    ValidationUtils.validateNonEmptyString(location.name, "Location name")
    ValidationUtils.validateId(location.campaign_id, "Campaign ID")

    // Validar acceso a la campaña se hace a nivel de RLS
    // El servicio solo valida los datos de entrada

    return this.locationRepo.create(location)
  }

  /**
   * Actualiza una ubicación
   */
  async updateLocation(locationId: string, updates: UpdateLocation): Promise<Location> {
    ValidationUtils.validateId(locationId, "Location ID")

    if (updates.name !== undefined) {
      ValidationUtils.validateNonEmptyString(updates.name, "Location name")
    }

    return this.locationRepo.update(locationId, updates)
  }

  /**
   * Elimina una ubicación
   */
  async deleteLocation(locationId: string): Promise<void> {
    ValidationUtils.validateId(locationId, "Location ID")
    await this.locationRepo.delete(locationId)
  }
}

