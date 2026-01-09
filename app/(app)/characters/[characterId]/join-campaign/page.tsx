"use client"

import { use } from "react"
import { CharacterJoinCampaignView } from "@/components/features/character/character-join-campaign-view"

export default function JoinCampaignPage({ params }: { params: Promise<{ characterId: string }> }) {
  const { characterId } = use(params)

  return <CharacterJoinCampaignView characterId={characterId} />
}

