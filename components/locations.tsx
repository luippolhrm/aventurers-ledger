"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MapPin, Plus, Trash2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useServices } from "@/hooks/use-services"
import { ErrorService } from "@/lib/infrastructure/errors"

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
  language?: "es" // Mantener por compatibilidad, pero ya no se usa
  campaignId?: string
  onSelectLocation?: (locationId: string) => void
}

export function Locations({ language, campaignId, onSelectLocation }: LocationsProps) {
  const { t } = useLanguage()
  const { user } = useAuth()
  const services = useServices()

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
    if (selectedCampaignId && user) {
      loadLocations()
    } else {
      setLocations([])
    }
  }, [selectedCampaignId, user])

  const loadCampaigns = async () => {
    if (!user) {
      setCampaigns([])
      return
    }

    try {
      const userCampaigns = await services.campaign.getUserCampaigns(user.id)
      setCampaigns(
        userCampaigns.map((campaign) => ({
          id: campaign.id,
          name: campaign.name,
        }))
      )
      if (userCampaigns.length > 0 && !selectedCampaignId) {
        setSelectedCampaignId(userCampaigns[0].id)
      }
    } catch (err) {
      console.error("[v0] Locations: Exception loading campaigns:", err)
      setCampaigns([])
    }
  }

  const loadLocations = async () => {
    if (!selectedCampaignId || !user) {
      setLocations([])
      return
    }

    try {
      const locationsData = await services.location.getLocationsByCampaign(selectedCampaignId)
      setLocations(
        locationsData.map((location) => ({
          id: location.id,
          name: location.name,
          description: location.description,
          campaign_id: location.campaign_id,
          created_at: location.created_at,
        }))
      )
    } catch (error) {
      console.error("[v0] Locations: Error loading locations:", error)
      setLocations([])
    }
  }

  const handleCreateLocation = async () => {
    if (!newLocationName.trim() || !selectedCampaignId || !user) return

    setIsLoading(true)
    try {
      const newLocation = await services.location.createLocation(
        {
          name: newLocationName,
          description: newLocationDescription || null,
          campaign_id: selectedCampaignId,
        },
        user.id
      )

      setLocations([
        {
          id: newLocation.id,
          name: newLocation.name,
          description: newLocation.description,
          campaign_id: newLocation.campaign_id,
          created_at: newLocation.created_at,
        },
        ...locations,
      ])
      setNewLocationName("")
      setNewLocationDescription("")
      setIsCreateDialogOpen(false)
    } catch (error) {
      console.error("[v0] Locations: Error creating location:", error)
      const errorMessage =
        error instanceof Error
          ? error.message
          : ErrorService.fromUnknownError(error).message
      alert(errorMessage || "Error creating location")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteLocation = async (locationId: string) => {
    try {
      await services.location.deleteLocation(locationId)
      setLocations(locations.filter((l) => l.id !== locationId))
    } catch (error) {
      console.error("[v0] Locations: Error deleting location:", error)
      const errorMessage =
        error instanceof Error
          ? error.message
          : ErrorService.fromUnknownError(error).message
      alert(errorMessage || "Error deleting location")
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
            <Select
              value={selectedCampaignId}
              onValueChange={(value) => {
                setSelectedCampaignId(value)
              }}
            >
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
