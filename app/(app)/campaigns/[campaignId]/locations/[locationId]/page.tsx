"use client"

import { use } from "react"
import { LocationView } from "@/components/features/world/location-view"

export default function LocationPage({
  params,
}: {
  params: Promise<{ campaignId: string; locationId: string }>
}) {
  const { campaignId, locationId } = use(params)

  return <LocationView campaignId={campaignId} locationId={locationId} />
}

