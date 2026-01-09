"use client"

import { use } from "react"
import { NpcDetailView } from "@/components/features/npcs/npc-detail-view"

export default function NpcDetailPage({ params }: { params: Promise<{ campaignId: string; npcId: string }> }) {
  const { campaignId, npcId } = use(params)

  return <NpcDetailView campaignId={campaignId} npcId={npcId} />
}
