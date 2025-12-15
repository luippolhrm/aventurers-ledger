"use client"

import { useState } from "react"
import { Locations } from "@/components/locations"
import { Shops } from "@/components/shops"
import { ShopCatalog } from "@/components/shop-catalog"
import { CharacterSelector } from "@/components/character-selector"
import type { Language } from "@/lib/translations"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

type MarketplaceView = "locations" | "shops" | "catalog"

interface MarketplaceProps {
  language: Language
}

export function Marketplace({ language }: MarketplaceProps) {
  const [currentView, setCurrentView] = useState<MarketplaceView>("locations")
  const [selectedLocationId, setSelectedLocationId] = useState<string>("")
  const [selectedShopId, setSelectedShopId] = useState<string>("")
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>("")

  const handleSelectLocation = (locationId: string) => {
    setSelectedLocationId(locationId)
    setCurrentView("shops")
  }

  const handleSelectShop = (shopId: string) => {
    setSelectedShopId(shopId)
    setCurrentView("catalog")
  }

  const goBack = () => {
    if (currentView === "shops") {
      setCurrentView("locations")
      setSelectedLocationId("")
    } else if (currentView === "catalog") {
      setCurrentView("shops")
      setSelectedShopId("")
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        {currentView !== "locations" && (
          <Button variant="outline" size="sm" onClick={goBack}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        )}
        {currentView === "catalog" && (
          <CharacterSelector language={language} onCharacterSelect={setSelectedCharacterId} />
        )}
      </div>

      {currentView === "locations" && <Locations language={language} onSelectLocation={handleSelectLocation} />}

      {currentView === "shops" && selectedLocationId && (
        <Shops language={language} locationId={selectedLocationId} onSelectShop={handleSelectShop} />
      )}

      {currentView === "catalog" && selectedShopId && selectedCharacterId && (
        <ShopCatalog language={language} shopId={selectedShopId} characterId={selectedCharacterId} />
      )}
    </div>
  )
}
