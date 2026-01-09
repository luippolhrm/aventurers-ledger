"use client"

import { use, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LoadingState } from "@/components/molecules/loading"

export default function DungeonPage({ params }: { params: Promise<{ campaignId: string; locationId: string }> }) {
  const { campaignId, locationId } = use(params)
  const router = useRouter()

  useEffect(() => {
    // Redirigir a la vista de location (ahora muestra vista unificada para dungeons)
    router.replace(`/campaigns/${campaignId}/locations/${locationId}`)
  }, [campaignId, locationId, router])

  return <LoadingState message="Redirigiendo a la vista de mazmorra..." />
}

