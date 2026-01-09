"use client"

import { use } from "react"
import { DungeonFullCreateView } from "@/components/features/dungeons/dungeon-full-create-view"

export default function NewDungeonPage({ params }: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = use(params)

  return <DungeonFullCreateView campaignId={campaignId} />
}

