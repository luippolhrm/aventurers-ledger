"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Download, ExternalLink, X } from "lucide-react"
import { translations, type Language } from "@/lib/translations"
import type { ShopItemExtended, ApiSearchResult } from "@/lib/services/item-api-service"

interface ShopItemApiImporterProps {
  language: Language
  onItemImported: (item: ShopItemExtended) => void
}

// Category and rarity options will be generated from translations

export function ShopItemApiImporter({ language, onItemImported }: ShopItemApiImporterProps) {
  const t = translations[language]

  // Use Open5e as default to get more editions/sourcebooks
  const selectedApi: "open5e" = "open5e"
  // Always use Gemini as default provider
  const provider: "gemini" = "gemini"
  
  const [allItems, setAllItems] = useState<ApiSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedItem, setSelectedItem] = useState<ApiSearchResult | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importedItem, setImportedItem] = useState<ShopItemExtended | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Search items in real-time as user types (with debounce)
  useEffect(() => {
    // Clear items if search is empty
    if (!searchQuery.trim()) {
      setAllItems([])
      return
    }

    // Debounce: wait 500ms after user stops typing
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery.trim())
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const performSearch = async (query: string) => {
    if (!query) {
      setAllItems([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const url = `/api/items/import?api=${selectedApi}&query=${encodeURIComponent(query)}`

      const response = await fetch(url)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to search items")
      }

      const data = await response.json()
      setAllItems(data.results || [])
    } catch (err) {
      console.error("Error searching items:", err)
      setError(err instanceof Error ? err.message : "Unknown error occurred")
      setAllItems([])
    } finally {
      setIsLoading(false)
    }
  }

  // Items are already filtered by the API search, just use them directly
  const filteredItems = useMemo(() => {
    // Sort items alphabetically by name
    return [...allItems].sort((a, b) => a.name.localeCompare(b.name))
  }, [allItems])

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
        let errorData
        try {
          errorData = await response.json()
        } catch {
          errorData = {}
        }
        const errorMessage = errorData.details || errorData.error || `Failed to import item (Status: ${response.status})`
        throw new Error(errorMessage)
      }

      const data = await response.json()
      setImportedItem(data.item)
    } catch (err) {
      console.error("Error importing item:", err)
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      setError(errorMessage)
    } finally {
      setIsImporting(false)
    }
  }

  const handleUseItem = () => {
    if (importedItem) {
      onItemImported(importedItem)
      // Reset form
      setSearchQuery("")
      setAllItems([])
      setSelectedItem(null)
      setImportedItem(null)
    }
  }


  const handleClearSearch = () => {
    setSearchQuery("")
    setAllItems([])
  }

  const hasSearchQuery = searchQuery.trim().length > 0

  return (
    <div className="space-y-6 w-full">
      {/* Search Section */}
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              {t.marketplace?.searchItems || "Buscar Items"}
            </CardTitle>
            {hasSearchQuery && (
              <Button variant="ghost" size="sm" onClick={handleClearSearch}>
                <X className="w-4 h-4 mr-1" />
                {t.marketplace?.clearSearch || "Limpiar"}
              </Button>
            )}
          </div>
          <CardDescription>
            {isLoading
              ? t.marketplace?.searching || "Buscando..."
              : allItems.length > 0
              ? `${allItems.length} ${t.marketplace?.itemsFound || "items encontrados"}`
              : searchQuery.trim()
              ? t.marketplace?.noResultsFound || "No se encontraron items."
              : t.marketplace?.searchPrompt || "Escribe para buscar items en tiempo real"}
          </CardDescription>
        </CardHeader>
        <CardContent className="w-full">
          {/* Search Input */}
          <div>
            <Label htmlFor="search_query">{t.inventory?.search || "Buscar por nombre"}</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="search_query"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='e.g., "Longsword", "Ring of Protection"'
                disabled={isLoading}
                className="w-full"
              />
              {isLoading && (
                <div className="flex items-center px-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t.marketplace?.realTimeSearchHint || "La búsqueda se realiza automáticamente mientras escribes"}
            </p>
          </div>
        </CardContent>
      </Card>

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

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="py-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {t.marketplace?.searching || "Buscando items..."}
              </p>
              <div className="mt-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items List */}
      {!isLoading && filteredItems.length > 0 && !importedItem && (
        <div className="space-y-3 w-full">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {t.marketplace?.searchResults || "Resultados"} ({filteredItems.length})
            </h3>
          </div>
          <div className="grid gap-3 max-h-[500px] overflow-y-auto w-full">
            {filteredItems.map((item) => (
              <Card
                key={item.index}
                className={`cursor-pointer transition-all hover:border-primary hover:shadow-md ${
                  selectedItem?.index === item.index ? "border-2 border-primary shadow-md" : ""
                }`}
                onClick={() => !isImporting && setSelectedItem(item)}
              >
                <CardHeader className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">{item.name}</CardTitle>
                      {(item.source || item.edition) && (
                        <CardDescription className="text-xs mt-1">
                          {item.edition || item.source || "Unknown"}
                        </CardDescription>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant={selectedItem?.index === item.index ? "default" : "outline"}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleImportItem(item)
                      }}
                      disabled={isImporting}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {selectedItem?.index === item.index && isImporting
                        ? (t.marketplace?.importing || "Importando...")
                        : (t.marketplace?.importItem || "Importar")}
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State - No search yet */}
      {!isLoading && !searchQuery.trim() && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-semibold">{t.marketplace?.searchToFindItems || "Busca items para comenzar"}</p>
            <p className="text-sm mt-2">
              {t.marketplace?.searchDescription || "Escribe el nombre de un item en el campo de búsqueda arriba"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Empty State - No results from search */}
      {!isLoading && searchQuery.trim() && allItems.length === 0 && (
        <Card>
          <CardContent className="py-6 text-center text-muted-foreground">
            <p>{t.marketplace?.noResultsFound || "No se encontraron items. Intenta con otro término de búsqueda."}</p>
            <Button variant="outline" className="mt-4" onClick={handleClearSearch}>
              {t.marketplace?.clearSearch || "Limpiar búsqueda"}
            </Button>
          </CardContent>
        </Card>
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
                  {importedItem.item_type} {importedItem.item_category && `� ${importedItem.item_category}`}
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
              <div className="text-sm text-amber-600 dark:text-amber-400">?? Requires Attunement</div>
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
