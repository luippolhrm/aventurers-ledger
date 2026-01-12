import {
  SupabaseDungeonRepository,
  SupabaseDungeonRoomRepository,
  type DungeonRepository,
  type DungeonRoomRepository,
  type Dungeon,
  type DungeonRoom,
  type CreateDungeon,
  type UpdateDungeon,
  type CreateDungeonRoom,
  type UpdateDungeonRoom,
} from "@/lib/infrastructure/repositories/dungeon-repository"
import { CampaignService } from "./campaign-service"
import { LocationService } from "./location-service"
import { ErrorService, ErrorCode } from "@/lib/infrastructure/errors"
import { ValidationUtils, PermissionUtils } from "../utils"

/**
 * Servicio de aplicación para gestión de dungeons
 * Maneja la lógica de negocio relacionada con dungeons y sus salas
 */
export class DungeonService {
  constructor(
    private dungeonRepo: DungeonRepository = new SupabaseDungeonRepository(),
    private dungeonRoomRepo: DungeonRoomRepository = new SupabaseDungeonRoomRepository(),
    private campaignService: CampaignService = new CampaignService(),
    private locationService: LocationService = new LocationService()
  ) {}

  /**
   * Obtiene un dungeon por location_id
   */
  async getDungeonByLocation(locationId: string): Promise<Dungeon | null> {
    ValidationUtils.validateId(locationId, "Location ID")
    return this.dungeonRepo.getByLocationId(locationId)
  }

  /**
   * Crea un nuevo dungeon
   * Valida que la location sea tipo dungeon y que el usuario tenga acceso
   */
  async createDungeon(locationId: string, dungeon: CreateDungeon, userId: string): Promise<Dungeon> {
    ValidationUtils.validateId(locationId, "Location ID")
    ValidationUtils.validateId(dungeon.location_id, "Dungeon location_id")

    // Verificar que location_id coincide
    if (dungeon.location_id !== locationId) {
      throw ErrorService.create(ErrorCode.VALIDATION_ERROR, "Location ID mismatch")
    }

    // Verificar que la location existe y es tipo dungeon
    const location = await this.locationService.getLocation(locationId)
    if (location.location_type !== "dungeon") {
      throw ErrorService.create(
        ErrorCode.VALIDATION_ERROR,
        "Location must be of type 'dungeon' to create a dungeon"
      )
    }

    // Verificar que el usuario es GM de la campaña usando helper centralizado
    await PermissionUtils.ensureGameMaster(userId, location.campaign_id)

    return this.dungeonRepo.create(dungeon)
  }

  /**
   * Actualiza un dungeon
   * Valida que el usuario tenga acceso a la campaña
   */
  async updateDungeon(dungeonId: string, updates: UpdateDungeon, userId: string): Promise<Dungeon> {
    ValidationUtils.validateId(dungeonId, "Dungeon ID")

    // Obtener el dungeon para verificar la campaña
    const dungeon = await this.dungeonRepo.getById(dungeonId)
    if (!dungeon) {
      throw ErrorService.create(ErrorCode.NOT_FOUND, "Dungeon not found")
    }

    // Obtener la location para verificar la campaña
    const location = await this.locationService.getLocation(dungeon.location_id)

    // Verificar que el usuario es GM de la campaña usando helper centralizado
    await PermissionUtils.ensureGameMaster(userId, location.campaign_id)

    return this.dungeonRepo.update(dungeonId, updates)
  }

  /**
   * Elimina un dungeon
   * Valida que el usuario tenga acceso a la campaña
   */
  async deleteDungeon(dungeonId: string, userId: string): Promise<void> {
    ValidationUtils.validateId(dungeonId, "Dungeon ID")

    // Obtener el dungeon para verificar la campaña
    const dungeon = await this.dungeonRepo.getById(dungeonId)
    if (!dungeon) {
      throw ErrorService.create(ErrorCode.NOT_FOUND, "Dungeon not found")
    }

    // Obtener la location para verificar la campaña
    const location = await this.locationService.getLocation(dungeon.location_id)

    // Verificar que el usuario es GM de la campaña usando helper centralizado
    await PermissionUtils.ensureGameMaster(userId, location.campaign_id)

    return this.dungeonRepo.delete(dungeonId)
  }

