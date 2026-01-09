"use client"

import { use } from "react"
import { NpcLootView } from "@/components/features/npcs/npc-loot-view"

export default function NpcLootPage({ params }: { params: Promise<{ campaignId: string; npcId: string }> }) {
  const { campaignId, npcId } = use(params)

  return <NpcLootView campaignId={campaignId} npcId={npcId} />
}

