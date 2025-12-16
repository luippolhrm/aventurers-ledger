"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, RefreshCw } from "lucide-react"
import { translations, type Language } from "@/lib/translations"
import type { ShopItemExtended } from "@/lib/services/item-api-service"

interface ShopItemAiGeneratorProps {
  language: Language
  onItemGenerated: (item: ShopItemExtended) => void
}

export function ShopItemAiGenerator({ language, onItemGenerated }: ShopItemAiGeneratorProps) {
  const t = translations[language]

  const [prompt, setPrompt] = useState("")
  const [mode, setMode] = useState<"generate" | "search">("generate")
  const [provider, setProvider] = useState<"gemini" | "openai">("gemini")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedItem, setGeneratedItem] = useState<ShopItemExtended | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setIsGenerating(true)
    setError(null)
    setGeneratedItem(null)

    try {
      const response = await fetch("/api/items/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          mode,
          language,
          provider,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate item")
      }

      const data = await response.json()
      setGeneratedItem(data.item)
    } catch (err) {
      console.error("Error generating item:", err)
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleUseItem = () => {
    if (generatedItem) {
      onItemGenerated(generatedItem)
      // Reset form
      setPrompt("")
      setGeneratedItem(null)
    }
  }

  const handleRegenerate = () => {
    setGeneratedItem(null)
    handleGenerate()
  }

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="ai_provider">{t.marketplace?.aiProvider || "AI Provider"}</Label>
          <Select value={provider} onValueChange={(value) => setProvider(value as "gemini" | "openai")}>
            <SelectTrigger id="ai_provider">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gemini">
                Google Gemini (Free - 15 req/min)
              </SelectItem>
              <SelectItem value="openai">
                OpenAI GPT-4 (Paid - Better Quality)
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            {provider === "gemini"
              ? "✅ Free with generous limits (recommended)"
              : "💰 Requires paid API key (~$0.01/item)"}
          </p>
        </div>

        <div>
          <Label htmlFor="ai_mode">{t.marketplace?.aiMode || "AI Mode"}</Label>
          <Select value={mode} onValueChange={(value) => setMode(value as "generate" | "search")}>
            <SelectTrigger id="ai_mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="generate">{t.marketplace?.generateNew || "Generate New Item"}</SelectItem>
              <SelectItem value="search">{t.marketplace?.searchOfficial || "Search Official Item"}</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            {mode === "generate"
              ? "Create a completely new custom item based on your description"
              : "Find an official D&D 5e item from sourcebooks"}
          </p>
        </div>

        <div>
          <Label htmlFor="ai_prompt">{t.marketplace?.aiPrompt || "Describe the item"}</Label>
          <Textarea
            id="ai_prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              mode === "generate"
                ? 'e.g., "A magical longsword +1 that glows blue in the presence of orcs"'
                : 'e.g., "Longsword" or "Ring of Protection"'
            }
            rows={4}
            disabled={isGenerating}
          />
        </div>

        <Button onClick={handleGenerate} disabled={!prompt.trim() || isGenerating} className="w-full">
          <Sparkles className="w-4 h-4 mr-2" />
          {isGenerating
            ? t.marketplace?.generating || "Generating..."
            : mode === "generate"
              ? t.marketplace?.generateNew || "Generate New Item"
              : t.marketplace?.searchOfficial || "Search Official Item"}
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Generated Item Preview */}
      {generatedItem && (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  {generatedItem.item_name}
                  {generatedItem.rarity && (
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getRarityColor(generatedItem.rarity)}`}
                    >
                      {t.marketplace?.rarities?.[generatedItem.rarity] || generatedItem.rarity}
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  {generatedItem.item_type} {generatedItem.item_category && `• ${generatedItem.item_category}`}
                </CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={handleRegenerate} disabled={isGenerating}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Description */}
            {generatedItem.description && (
              <div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{generatedItem.description}</p>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold">Price:</span>{" "}
                {((generatedItem.price_in_copper || 0) / 100).toFixed(2)} gp
              </div>
              <div>
                <span className="font-semibold">Weight:</span> {generatedItem.weight} lb
              </div>

              {generatedItem.damage_dice && (
                <div>
                  <span className="font-semibold">Damage:</span> {generatedItem.damage_dice}
                  {generatedItem.damage_type && ` (${generatedItem.damage_type})`}
                </div>
              )}

              {generatedItem.armor_class && (
                <div>
                  <span className="font-semibold">AC:</span> {generatedItem.armor_class}
                </div>
              )}
            </div>

            {/* Properties */}
            {generatedItem.properties && generatedItem.properties.length > 0 && (
              <div>
                <span className="text-sm font-semibold">Properties: </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {generatedItem.properties.map((prop) => (
                    <span key={prop} className="text-xs px-2 py-1 rounded-md bg-secondary">
                      {prop}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Requirements */}
            {generatedItem.requirements && (
              <div className="text-sm">
                <span className="font-semibold">Requirements:</span> {generatedItem.requirements}
              </div>
            )}

            {/* Attunement */}
            {generatedItem.attunement && (
              <div className="text-sm text-amber-600 dark:text-amber-400">
                ⚠️ Requires Attunement
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button onClick={handleUseItem} className="flex-1">
                {t.marketplace?.useThisItem || "Use This Item"}
              </Button>
              <Button variant="outline" onClick={handleRegenerate} disabled={isGenerating}>
                <RefreshCw className="w-4 h-4 mr-2" />
                {t.marketplace?.regenerate || "Regenerate"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function getRarityColor(rarity: string): string {
  const colors: Record<string, string> = {
    common: "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    uncommon: "bg-green-200 text-green-800 dark:bg-green-700 dark:text-green-200",
    rare: "bg-blue-200 text-blue-800 dark:bg-blue-700 dark:text-blue-200",
    very_rare: "bg-purple-200 text-purple-800 dark:bg-purple-700 dark:text-purple-200",
    legendary: "bg-orange-200 text-orange-800 dark:bg-orange-700 dark:text-orange-200",
    artifact: "bg-red-200 text-red-800 dark:bg-red-700 dark:text-red-200",
  }
  return colors[rarity] || colors.common
}