  /**
   * Obtiene todas las salas de un dungeon
   */
  async getRoomsByDungeon(dungeonId: string): Promise<DungeonRoom[]> {
    ValidationUtils.validateId(dungeonId, "Dungeon ID")
    return this.dungeonRoomRepo.getByDungeonId(dungeonId)
  }

  /**
   * Obtiene una sala por su ID
   */
  async getRoomById(roomId: string): Promise<DungeonRoom> {
    ValidationUtils.validateId(roomId, "Room ID")
    const room = await this.dungeonRoomRepo.getById(roomId)
    if (!room) {
      throw ErrorService.create(ErrorCode.NOT_FOUND, "Dungeon room not found")
    }
    return room
  }

  /**
   * Crea una nueva sala en un dungeon
   * Valida que el usuario tenga acceso a la campaña
   */
  async createRoom(dungeonId: string, room: CreateDungeonRoom, userId: string): Promise<DungeonRoom> {
    ValidationUtils.validateId(dungeonId, "Dungeon ID")
    ValidationUtils.validateId(room.dungeon_id, "Room dungeon_id")
    ValidationUtils.validateNonEmptyString(room.name, "Room name")

    // Verificar que dungeon_id coincide
    if (room.dungeon_id !== dungeonId) {
      throw ErrorService.create(ErrorCode.VALIDATION_ERROR, "Dungeon ID mismatch")
    }

    // Obtener el dungeon para verificar la campaña
    const dungeon = await this.dungeonRepo.getById(dungeonId)
    if (!dungeon) {
      throw ErrorService.create(ErrorCode.NOT_FOUND, "Dungeon not found")
    }

    // Obtener la location para verificar la campaña
    const location = await this.locationService.getLocation(dungeon.location_id)

    // Verificar que el usuario es GM de la campaña usando helper centralizado
    await PermissionUtils.ensureGameMaster(userId, location.campaign_id)

    return this.dungeonRoomRepo.create(room)
  }

  /**
   * Actualiza una sala
   * Valida que el usuario tenga acceso a la campaña
   */
  async updateRoom(roomId: string, updates: UpdateDungeonRoom, userId: string): Promise<DungeonRoom> {
    ValidationUtils.validateId(roomId, "Room ID")

    // Obtener la sala para verificar el dungeon
    const room = await this.dungeonRoomRepo.getById(roomId)
    if (!room) {
      throw ErrorService.create(ErrorCode.NOT_FOUND, "Dungeon room not found")
    }

    // Obtener el dungeon para verificar la campaña
    const dungeon = await this.dungeonRepo.getById(room.dungeon_id)
    if (!dungeon) {
      throw ErrorService.create(ErrorCode.NOT_FOUND, "Dungeon not found")
    }

    // Obtener la location para verificar la campaña
    const location = await this.locationService.getLocation(dungeon.location_id)

    // Verificar que el usuario es GM de la campaña usando helper centralizado
    await PermissionUtils.ensureGameMaster(userId, location.campaign_id)

    return this.dungeonRoomRepo.update(roomId, updates)
  }

  /**
   * Elimina una sala
   * Valida que el usuario tenga acceso a la campaña
   */
  async deleteRoom(roomId: string, userId: string): Promise<void> {
    ValidationUtils.validateId(roomId, "Room ID")

    // Obtener la sala para verificar el dungeon
    const room = await this.dungeonRoomRepo.getById(roomId)
    if (!room) {
      throw ErrorService.create(ErrorCode.NOT_FOUND, "Dungeon room not found")
    }

    // Obtener el dungeon para verificar la campaña
    const dungeon = await this.dungeonRepo.getById(room.dungeon_id)
    if (!dungeon) {
      throw ErrorService.create(ErrorCode.NOT_FOUND, "Dungeon not found")
    }

    // Obtener la location para verificar la campaña
    const location = await this.locationService.getLocation(dungeon.location_id)

    // Verificar que el usuario es GM de la campaña usando helper centralizado
    await PermissionUtils.ensureGameMaster(userId, location.campaign_id)

    return this.dungeonRoomRepo.delete(roomId)
  }

