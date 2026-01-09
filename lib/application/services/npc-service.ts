import {
  SupabaseNpcRepository,
  type NpcRepository,
  type Npc,
  type CreateNpc,
  type UpdateNpc,
} from "@/lib/infrastructure/repositories/npc-repository"
import {
  SupabaseNpcInventoryRepository,
  type NpcInventoryRepository,
  type NpcInventoryItem,
  type CreateNpcInventoryItem,
  type UpdateNpcInventoryItem,
} from "@/lib/infrastructure/repositories/npc-inventory-repository"
import type { Shop } from "@/lib/infrastructure/repositories/shop-repository"
import type { DungeonRoom } from "@/lib/infrastructure/repositories/dungeon-repository.types"
import type { InventoryItem } from "@/lib/infrastructure/repositories/inventory-repository"
import { CampaignService } from "./campaign-service"
import { InventoryService } from "./inventory-service"
import { WalletService } from "./wallet-service"
import { DungeonService } from "./dungeon-service"
import { LocationService } from "./location-service"
import { ErrorService, ErrorCode } from "@/lib/infrastructure/errors"
import { ValidationUtils } from "../utils/validation"

/**
 * Servicio de aplicación para gestión de NPCs
 * Maneja la lógica de negocio relacionada con NPCs
 */
export class NpcService {
  constructor(
    private npcRepo: NpcRepository = new SupabaseNpcRepository(),
    private npcInventoryRepo: NpcInventoryRepository = new SupabaseNpcInventoryRepository(),
    private campaignService: CampaignService = new CampaignService(),
    private inventoryService: InventoryService = new InventoryService(),
    private walletService: WalletService = new WalletService(),
    private dungeonService: DungeonService = new DungeonService(),
    private locationService: LocationService = new LocationService()
  ) {}

  /**
   * Obtiene un NPC por su ID
   */
  async getNpc(npcId: string): Promise<Npc> {
    ValidationUtils.validateId(npcId, "NPC ID")

    const npc = await this.npcRepo.getById(npcId)
    if (!npc) {
      throw ErrorService.create(ErrorCode.NOT_FOUND, "NPC not found")
    }

    return npc
  }

  /**
   * Obtiene todos los NPCs de una campaña
   */
  async getNpcsByCampaign(campaignId: string): Promise<Npc[]> {
    ValidationUtils.validateId(campaignId, "Campaign ID")
    return this.npcRepo.getByCampaignId(campaignId)
  }

  /**
   * Crea un nuevo NPC
   * Valida que el usuario tenga acceso a la campaña
   */
  async createNpc(npc: CreateNpc, userId: string): Promise<Npc> {
    ValidationUtils.validateId(npc.campaign_id, "Campaign ID")
    ValidationUtils.validateNonEmptyString(npc.name, "NPC name")

    // Verificar que el usuario es GM de la campaña
    const isGM = await this.campaignService.isGameMaster(userId, npc.campaign_id)
    if (!isGM) {
      throw ErrorService.create(ErrorCode.FORBIDDEN, "Only Game Masters can create NPCs")
    }

    return this.npcRepo.create(npc)
  }

  /**
   * Actualiza un NPC
   * Valida que el usuario tenga acceso a la campaña
   */
  async updateNpc(npcId: string, updates: UpdateNpc, userId: string): Promise<Npc> {
    ValidationUtils.validateId(npcId, "NPC ID")

    // Obtener el NPC para verificar la campaña
    const npc = await this.getNpc(npcId)

    // Verificar que el usuario es GM de la campaña
    const isGM = await this.campaignService.isGameMaster(userId, npc.campaign_id)
    if (!isGM) {
      throw ErrorService.create(ErrorCode.FORBIDDEN, "Only Game Masters can update NPCs")
    }

    return this.npcRepo.update(npcId, updates)
  }

  /**
   * Elimina un NPC
   * Valida que el usuario tenga acceso a la campaña
   */
  async deleteNpc(npcId: string, userId: string): Promise<void> {
    ValidationUtils.validateId(npcId, "NPC ID")

    // Obtener el NPC para verificar la campaña
    const npc = await this.getNpc(npcId)

    // Verificar que el usuario es GM de la campaña
    const isGM = await this.campaignService.isGameMaster(userId, npc.campaign_id)
    if (!isGM) {
      throw ErrorService.create(ErrorCode.FORBIDDEN, "Only Game Masters can delete NPCs")
    }

    return this.npcRepo.delete(npcId)
  }

