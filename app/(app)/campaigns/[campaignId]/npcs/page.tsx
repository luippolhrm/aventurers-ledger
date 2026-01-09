"use client"

import { use } from "react"
import { NpcListView } from "@/components/features/npcs/npc-list-view"

export default function NpcsPage({ params }: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = use(params)

  return <NpcListView campaignId={campaignId} />
}

