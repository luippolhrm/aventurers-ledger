import { useMemo } from "react"
import {
  WalletService,
  CharacterService,
  InventoryService,
  MovementService,
  TransferService,
  CampaignService,
  CurrencyConverterService,
  AuthService,
  ProfileService,
  ShoppingCartService,
  ShopService,
  LocationService,
  ShopItemService,
  NpcService,
} from "@/lib/application/services"

/**
 * Hook personalizado para instanciar servicios de aplicación
 * Evita la repetición de useMemo(() => new Service(), []) en cada componente
 * 
 * @returns Objeto con todas las instancias de servicios
 * 
 * @example
 * ```tsx
 * const services = useServices()
 * const wallet = await services.wallet.getWallet(characterId)
 * ```
 */
export function useServices() {
  return useMemo(
    () => ({
      wallet: new WalletService(),
      character: new CharacterService(),
      inventory: new InventoryService(),
      movement: new MovementService(),
      transfer: new TransferService(),
      campaign: new CampaignService(),
      currencyConverter: new CurrencyConverterService(),
      auth: new AuthService(),
      profile: new ProfileService(),
      shoppingCart: new ShoppingCartService(),
      shop: new ShopService(),
      location: new LocationService(),
      shopItem: new ShopItemService(),
      npc: new NpcService(),
    }),
    []
  )
}

