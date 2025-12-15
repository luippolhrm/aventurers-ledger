"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MapPin, Plus, Trash2 } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import { type Language, translations } from "@/lib/translations"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Location {
  id: string
  name: string
  description: string | null
  campaign_id: string
  created_at: string
}

interface Campaign {
  id: string
  name: string
}

interface LocationsProps {
  language: Language
  campaignId?: string
  onSelectLocation?: (locationId: string) => void
}

export function Locations({ language, campaignId, onSelectLocation }: LocationsProps) {
  const t = translations[language]
  const { user } = useAuth()
  const supabase = createBrowserClient()

  const [locations, setLocations] = useState<Location[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newLocationName, setNewLocationName] = useState("")
  const [newLocationDescription, setNewLocationDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCampaignId, setSelectedCampaignId] = useState(campaignId || "")

  useEffect(() => {
    if (!campaignId && user) {
      loadCampaigns()
    } else if (campaignId) {
      setSelectedCampaignId(campaignId)
    }
  }, [campaignId, user])

  // Load locations when campaign is selected
  useEffect(() => {
    if (selectedCampaignId) {
      loadLocations()
    }
  }, [selectedCampaignId])

  const loadCampaigns = async () => {
    if (!user) return

    const { data: memberData } = await supabase.from("campaign_members").select("campaign_id").eq("user_id", user.id)

    if (memberData && memberData.length > 0) {
      const campaignIds = memberData.map((m) => m.campaign_id)
      const { data: campaignsData } = await supabase.from("campaigns").select("id, name").in("id", campaignIds)

      if (campaignsData) {
        setCampaigns(campaignsData)
        if (campaignsData.length > 0 && !selectedCampaignId) {
          setSelectedCampaignId(campaignsData[0].id)
        }
      }
    }
  }

  const loadLocations = async () => {
    if (!selectedCampaignId) return

    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .eq("campaign_id", selectedCampaignId)
      .order("created_at", { ascending: false })

    if (!error && data) {
      setLocations(data)
    }
  }

  const handleCreateLocation = async () => {
    if (!newLocationName.trim() || !selectedCampaignId) return

    setIsLoading(true)
    const { data, error } = await supabase
      .from("locations")
      .insert({
        name: newLocationName,
        description: newLocationDescription,
        campaign_id: selectedCampaignId,
      })
      .select()

    if (!error && data) {
      setLocations([data[0], ...locations])
      setNewLocationName("")
      setNewLocationDescription("")
      setIsCreateDialogOpen(false)
    }
    setIsLoading(false)
  }

  const handleDeleteLocation = async (locationId: string) => {
    const { error } = await supabase.from("locations").delete().eq("id", locationId)

    if (!error) {
      setLocations(locations.filter((l) => l.id !== locationId))
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="space-y-4">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2 text-foreground">
            <MapPin className="w-8 h-8" />
            {t.marketplace?.locations || "Locations"}
          </h2>
          <p className="text-muted-foreground mt-2">
            {t.marketplace?.locationsDescription || "Explore towns and villages"}
          </p>
        </div>

        {!campaignId && campaigns.length > 0 && (
          <div className="space-y-2">
            <Label>{t.campaigns?.selectCampaign || "Select Campaign"}</Label>
            <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
              <SelectTrigger>
                <SelectValue placeholder={t.campaigns?.selectCampaign || "Select a campaign"} />
              </SelectTrigger>
              <SelectContent>
                {campaigns.map((campaign) => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {selectedCampaignId && (
          <Button onClick={() => setIsCreateDialogOpen(true)} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            {t.marketplace?.createLocation || "Create Location"}
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {locations.map((location) => (
          <Card
            key={location.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onSelectLocation?.(location.id)}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{location.name}</CardTitle>
                  <CardDescription>{location.description}</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteLocation(location.id)
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.marketplace?.createLocation || "Create Location"}</DialogTitle>
            <DialogDescription>
              {t.marketplace?.locationSubtitle || "Add a new location to your campaign"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>{t.marketplace?.locationName || "Location Name"}</Label>
              <Input
                placeholder={t.marketplace?.enterLocationName || "Enter location name"}
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
              />
            </div>

            <div>
              <Label>{t.marketplace?.description || "Description"}</Label>
              <Textarea
                placeholder={t.marketplace?.describeLocation || "Describe this location"}
                value={newLocationDescription}
                onChange={(e) => setNewLocationDescription(e.target.value)}
              />
            </div>

            <Button onClick={handleCreateLocation} disabled={isLoading || !newLocationName.trim()} className="w-full">
              {t.campaigns?.create || "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
