"use client"

import { use } from "react"
import { NpcCreateView } from "@/components/features/world/npc-create-view"

export default function NewNpcPage({ params }: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = use(params)

  return <NpcCreateView campaignId={campaignId} />
}

