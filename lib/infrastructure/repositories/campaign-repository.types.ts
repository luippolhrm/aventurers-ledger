/**
 * Tipos y interfaces para CampaignRepository
 */

export type CampaignStatus = "active" | "paused" | "completed" | "archived"

export interface Campaign {
  id: string
  name: string
  description: string | null
  game_master_id: string
  status: CampaignStatus
  invite_code: string
  created_at: string
  updated_at: string | null
}

export type CreateCampaign = Omit<Campaign, "id" | "created_at" | "updated_at" | "invite_code"> & {
  invite_code?: string | null
}

export type UpdateCampaign = Partial<
  Omit<Campaign, "id" | "game_master_id" | "created_at" | "updated_at" | "invite_code">
> & {
  invite_code?: string | null
}

export type CampaignMemberRole = "game_master" | "player"

export interface CampaignMember {
  id: string
  campaign_id: string
  user_id: string
  character_id: string | null
  role: CampaignMemberRole
  joined_at: string
}

export type CreateCampaignMember = Omit<CampaignMember, "id" | "joined_at">

export type UpdateCampaignMember = Partial<Omit<CampaignMember, "id" | "campaign_id" | "joined_at">>

/**
 * Miembro de campaña enriquecido con información de perfil y personaje
 */
export interface CampaignMemberWithDetails extends CampaignMember {
  user_display_name?: string | null
  character_name?: string | null
}

