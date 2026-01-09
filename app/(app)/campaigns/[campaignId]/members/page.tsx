"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { MembersContent } from "@/components/features/campaigns/members-content"

export default function CampaignMembersPage({ params }: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = use(params)
  const router = useRouter()

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => router.push(`/campaigns/${campaignId}`)}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver a Campaña
      </Button>

      <MembersContent campaignId={campaignId} />
    </div>
  )
}