  /**
   * Obtiene NPCs asociados a una sala
   */
  async getNpcsByRoom(roomId: string): Promise<Array<{ id: string; npc_id: string | null; name: string | null }>> {
    ValidationUtils.validateId(roomId, "Room ID")

    const room = await this.dungeonRoomRepo.getWithNpcs(roomId)
    if (!room) {
      throw ErrorService.create(ErrorCode.NOT_FOUND, "Dungeon room not found")
    }

    return (room.npcs || []).map((npc) => ({
      id: npc.id,
      npc_id: npc.npc_id,
      name: npc.name,
    }))
  }

  /**
   * Asocia un NPC a una sala
   * Valida que el usuario tenga acceso a la campaña
   */
  async associateNpcToRoom(npcId: string, roomId: string, userId: string): Promise<void> {
    ValidationUtils.validateId(npcId, "NPC ID")
    ValidationUtils.validateId(roomId, "Room ID")

    // Obtener la sala para verificar el dungeon
    const room = await this.dungeonRoomRepo.getById(roomId)
    if (!room) {
      throw ErrorService.create(ErrorCode.NOT_FOUND, "Dungeon room not found")
    }

    // Obtener el dungeon para verificar la campaña
    const dungeon = await this.dungeonRepo.getById(room.dungeon_id)
    if (!dungeon) {
      throw ErrorService.create(ErrorCode.NOT_FOUND, "Dungeon not found")
    }

    // Obtener la location para verificar la campaña
    const location = await this.locationService.getLocation(dungeon.location_id)

    // Verificar que el usuario es GM de la campaña usando helper centralizado
    await PermissionUtils.ensureGameMaster(userId, location.campaign_id)

    // Crear la asociación usando Supabase directamente
    const { createBrowserClient } = await import("@/lib/supabase/client")
    const supabase = createBrowserClient()
    const { error } = await supabase.from("dungeon_room_npcs").insert({
      dungeon_room_id: roomId,
      npc_id: npcId,
    })

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }
  }

  /**
   * Desasocia un NPC de una sala
   * Valida que el usuario tenga acceso a la campaña
   */
  async disassociateNpcFromRoom(npcId: string, roomId: string, userId: string): Promise<void> {
    ValidationUtils.validateId(npcId, "NPC ID")
    ValidationUtils.validateId(roomId, "Room ID")

    // Obtener la sala para verificar el dungeon
    const room = await this.dungeonRoomRepo.getById(roomId)
    if (!room) {
      throw ErrorService.create(ErrorCode.NOT_FOUND, "Dungeon room not found")
    }

    // Obtener el dungeon para verificar la campaña
    const dungeon = await this.dungeonRepo.getById(room.dungeon_id)
    if (!dungeon) {
      throw ErrorService.create(ErrorCode.NOT_FOUND, "Dungeon not found")
    }

    // Obtener la location para verificar la campaña
    const location = await this.locationService.getLocation(dungeon.location_id)

    // Verificar que el usuario es GM de la campaña usando helper centralizado
    await PermissionUtils.ensureGameMaster(userId, location.campaign_id)

    // Eliminar la asociación usando Supabase directamente
    const { createBrowserClient } = await import("@/lib/supabase/client")
    const supabase = createBrowserClient()
    const { error } = await supabase
      .from("dungeon_room_npcs")
      .delete()
      .eq("dungeon_room_id", roomId)
      .eq("npc_id", npcId)

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }
  }
}

