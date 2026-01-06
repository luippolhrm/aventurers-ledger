import {
  SupabaseShopRepository,
  type ShopRepository,
  type Shop,
  type ShopWithLocation,
  type CreateShop,
  type UpdateShop,
} from "@/lib/infrastructure/repositories/shop-repository"
import { CampaignService } from "./campaign-service"
import { ErrorService, ErrorCode } from "@/lib/infrastructure/errors"
import { ValidationUtils } from "../utils/validation"

/**
 * Servicio de aplicación para gestión de tiendas
 * Maneja la lógica de negocio relacionada con tiendas
 */
export class ShopService {
  constructor(
    private shopRepo: ShopRepository = new SupabaseShopRepository(),
    private campaignService: CampaignService = new CampaignService()
  ) {}

  /**
   * Obtiene una tienda por su ID
   */
  async getShop(shopId: string): Promise<Shop> {
    ValidationUtils.validateId(shopId, "Shop ID")

    const shop = await this.shopRepo.getById(shopId)
    if (!shop) {
      throw ErrorService.create(ErrorCode.NOT_FOUND, "Shop not found")
    }

    return shop
  }

  /**
   * Obtiene una tienda con información de su ubicación
   */
  async getShopWithLocation(shopId: string): Promise<ShopWithLocation> {
    ValidationUtils.validateId(shopId, "Shop ID")

    const shop = await this.shopRepo.getByIdWithLocation(shopId)
    if (!shop) {
      throw ErrorService.create(ErrorCode.NOT_FOUND, "Shop not found")
    }

    return shop
  }

  /**
   * Obtiene todas las tiendas de una ubicación
   */
  async getShopsByLocation(locationId: string): Promise<Shop[]> {
    ValidationUtils.validateId(locationId, "Location ID")
    return this.shopRepo.getByLocationId(locationId)
  }

  /**
   * Crea una nueva tienda
   * Valida que el usuario tenga acceso a la campaña de la ubicación
   */
  async createShop(shop: CreateShop, userId: string): Promise<Shop> {
    ValidationUtils.validateNonEmptyString(shop.name, "Shop name")
    ValidationUtils.validateId(shop.location_id, "Location ID")

    // Validar acceso a la ubicación/campaña se hace a nivel de RLS
    // El servicio solo valida los datos de entrada

    return this.shopRepo.create(shop)
  }

  /**
   * Actualiza una tienda
   */
  async updateShop(shopId: string, updates: UpdateShop): Promise<Shop> {
    ValidationUtils.validateId(shopId, "Shop ID")

    if (updates.name !== undefined) {
      ValidationUtils.validateNonEmptyString(updates.name, "Shop name")
    }

    return this.shopRepo.update(shopId, updates)
  }

  /**
   * Elimina una tienda
   */
  async deleteShop(shopId: string): Promise<void> {
    ValidationUtils.validateId(shopId, "Shop ID")
    await this.shopRepo.delete(shopId)
  }
}

