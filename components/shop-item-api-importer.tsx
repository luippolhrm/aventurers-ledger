"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Download, ExternalLink } from "lucide-react"
import { translations, type Language } from "@/lib/translations"
import type { ShopItemExtended, ApiSearchResult } from "@/lib/services/item-api-service"

interface ShopItemApiImporterProps {
  language: Language
  onItemImported: (item: ShopItemExtended) => void
}

export function ShopItemApiImporter({ language, onItemImported }: ShopItemApiImporterProps) {
  const t = translations[language]

  const [selectedApi, setSelectedApi] = useState<"dnd5eapi" | "open5e">("dnd5eapi")
  const [provider, setProvider] = useState<"gemini" | "openai">("gemini")
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<ApiSearchResult[]>([])
  const [selectedItem, setSelectedItem] = useState<ApiSearchResult | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importedItem, setImportedItem] = useState<ShopItemExtended | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setError(null)
    setSearchResults([])
    setSelectedItem(null)
    setImportedItem(null)

    try {
      const response = await fetch(
        `/api/items/import?api=${selectedApi}&query=${encodeURIComponent(searchQuery.trim())}`
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to search items")
      }

      const data = await response.json()
      setSearchResults(data.results || [])
    } catch (err) {
      console.error("Error searching items:", err)
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setIsSearching(false)
    }
  }

  const handleImportItem = async (item: ApiSearchResult) => {
    setIsImporting(true)
    setError(null)
    setImportedItem(null)
    setSelectedItem(item)

    try {
      const response = await fetch("/api/items/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api: selectedApi,
          itemId: item.index,
          language,
          provider,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to import item")
      }

      const data = await response.json()
      setImportedItem(data.item)
    } catch (err) {
      console.error("Error importing item:", err)
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setIsImporting(false)
    }
  }

  const handleUseItem = () => {
    if (importedItem) {
      onItemImported(importedItem)
      // Reset form
      setSearchQuery("")
      setSearchResults([])
      setSelectedItem(null)
      setImportedItem(null)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isSearching) {
      handleSearch()
    }
  }

  return (
    <div className="space-y-6">
      {/* Search Configuration */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="api_selector">{t.marketplace?.selectApi || "Select API"}</Label>
          <Select value={selectedApi} onValueChange={(value) => setSelectedApi(value as "dnd5eapi" | "open5e")}>
            <SelectTrigger id="api_selector">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dnd5eapi">D&D 5e API (SRD Content)</SelectItem>
              <SelectItem value="open5e">Open5e (Extended Content)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            {selectedApi === "dnd5eapi"
              ? "Official SRD content, basic equipment and weapons"
              : "Includes magic items and third-party content"}
          </p>
        </div>

        {language !== "en" && (
          <div>
            <Label htmlFor="translation_provider">{t.marketplace?.translationProvider || "Translation Provider"}</Label>
            <Select value={provider} onValueChange={(value) => setProvider(value as "gemini" | "openai")}>
              <SelectTrigger id="translation_provider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini">Google Gemini (Free)</SelectItem>
                <SelectItem value="openai">OpenAI GPT-4 (Paid)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Used to translate imported items from English
            </p>
          </div>
        )}

        <div>
          <Label htmlFor="search_query">{t.marketplace?.searchItems || "Search Items"}</Label>
          <div className="flex gap-2">
            <Input
              id="search_query"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder='e.g., "Longsword", "Ring of Protection"'
              disabled={isSearching}
            />
            <Button onClick={handleSearch} disabled={!searchQuery.trim() || isSearching}>
              <Search className="w-4 h-4 mr-2" />
              {t.inventory?.search || "Search"}
            </Button>
          </div>
        </div>
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

      {/* Search Results */}
      {searchResults.length > 0 && !importedItem && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">
            {t.marketplace?.searchResults || "Search Results"} ({searchResults.length})
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {searchResults.map((item) => (
              <Card
                key={item.index}
                className={`cursor-pointer transition-colors hover:border-primary ${
                  selectedItem?.index === item.index ? "border-primary" : ""
                }`}
                onClick={() => !isImporting && handleImportItem(item)}
              >
                <CardHeader className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{item.name}</CardTitle>
                      {item.source && (
                        <CardDescription className="text-xs">Source: {item.source}</CardDescription>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleImportItem(item)
                      }}
                      disabled={isImporting}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isImporting && selectedItem && (
        <Card>
          <CardContent className="py-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {t.marketplace?.translating || "Importing and translating..."} "{selectedItem.name}"
              </p>
              <div className="mt-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Imported Item Preview */}
      {importedItem && (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  {importedItem.item_name}
                  {importedItem.rarity && (
                    <span className={`text-xs px-2 py-1 rounded-full ${getRarityColor(importedItem.rarity)}`}>
                      {t.marketplace?.rarities?.[importedItem.rarity] || importedItem.rarity}
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  {importedItem.item_type} {importedItem.item_category && `• ${importedItem.item_category}`}
                  {importedItem.original_name_en && language !== "en" && (
                    <span className="ml-2 text-xs">({importedItem.original_name_en})</span>
                  )}
                </CardDescription>
              </div>
              {selectedItem && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(selectedItem.url, "_blank")}
                  title="View source"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Description */}
            {importedItem.description && (
              <div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{importedItem.description}</p>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold">Price:</span>{" "}
                {((importedItem.price_in_copper || 0) / 100).toFixed(2)} gp
              </div>
              <div>
                <span className="font-semibold">Weight:</span> {importedItem.weight} lb
              </div>

              {importedItem.damage_dice && (
                <div>
                  <span className="font-semibold">Damage:</span> {importedItem.damage_dice}
                  {importedItem.damage_type && ` (${importedItem.damage_type})`}
                </div>
              )}

              {importedItem.armor_class && (
                <div>
                  <span className="font-semibold">AC:</span> {importedItem.armor_class}
                </div>
              )}
            </div>

            {/* Properties */}
            {importedItem.properties && importedItem.properties.length > 0 && (
              <div>
                <span className="text-sm font-semibold">Properties: </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {importedItem.properties.map((prop) => (
                    <span key={prop} className="text-xs px-2 py-1 rounded-md bg-secondary">
                      {prop}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Requirements */}
            {importedItem.requirements && (
              <div className="text-sm">
                <span className="font-semibold">Requirements:</span> {importedItem.requirements}
              </div>
            )}

            {/* Attunement */}
            {importedItem.attunement && (
              <div className="text-sm text-amber-600 dark:text-amber-400">⚠️ Requires Attunement</div>
            )}

            {/* Source Badge */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="px-2 py-1 rounded-md bg-secondary">
                Source: {importedItem.source === "dnd5eapi" ? "D&D 5e API" : "Open5e"}
              </span>
              {language !== "en" && (
                <span className="px-2 py-1 rounded-md bg-secondary">Auto-translated to {language}</span>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button onClick={handleUseItem} className="flex-1">
                {t.marketplace?.importItem || "Import This Item"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setImportedItem(null)
                  setSelectedItem(null)
                }}
              >
                {t.characterSelector?.cancel || "Cancel"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {searchResults.length === 0 && !isSearching && !error && searchQuery && (
        <Card>
          <CardContent className="py-6 text-center text-muted-foreground">
            <p>{t.marketplace?.noResultsFound || "No items found. Try a different search term."}</p>
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
