"use client"

import { use } from "react"
import { ShopCreateView } from "@/components/features/world/shop-create-view"

export default function NewShopPage({
  params,
}: {
  params: Promise<{ campaignId: string; locationId: string }>
}) {
  const { campaignId, locationId } = use(params)

  return <ShopCreateView campaignId={campaignId} locationId={locationId} />
}

