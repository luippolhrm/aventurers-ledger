"use client"

import { use } from "react"
import { CampaignAdminView } from "@/components/campaign-admin-view"
import { useLanguage } from "@/lib/language-context"
import { AppLayout } from "@/components/app-layout"

export default function CampaignAdminPage({ params }: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = use(params)
  const { language } = useLanguage()

  return (
    <AppLayout>
      <CampaignAdminView campaignId={campaignId} language={language} />
    </AppLayout>
  )
}

