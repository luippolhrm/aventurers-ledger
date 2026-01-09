"use client"

import { use } from "react"
import { ShopNpcCreateView } from "@/components/features/world/shop-npc-create-view"

export default function NewShopNpcPage({
  params,
}: {
  params: Promise<{ campaignId: string; locationId: string; shopId: string }>
}) {
  const { campaignId, locationId, shopId } = use(params)

  return <ShopNpcCreateView campaignId={campaignId} locationId={locationId} shopId={shopId} />
}

