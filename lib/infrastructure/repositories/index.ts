/**
 * Barrel export para repositorios
 */
export type { WalletRepository } from "./wallet-repository"
export type { WalletData, WalletUpdateData } from "./wallet-repository.types"
export { SupabaseWalletRepository } from "./wallet-repository"
export type { CharacterRepository, Character } from "./character-repository"
export { SupabaseCharacterRepository } from "./character-repository"
export type {
  InventoryRepository,
  InventoryItem,
  CreateInventoryItem,
  UpdateInventoryItem,
} from "./inventory-repository"
export { SupabaseInventoryRepository } from "./inventory-repository"
export type {
  CampaignRepository,
  Campaign,
  CreateCampaign,
  UpdateCampaign,
  CampaignStatus,
} from "./campaign-repository"
export { SupabaseCampaignRepository } from "./campaign-repository"
export type {
  CampaignMemberRepository,
  CampaignMember,
  CreateCampaignMember,
  UpdateCampaignMember,
  CampaignMemberRole,
} from "./campaign-member-repository"
export { SupabaseCampaignMemberRepository } from "./campaign-member-repository"
export type {
  CampaignMember as CampaignMemberType,
  CampaignMemberRole as CampaignMemberRoleType,
  CampaignMemberWithDetails,
} from "./campaign-repository.types"
export type { MovementRepository } from "./movement-repository"
export type {
  Movement,
  MovementWithDetails,
  CreateMovement,
  UpdateMovement,
  MovementType,
  Currency as MovementCurrency,
} from "./movement-repository.types"
export { SupabaseMovementRepository } from "./movement-repository"
export type { TransferRepository } from "./transfer-repository"
export type {
  Transfer,
  TransferWithDetails,
  CreateTransfer,
  UpdateTransfer,
  Currency as TransferCurrency,
} from "./transfer-repository.types"
export { SupabaseTransferRepository } from "./transfer-repository"
export type { ProfileRepository, Profile, CreateProfile, UpdateProfile } from "./profile-repository"
export { SupabaseProfileRepository } from "./profile-repository"
export type {
  ShoppingCartRepository,
  ShoppingCart,
  ShoppingCartItem,
  ShoppingCartItemWithShopItem,
  CartWithItems,
  CreateShoppingCart,
  CreateShoppingCartItem,
  UpdateShoppingCartItem,
} from "./shopping-cart-repository"
export { SupabaseShoppingCartRepository } from "./shopping-cart-repository"
export type { ShopRepository, Shop, ShopWithLocation, CreateShop, UpdateShop } from "./shop-repository"
export { SupabaseShopRepository } from "./shop-repository"
export type {
  LocationRepository,
  Location,
  LocationWithShops,
  CreateLocation,
  UpdateLocation,
} from "./location-repository"
export { SupabaseLocationRepository } from "./location-repository"
export type { ShopItemRepository, ShopItem, CreateShopItem, UpdateShopItem } from "./shop-item-repository"
export { SupabaseShopItemRepository } from "./shop-item-repository"
export type { NpcRepository, Npc, CreateNpc, UpdateNpc } from "./npc-repository"
export { SupabaseNpcRepository } from "./npc-repository"
export type {
  DungeonRepository,
  DungeonRoomRepository,
  Dungeon,
  DungeonRoom,
  DungeonWithRooms,
  DungeonRoomWithNpcs,
  CreateDungeon,
  UpdateDungeon,
  CreateDungeonRoom,
  UpdateDungeonRoom,
} from "./dungeon-repository"
export { SupabaseDungeonRepository, SupabaseDungeonRoomRepository } from "./dungeon-repository"
export type {
  NpcInventoryRepository,
  NpcInventoryItem,
  CreateNpcInventoryItem,
  UpdateNpcInventoryItem,
} from "./npc-inventory-repository"
export { SupabaseNpcInventoryRepository } from "./npc-inventory-repository"

