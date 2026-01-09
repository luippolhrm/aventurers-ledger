"use client"

import { use } from "react"
import { LocationCreateView } from "@/components/features/world/location-create-view"

export default function NewLocationPage({ params }: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = use(params)

  return <LocationCreateView campaignId={campaignId} />
}

