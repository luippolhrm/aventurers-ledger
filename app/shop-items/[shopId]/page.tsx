"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import { ShopItemsManager } from "@/components/shop-items-manager"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"

interface ShopData {
  id: string
  name: string
  location_id: string
  locations: {
    id: string
    name: string
    campaign_id: string
    campaigns: {
      id: string
      name: string
      game_master_id: string
    }
  }
}

export default function ShopItemsPage({ params }: { params: Promise<{ shopId: string }> }) {
  const router = useRouter()
  const { user } = useAuth()
  const { language } = useLanguage()
  const supabase = createBrowserClient()
  
  // Unwrap params Promise using React.use()
  const { shopId } = use(params)

  const [shop, setShop] = useState<ShopData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGm, setIsGm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadShopData()
  }, [shopId, user])

  const loadShopData = async () => {
    if (!user) {
      setError("You must be logged in to manage shop items")
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Fetch shop with nested location and campaign data
      const { data: shopData, error: shopError } = await supabase
        .from("shops")
        .select(
          `
          id,
          name,
          location_id,
          locations!inner (
            id,
            name,
            campaign_id,
            campaigns!inner (
              id,
              name,
              game_master_id
            )
          )
        `
        )
        .eq("id", shopId)
        .single()

      if (shopError) throw shopError

      if (!shopData) {
        throw new Error("Shop not found")
      }

      setShop(shopData as ShopData)

      // Check if user is the GM
      const campaign = shopData.locations.campaigns
      const userIsGm = campaign.game_master_id === user.id
      setIsGm(userIsGm)

      // If not GM, check if user is at least a campaign member
      if (!userIsGm) {
        const { data: memberData, error: memberError } = await supabase
          .from("campaign_members")
          .select("role")
          .eq("campaign_id", campaign.id)
          .eq("user_id", user.id)
          .maybeSingle()

        if (memberError || !memberData) {
          throw new Error("You don't have permission to access this shop")
        }
      }
    } catch (err) {
      console.error("Error loading shop data:", err)
      setError(err instanceof Error ? err.message : "Failed to load shop")
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    router.back()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Loading shop...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-destructive mb-4">Error</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  if (!shop) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">Shop Not Found</h1>
          <p className="text-muted-foreground mb-6">The shop you're looking for doesn't exist.</p>
          <Button onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      {/* Breadcrumbs */}
      <div className="mb-6">
        <Button variant="ghost" onClick={handleBack} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{shop.locations.campaigns.name}</span>
          <span>›</span>
          <span>{shop.locations.name}</span>
          <span>›</span>
          <span className="text-foreground font-medium">{shop.name}</span>
        </div>
      </div>

      {/* Shop Items Manager */}
      <ShopItemsManager shopId={shopId} shopName={shop.name} language={language} isGm={isGm} />

      {/* Read-only notice for non-GMs */}
      {!isGm && (
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            ℹ️ You're viewing this shop as a player. Only the Game Master can add or edit items.
          </p>
        </div>
      )}
    </div>
  )
}
