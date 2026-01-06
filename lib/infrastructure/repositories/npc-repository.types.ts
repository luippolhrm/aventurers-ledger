export interface Npc {
  id: string
  campaign_id: string
  name: string
  title: string | null
  resistances: string | null
  story: string | null
  created_at: string
  updated_at: string
}

export interface CreateNpc {
  campaign_id: string
  name: string
  title?: string | null
  resistances?: string | null
  story?: string | null
}

export interface UpdateNpc {
  name?: string
  title?: string | null
  resistances?: string | null
  story?: string | null
}

