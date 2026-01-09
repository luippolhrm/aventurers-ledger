/**
 * Tipos y interfaces para LocationRepository
 */

export interface Location {
  id: string
  name: string
  description: string | null
  campaign_id: string
  location_type: string | null
  is_active?: boolean
  created_at: string
  updated_at: string | null
}

export interface LocationWithShops extends Location {
  shops?: Array<{
    id: string
    name: string
    description: string | null
    shopkeeper_name: string | null
  }>
}

export type CreateLocation = Omit<Location, "id" | "created_at" | "updated_at">

export type UpdateLocation = Partial<Omit<Location, "id" | "created_at" | "updated_at">>