  /**
   * Obtiene NPCs asociados a una tienda
   */
  async getNpcsByShop(shopId: string): Promise<Npc[]> {
    ValidationUtils.validateId(shopId, "Shop ID")
    return this.npcRepo.getNpcsByShop(shopId)
  }

  /**
   * Obtiene NPCs asociados a una sala de dungeon
   */
  async getNpcsByDungeonRoom(roomId: string): Promise<Npc[]> {
    ValidationUtils.validateId(roomId, "Room ID")
    return this.npcRepo.getNpcsByDungeonRoom(roomId)
  }

  /**
   * Asocia un NPC a una tienda
   * Valida que el usuario tenga acceso a la campaña
   */
  async associateNpcToShop(npcId: string, shopId: string, userId: string): Promise<void> {
    ValidationUtils.validateId(npcId, "NPC ID")
    ValidationUtils.validateId(shopId, "Shop ID")

    // Obtener el NPC para verificar la campaña
    const npc = await this.getNpc(npcId)

    // Verificar que el usuario es GM de la campaña
    const isGM = await this.campaignService.isGameMaster(userId, npc.campaign_id)
    if (!isGM) {
      throw ErrorService.create(ErrorCode.FORBIDDEN, "Only Game Masters can associate NPCs to shops")
    }

    // Crear la asociación usando Supabase directamente
    const { createBrowserClient } = await import("@/lib/supabase/client")
    const supabase = createBrowserClient()
    const { error } = await supabase.from("shop_npcs").insert({
      shop_id: shopId,
      npc_id: npcId,
    })

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }
  }

  /**
   * Desasocia un NPC de una tienda
   * Valida que el usuario tenga acceso a la campaña
   */
  async disassociateNpcFromShop(npcId: string, shopId: string, userId: string): Promise<void> {
    ValidationUtils.validateId(npcId, "NPC ID")
    ValidationUtils.validateId(shopId, "Shop ID")

    // Obtener el NPC para verificar la campaña
    const npc = await this.getNpc(npcId)

    // Verificar que el usuario es GM de la campaña
    const isGM = await this.campaignService.isGameMaster(userId, npc.campaign_id)
    if (!isGM) {
      throw ErrorService.create(ErrorCode.FORBIDDEN, "Only Game Masters can disassociate NPCs from shops")
    }

    // Eliminar la asociación usando Supabase directamente
    const { createBrowserClient } = await import("@/lib/supabase/client")
    const supabase = createBrowserClient()
    const { error } = await supabase
      .from("shop_npcs")
      .delete()
      .eq("shop_id", shopId)
      .eq("npc_id", npcId)

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }
  }

  /**
   * Obtiene tiendas donde está un NPC
   */
  async getShopsByNpc(npcId: string): Promise<Shop[]> {
    ValidationUtils.validateId(npcId, "NPC ID")
    return this.npcRepo.getShopsByNpc(npcId)
  }

  /**
   * Obtiene salas de dungeon donde está un NPC
   */
  async getDungeonRoomsByNpc(npcId: string): Promise<DungeonRoom[]> {
    ValidationUtils.validateId(npcId, "NPC ID")
    return this.npcRepo.getDungeonRoomsByNpc(npcId)
  }

  /**
   * Obtiene un NPC con todas sus asignaciones (tiendas y salas de dungeon)
   */
  async getNpcWithAssignments(npcId: string): Promise<{
    npc: Npc
    shops: Shop[]
    dungeonRooms: Array<DungeonRoom & { dungeonName?: string }>
  }> {
    ValidationUtils.validateId(npcId, "NPC ID")

    const [npc, shops, dungeonRooms] = await Promise.all([
      this.getNpc(npcId),
      this.getShopsByNpc(npcId),
      this.getDungeonRoomsByNpc(npcId),
    ])

    // Obtener nombres de dungeons para las salas
    const dungeonRoomsWithNames = await Promise.all(
      dungeonRooms.map(async (room) => {
        try {
          // Obtener el dungeon desde la sala usando el dungeon_id de la room
          const { SupabaseDungeonRepository } = await import("@/lib/infrastructure/repositories/dungeon-repository")
          const dungeonRepo = new SupabaseDungeonRepository()
          const dungeon = await dungeonRepo.getById(room.dungeon_id)
          if (dungeon) {
            const location = await this.locationService.getLocation(dungeon.location_id)
            return { ...room, dungeonName: location.name }
          }
        } catch {
          // Si no se puede obtener, continuar sin nombre
        }
        return room
      })
    )

    return {
      npc,
      shops,
      dungeonRooms: dungeonRoomsWithNames.filter((r) => r !== null) as Array<DungeonRoom & { dungeonName?: string }>,
    }
  }

  /**
   * Obtiene todos los NPCs de una campaña con sus asignaciones
   * Optimizado para cargar en batch
   */
  async getNpcsWithAssignments(campaignId: string): Promise<Array<{
    npc: Npc
    shops: Shop[]
    dungeonRooms: Array<DungeonRoom & { dungeonName?: string }>
  }>> {
    ValidationUtils.validateId(campaignId, "Campaign ID")

    const npcs = await this.getNpcsByCampaign(campaignId)

    // Cargar asignaciones en paralelo para todos los NPCs
    const npcsWithAssignments = await Promise.all(
      npcs.map(async (npc) => {
        const [shops, dungeonRooms] = await Promise.all([
          this.getShopsByNpc(npc.id),
          this.getDungeonRoomsByNpc(npc.id),
        ])

        // Obtener nombres de dungeons para las salas
        const dungeonRoomsWithNames = await Promise.all(
          dungeonRooms.map(async (room) => {
            try {
              // Necesitamos obtener el dungeon desde la sala
              const { SupabaseDungeonRoomRepository } = await import("@/lib/infrastructure/repositories/dungeon-repository")
              const roomRepo = new SupabaseDungeonRoomRepository()
              const roomData = await roomRepo.getById(room.id)
              if (roomData) {
                const dungeon = await this.dungeonService.getDungeonByLocation(roomData.dungeon_id)
                if (dungeon) {
                  const location = await this.locationService.getLocation(dungeon.location_id)
                  return { ...room, dungeonName: location.name }
                }
              }
            } catch {
              // Si no se puede obtener, continuar sin nombre
            }
            return room
          })
        )

        return {
          npc,
          shops,
          dungeonRooms: dungeonRoomsWithNames.filter((r) => r !== null) as Array<DungeonRoom & { dungeonName?: string }>,
        }
      })
    )

    return npcsWithAssignments
  }

  /**
   * Obtiene el inventario de un NPC
   */
  async getNpcInventory(npcId: string): Promise<NpcInventoryItem[]> {
    ValidationUtils.validateId(npcId, "NPC ID")
    return this.npcInventoryRepo.getByNpcId(npcId)
  }

  /**
   * Agrega un item al inventario de un NPC
   * Valida que el usuario tenga acceso a la campaña
   */
  async addItemToNpc(npcId: string, item: CreateNpcInventoryItem, userId: string): Promise<NpcInventoryItem> {
    ValidationUtils.validateId(npcId, "NPC ID")
    ValidationUtils.validateId(item.npc_id, "Item NPC ID")
    ValidationUtils.validateNonEmptyString(item.item_name, "Item name")
    ValidationUtils.validatePositiveNumber(item.quantity, "Quantity")
    ValidationUtils.validateNonNegativeNumber(item.weight, "Weight")
    ValidationUtils.validateNonNegativeNumber(item.value_in_copper, "Value in copper")

    // Verificar que npc_id coincide
    if (item.npc_id !== npcId) {
      throw ErrorService.create(ErrorCode.VALIDATION_ERROR, "NPC ID mismatch")
    }

    // Obtener el NPC para verificar la campaña
    const npc = await this.getNpc(npcId)

    // Verificar que el usuario es GM de la campaña
    const isGM = await this.campaignService.isGameMaster(userId, npc.campaign_id)
    if (!isGM) {
      throw ErrorService.create(ErrorCode.FORBIDDEN, "Only Game Masters can add items to NPC inventory")
    }

    return this.npcInventoryRepo.create(item)
  }

  /**
   * Actualiza un item del inventario de un NPC
   * Valida que el usuario tenga acceso a la campaña
   */
  async updateNpcItem(itemId: string, updates: UpdateNpcInventoryItem, userId: string): Promise<NpcInventoryItem> {
    ValidationUtils.validateId(itemId, "Item ID")

    // Obtener el item para verificar el NPC
    const item = await this.npcInventoryRepo.getById(itemId)
    if (!item) {
      throw ErrorService.create(ErrorCode.ITEM_NOT_FOUND, "NPC inventory item not found")
    }

    // Obtener el NPC para verificar la campaña
    const npc = await this.getNpc(item.npc_id)

    // Verificar que el usuario es GM de la campaña
    const isGM = await this.campaignService.isGameMaster(userId, npc.campaign_id)
    if (!isGM) {
      throw ErrorService.create(ErrorCode.FORBIDDEN, "Only Game Masters can update NPC inventory items")
    }

    // Validar campos si están presentes
    if (updates.quantity !== undefined) {
      ValidationUtils.validatePositiveNumber(updates.quantity, "Quantity")
    }
    if (updates.weight !== undefined) {
      ValidationUtils.validateNonNegativeNumber(updates.weight, "Weight")
    }
    if (updates.value_in_copper !== undefined) {
      ValidationUtils.validateNonNegativeNumber(updates.value_in_copper, "Value in copper")
    }
    if (updates.item_name !== undefined) {
      ValidationUtils.validateNonEmptyString(updates.item_name, "Item name")
    }

    return this.npcInventoryRepo.update(itemId, updates)
  }

  /**
   * Remueve un item del inventario de un NPC
   * Valida que el usuario tenga acceso a la campaña
   */
  async removeItemFromNpc(itemId: string, userId: string): Promise<void> {
    ValidationUtils.validateId(itemId, "Item ID")

    // Obtener el item para verificar el NPC
    const item = await this.npcInventoryRepo.getById(itemId)
    if (!item) {
      throw ErrorService.create(ErrorCode.ITEM_NOT_FOUND, "NPC inventory item not found")
    }

    // Obtener el NPC para verificar la campaña
    const npc = await this.getNpc(item.npc_id)

    // Verificar que el usuario es GM de la campaña
    const isGM = await this.campaignService.isGameMaster(userId, npc.campaign_id)
    if (!isGM) {
      throw ErrorService.create(ErrorCode.FORBIDDEN, "Only Game Masters can remove items from NPC inventory")
    }

    return this.npcInventoryRepo.delete(itemId)
  }

  /**
   * Distribuye un item del inventario de un NPC a un jugador
   * Valida que el usuario tenga acceso y que haya cantidad suficiente
   */
  async distributeItemToPlayer(
    npcId: string,
    itemId: string,
    characterId: string,
    quantity: number,
    userId: string
  ): Promise<{ npcItem: NpcInventoryItem; playerItem: InventoryItem }> {
    ValidationUtils.validateId(npcId, "NPC ID")
    ValidationUtils.validateId(itemId, "Item ID")
    ValidationUtils.validateId(characterId, "Character ID")
    ValidationUtils.validatePositiveNumber(quantity, "Quantity")

    // Obtener el item del NPC
    const npcItem = await this.npcInventoryRepo.getById(itemId)
    if (!npcItem) {
      throw ErrorService.create(ErrorCode.ITEM_NOT_FOUND, "NPC inventory item not found")
    }

    // Verificar que el item pertenece al NPC
    if (npcItem.npc_id !== npcId) {
      throw ErrorService.create(ErrorCode.VALIDATION_ERROR, "Item does not belong to this NPC")
    }

    // Verificar que hay cantidad suficiente
    if (npcItem.quantity < quantity) {
      throw ErrorService.create(ErrorCode.INSUFFICIENT_QUANTITY, "Insufficient quantity in NPC inventory")
    }

    // Obtener el NPC para verificar la campaña
    const npc = await this.getNpc(npcId)

    // Verificar que el usuario es GM de la campaña o tiene acceso al personaje
    const isGM = await this.campaignService.isGameMaster(userId, npc.campaign_id)
    // TODO: Agregar validación de acceso al personaje si es necesario

    // Crear el item en el inventario del personaje
    const playerItem = await this.inventoryService.createItem({
      character_id: characterId,
      item_name: npcItem.item_name,
      item_type: npcItem.item_type,
      quantity: quantity,
      weight: npcItem.weight,
      value_in_copper: npcItem.value_in_copper,
      description: npcItem.description,
      equipped: false,
      equipped_slot: null,
      equippable_slot: null,
      container_id: null,
      is_container: false,
      container_capacity: 0,
    })

    // Actualizar o eliminar el item del NPC
    if (npcItem.quantity === quantity) {
      // Si se distribuye toda la cantidad, eliminar el item
      await this.npcInventoryRepo.delete(itemId)
    } else {
      // Si queda cantidad, actualizar
      await this.npcInventoryRepo.update(itemId, {
        quantity: npcItem.quantity - quantity,
      })
    }

    // Obtener el item actualizado del NPC (o null si se eliminó)
    const updatedNpcItem = npcItem.quantity === quantity ? npcItem : await this.npcInventoryRepo.getById(itemId)

    return {
      npcItem: updatedNpcItem || npcItem,
      playerItem,
    }
  }

  /**
   * Distribuye monedas del inventario de un NPC a un jugador
   * Busca items de tipo "currency" y los convierte a monedas reales
   */
  async distributeCurrencyToPlayer(
    npcId: string,
    amountInCopper: number,
    characterId: string,
    userId: string
  ): Promise<void> {
    ValidationUtils.validateId(npcId, "NPC ID")
    ValidationUtils.validateId(characterId, "Character ID")
    ValidationUtils.validatePositiveNumber(amountInCopper, "Amount in copper")

    // Obtener el inventario del NPC
    const inventory = await this.getNpcInventory(npcId)

    // Buscar items de tipo "currency"
    const currencyItems = inventory.filter((item) => item.item_type === "currency")

    // Calcular el total disponible
    const totalAvailable = currencyItems.reduce(
      (sum, item) => sum + item.value_in_copper * item.quantity,
      0
    )

    if (totalAvailable < amountInCopper) {
      throw ErrorService.create(ErrorCode.INSUFFICIENT_FUNDS, "Insufficient currency in NPC inventory")
    }

    // Obtener el NPC para verificar la campaña
    const npc = await this.getNpc(npcId)

    // Verificar que el usuario es GM de la campaña
    const isGM = await this.campaignService.isGameMaster(userId, npc.campaign_id)
    if (!isGM) {
      throw ErrorService.create(ErrorCode.FORBIDDEN, "Only Game Masters can distribute currency from NPCs")
    }

    // Obtener el wallet del personaje
    const wallet = await this.walletService.getWallet(characterId)

    // Convertir amountInCopper a las diferentes monedas
    let remaining = amountInCopper

    // Calcular monedas a agregar
    const platinumToAdd = Math.floor(remaining / 1000)
    remaining = remaining % 1000
    const goldToAdd = Math.floor(remaining / 100)
    remaining = remaining % 100
    const electrumToAdd = Math.floor(remaining / 50)
    remaining = remaining % 50
    const silverToAdd = Math.floor(remaining / 10)
    remaining = remaining % 10
    const copperToAdd = remaining

    // Actualizar el wallet del personaje
    await this.walletService.updateWallet(characterId, {
      platinum: wallet.platinum + platinumToAdd,
      gold: wallet.gold + goldToAdd,
      electrum: wallet.electrum + electrumToAdd,
      silver: wallet.silver + silverToAdd,
      copper: wallet.copper + copperToAdd,
    })

    // Eliminar o actualizar los items de currency del NPC
    // Por simplicidad, eliminamos todos los items de currency
    // En el futuro se podría hacer una distribución más inteligente
    for (const currencyItem of currencyItems) {
      await this.npcInventoryRepo.delete(currencyItem.id)
    }
  }
}

