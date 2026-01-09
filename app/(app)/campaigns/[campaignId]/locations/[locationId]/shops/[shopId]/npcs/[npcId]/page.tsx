"use client"

import { use } from "react"
import { NpcView } from "@/components/features/world/npc-view"

export default function ShopNpcPage({
  params,
}: {
  params: Promise<{ campaignId: string; locationId: string; shopId: string; npcId: string }>
}) {
  const { campaignId, locationId, shopId, npcId } = use(params)

  return <NpcView campaignId={campaignId} npcId={npcId} isShopNpc={true} locationId={locationId} shopId={shopId} />
}

