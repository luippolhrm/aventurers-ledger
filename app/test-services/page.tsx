"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useActiveCharacter } from "@/lib/active-character-context"
import { WalletService } from "@/lib/application/services"
import { CharacterService } from "@/lib/application/services"
import { InventoryService } from "@/lib/application/services"
import { CampaignService } from "@/lib/application/services"

interface TestResult {
  name: string
  status: "pending" | "success" | "error"
  message: string
  data?: unknown
}

export default function TestServicesPage() {
  const { user } = useAuth()
  const { activeCharacter } = useActiveCharacter()
  const [results, setResults] = useState<TestResult[]>([])
  const [loading, setLoading] = useState(false)
  const [testCharacterId, setTestCharacterId] = useState("")

  const addResult = (result: TestResult) => {
    setResults((prev) => [...prev, result])
  }

  const clearResults = () => {
    setResults([])
  }

  // Internal test functions (without loading state)
  const _testWalletService = async () => {
    if (!activeCharacter) {
      addResult({
        name: "WalletService - getWallet",
        status: "error",
        message: "No active character selected",
      })
      return
    }

    try {
      const walletService = new WalletService()
      const wallet = await walletService.getWallet(activeCharacter.id)

      addResult({
        name: "WalletService - getWallet",
        status: "success",
        message: "Wallet retrieved successfully",
        data: wallet,
      })

      const totalInCopper = walletService.calculateTotalInCopper(wallet)
      addResult({
        name: "WalletService - calculateTotalInCopper",
        status: "success",
        message: `Total: ${totalInCopper} CP`,
        data: { totalInCopper },
      })

      const formatted = walletService.formatWallet(wallet)
      addResult({
        name: "WalletService - formatWallet",
        status: "success",
        message: formatted,
        data: { formatted },
      })
    } catch (error: any) {
      addResult({
        name: "WalletService - getWallet",
        status: "error",
        message: error?.message || "Unknown error",
        data: error,
      })
    }
  }

  // Public test function with loading state
  const testWalletService = async () => {
    setLoading(true)
    try {
      await _testWalletService()
    } finally {
      setLoading(false)
    }
  }

  // Internal test function (without loading state)
  const _testCharacterService = async () => {
    if (!user) {
      addResult({
        name: "CharacterService - getUserCharacters",
        status: "error",
        message: "User not logged in",
      })
      return
    }

    try {
      const characterService = new CharacterService()
      const characters = await characterService.getUserCharacters(user.id)

      addResult({
        name: "CharacterService - getUserCharacters",
        status: "success",
        message: `Found ${characters.length} characters`,
        data: characters,
      })

      if (characters.length > 0 && activeCharacter) {
        const character = await characterService.getCharacter(activeCharacter.id)
        addResult({
          name: "CharacterService - getCharacter",
          status: "success",
          message: `Character: ${character?.name}`,
          data: character,
        })
      }
    } catch (error: any) {
      addResult({
        name: "CharacterService - getUserCharacters",
        status: "error",
        message: error?.message || "Unknown error",
        data: error,
      })
    }
  }

  // Public test function with loading state
  const testCharacterService = async () => {
    setLoading(true)
    try {
      await _testCharacterService()
    } finally {
      setLoading(false)
    }
  }

  // Internal test function (without loading state)
  const _testInventoryService = async () => {
    if (!activeCharacter) {
      addResult({
        name: "InventoryService - getInventory",
        status: "error",
        message: "No active character selected",
      })
      return
    }

    try {
      const inventoryService = new InventoryService()
      const items = await inventoryService.getInventory(activeCharacter.id)

      addResult({
        name: "InventoryService - getInventory",
        status: "success",
        message: `Found ${items.length} items`,
        data: items,
      })

      if (items.length > 0) {
        const totalWeight = await inventoryService.calculateTotalWeight(activeCharacter.id)
        addResult({
          name: "InventoryService - calculateTotalWeight",
          status: "success",
          message: `Total weight: ${totalWeight.toFixed(2)} lb`,
          data: { totalWeight },
        })

        const totalValue = await inventoryService.calculateTotalValue(activeCharacter.id)
        addResult({
          name: "InventoryService - calculateTotalValue",
          status: "success",
          message: `Total value: ${totalValue} CP`,
          data: { totalValue },
        })

        const equipped = await inventoryService.getEquippedItems(activeCharacter.id)
        addResult({
          name: "InventoryService - getEquippedItems",
          status: "success",
          message: `Found ${equipped.length} equipped items`,
          data: equipped,
        })
      }
    } catch (error: any) {
      addResult({
        name: "InventoryService - getInventory",
        status: "error",
        message: error?.message || "Unknown error",
        data: error,
      })
    }
  }

  // Public test function with loading state
  const testInventoryService = async () => {
    setLoading(true)
    try {
      await _testInventoryService()
    } finally {
      setLoading(false)
    }
  }

  // Internal test function (without loading state)
  const _testCampaignService = async () => {
    if (!user) {
      addResult({
        name: "CampaignService - getUserCampaigns",
        status: "error",
        message: "User not logged in",
      })
      return
    }

    try {
      const campaignService = new CampaignService()
      const campaigns = await campaignService.getUserCampaigns(user.id)

      addResult({
        name: "CampaignService - getUserCampaigns",
        status: "success",
        message: `Found ${campaigns.length} campaigns`,
        data: campaigns,
      })

      const gmCampaigns = await campaignService.getCampaignsAsGM(user.id)
      addResult({
        name: "CampaignService - getCampaignsAsGM",
        status: "success",
        message: `Found ${gmCampaigns.length} campaigns as GM`,
        data: gmCampaigns,
      })

      if (campaigns.length > 0) {
        const campaign = campaigns[0]
        const members = await campaignService.getCampaignMembers(campaign.id)
        addResult({
          name: "CampaignService - getCampaignMembers",
          status: "success",
          message: `Found ${members.length} members in campaign "${campaign.name}"`,
          data: members,
        })

        const hasAccess = await campaignService.validateAccess(user.id, campaign.id)
        addResult({
          name: "CampaignService - validateAccess",
          status: "success",
          message: `Access: ${hasAccess ? "Granted" : "Denied"}`,
          data: { hasAccess },
        })

        const isGM = await campaignService.isGameMaster(user.id, campaign.id)
        addResult({
          name: "CampaignService - isGameMaster",
          status: "success",
          message: `Is GM: ${isGM ? "Yes" : "No"}`,
          data: { isGM },
        })
      }
    } catch (error: any) {
      addResult({
        name: "CampaignService - getUserCampaigns",
        status: "error",
        message: error?.message || "Unknown error",
        data: error,
      })
    }
  }

  // Public test function with loading state
  const testCampaignService = async () => {
    setLoading(true)
    try {
      await _testCampaignService()
    } finally {
      setLoading(false)
    }
  }

  // Test all services
  const testAllServices = async () => {
    clearResults()
    setLoading(true)

    try {
      await _testWalletService()
      await new Promise((resolve) => setTimeout(resolve, 500)) // Small delay between tests

      await _testCharacterService()
      await new Promise((resolve) => setTimeout(resolve, 500))

      await _testInventoryService()
      await new Promise((resolve) => setTimeout(resolve, 500))

      await _testCampaignService()
    } catch (error) {
      console.error("Error testing services:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Test de Repositorios y Servicios</CardTitle>
          <CardDescription>
            Página de prueba para verificar que todos los servicios funcionan correctamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={testAllServices} disabled={loading || !user}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                "Test All Services"
              )}
            </Button>
            <Button onClick={testWalletService} disabled={loading || !activeCharacter} variant="outline">
              Test WalletService
            </Button>
            <Button onClick={testCharacterService} disabled={loading || !user} variant="outline">
              Test CharacterService
            </Button>
            <Button onClick={testInventoryService} disabled={loading || !activeCharacter} variant="outline">
              Test InventoryService
            </Button>
            <Button onClick={testCampaignService} disabled={loading || !user} variant="outline">
              Test CampaignService
            </Button>
            <Button onClick={clearResults} variant="ghost">
              Clear Results
            </Button>
          </div>

          {!user && (
            <Alert>
              <AlertDescription>Please log in to test services</AlertDescription>
            </Alert>
          )}

          {user && !activeCharacter && (
            <Alert>
              <AlertDescription>
                Please select an active character to test WalletService and InventoryService
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label>Test Character ID (optional)</Label>
            <Input
              value={testCharacterId}
              onChange={(e) => setTestCharacterId(e.target.value)}
              placeholder="Enter character ID for specific tests"
            />
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>{results.length} test(s) executed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result, index) => (
                <Card key={index} className="border-l-4 border-l-primary">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      {result.status === "success" ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                      ) : result.status === "error" ? (
                        <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                      ) : (
                        <Loader2 className="w-5 h-5 text-gray-500 mt-0.5 animate-spin" />
                      )}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{result.name}</h4>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              result.status === "success"
                                ? "bg-green-100 text-green-800"
                                : result.status === "error"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {result.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{result.message}</p>
                        {result.data && (
                          <details className="mt-2">
                            <summary className="text-sm cursor-pointer text-muted-foreground hover:text-foreground">
                              View Data
                            </summary>
                            <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-auto max-h-64">
                              {JSON.stringify(result.data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

