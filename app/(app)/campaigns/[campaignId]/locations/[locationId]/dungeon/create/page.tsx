"use client"

import { use } from "react"
import { DungeonCreateView } from "@/components/features/dungeons/dungeon-create-view"

export default function DungeonCreatePage({ params }: { params: Promise<{ campaignId: string; locationId: string }> }) {
  const { campaignId, locationId } = use(params)

  return <DungeonCreateView campaignId={campaignId} locationId={locationId} />
}

