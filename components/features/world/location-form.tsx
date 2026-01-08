"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLanguage } from "@/lib/language-context"
import type { Location } from "@/lib/infrastructure/repositories/location-repository"

const LOCATION_TYPE_OPTIONS = ["village", "forest", "camp", "port", "ruins", "city"] as const
type LocationType = (typeof LOCATION_TYPE_OPTIONS)[number]

interface LocationFormData {
  name: string
  description: string
  location_type: LocationType
}

interface LocationFormProps {
  initialData?: Location
  onSubmit: (data: LocationFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function LocationForm({ initialData, onSubmit, onCancel, isLoading = false }: LocationFormProps) {
  const { t } = useLanguage()
  const [formData, setFormData] = useState<LocationFormData>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    location_type: (initialData?.location_type as LocationType) || "village",
  })

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        description: initialData.description || "",
        location_type: (initialData.location_type as LocationType) || "village",
      })
    }
  }, [initialData])

  const getLocationTypeLabel = (type: string) => {
    return t.marketplace?.locationTypes?.[type as LocationType] || type
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return
    await onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">{t.marketplace?.locationName || "Nombre"}</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder={t.marketplace?.enterLocationName || "Ingresa el nombre de la ubicación"}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location_type">{t.marketplace?.locationType || "Tipo de Ubicación"}</Label>
        <Select
          value={formData.location_type}
          onValueChange={(value) => setFormData({ ...formData, location_type: value as LocationType })}
        >
          <SelectTrigger>
            <SelectValue placeholder={t.marketplace?.selectLocationType || "Selecciona un tipo"} />
          </SelectTrigger>
          <SelectContent>
            {LOCATION_TYPE_OPTIONS.map((type) => (
              <SelectItem key={type} value={type}>
                {getLocationTypeLabel(type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t.marketplace?.description || "Descripción"}</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder={t.marketplace?.describeLocation || "Describe esta ubicación"}
          rows={4}
        />
      </div>

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          disabled={isLoading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          disabled={isLoading || !formData.name.trim()}
        >
          {isLoading ? "Guardando..." : initialData ? "Actualizar" : "Crear"}
        </button>
      </div>
    </form>
  )
}

