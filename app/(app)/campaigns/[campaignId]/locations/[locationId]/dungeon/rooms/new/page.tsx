"use client"

import { use } from "react"
import { DungeonRoomCreateView } from "@/components/features/dungeons/dungeon-room-create-view"

export default function DungeonRoomCreatePage({ params }: { params: Promise<{ campaignId: string; locationId: string }> }) {
  const { campaignId, locationId } = use(params)

  return <DungeonRoomCreateView campaignId={campaignId} locationId={locationId} />
}

