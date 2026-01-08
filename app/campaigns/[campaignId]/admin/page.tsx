"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { LoadingState } from "@/components/molecules/loading"

export default function CampaignAdminPage({ params }: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = use(params)
  const router = useRouter()

  useEffect(() => {
    router.replace(`/campaigns/${campaignId}`)
  }, [campaignId, router])

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <LoadingState message="Redirigiendo..." />
    </div>
  )
}

