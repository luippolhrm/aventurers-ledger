"use client"

import { use } from "react"
import { CampaignView } from "@/components/campaign-view"
import { useLanguage } from "@/lib/language-context"

export default function CampaignPage({ params }: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = use(params)
  const { language } = useLanguage()

  return <CampaignView campaignId={campaignId} language={language} />
}

