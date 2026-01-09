"use client"

import { use } from "react"
import { DungeonRoomView } from "@/components/features/dungeons/dungeon-room-view"

export default function DungeonRoomPage({ params }: { params: Promise<{ campaignId: string; locationId: string; roomId: string }> }) {
  const { campaignId, locationId, roomId } = use(params)

  return <DungeonRoomView campaignId={campaignId} locationId={locationId} roomId={roomId} />
}

