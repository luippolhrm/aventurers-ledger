"use client"

import { use } from "react"
import { ShopView } from "@/components/features/world/shop-view"

export default function ShopPage({
  params,
}: {
  params: Promise<{ campaignId: string; locationId: string; shopId: string }>
}) {
  const { campaignId, locationId, shopId } = use(params)

  return <ShopView campaignId={campaignId} locationId={locationId} shopId={shopId} />
}

