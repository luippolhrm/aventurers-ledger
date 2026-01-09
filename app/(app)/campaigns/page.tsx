"use client"

import { useLanguage } from "@/lib/language-context"
import { Campaigns } from "@/components/campaigns"
import { usePageTitle } from "@/hooks/use-page-title"

export default function CampaignsPage() {
  const { language } = useLanguage()
  usePageTitle()

  return <Campaigns language={language} />
}

