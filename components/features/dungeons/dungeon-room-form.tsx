"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/lib/language-context"
import type { DungeonRoom } from "@/lib/infrastructure/repositories/dungeon-repository.types"
import { ROOM_TYPE_OPTIONS, ROOM_TYPE_METADATA, type RoomType } from "@/lib/constants/dungeon-constants"
import { Info } from "lucide-react"

interface DungeonRoomFormData {
  name: string
  description: string
  room_type: string
  order_index: number
}

interface DungeonRoomFormProps {
  initialData?: DungeonRoom
  onSubmit: (data: DungeonRoomFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function DungeonRoomForm({ initialData, onSubmit, onCancel, isLoading = false }: DungeonRoomFormProps) {
  const { t } = useLanguage()
  const [formData, setFormData] = useState<DungeonRoomFormData>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    room_type: initialData?.room_type || "",
    order_index: initialData?.order_index || 0,
  })

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        description: initialData.description || "",
        room_type: initialData.room_type || "",
        order_index: initialData.order_index || 0,
      })
    }
  }, [initialData])

  const getRoomTypeLabel = (type: string) => {
    return t.marketplace?.roomTypes?.[type as keyof typeof t.marketplace.roomTypes] || type
  }

  const getSelectedRoomTypeInfo = () => {
    if (!formData.room_type) return null
    const metadata = ROOM_TYPE_METADATA[formData.room_type as RoomType]
    const description = t.marketplace?.roomTypeDescriptions?.[formData.room_type as RoomType]
    return { metadata, description }
  }

  const selectedRoomTypeInfo = getSelectedRoomTypeInfo()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return
    await onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre de la Sala</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ingresa el nombre de la sala"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="room_type">Tipo de Sala</Label>
        <Select
          value={formData.room_type}
          onValueChange={(value) => setFormData({ ...formData, room_type: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un tipo" />
          </SelectTrigger>
          <SelectContent>
            {ROOM_TYPE_OPTIONS.map((type) => (
              <SelectItem key={type} value={type}>
                {getRoomTypeLabel(type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedRoomTypeInfo && selectedRoomTypeInfo.description && (
          <Alert>
            <Info className="w-4 h-4" />
            <AlertDescription className="space-y-2">
              <p className="text-sm">{selectedRoomTypeInfo.description}</p>
              {selectedRoomTypeInfo.metadata && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedRoomTypeInfo.metadata.typicalEnemies && selectedRoomTypeInfo.metadata.typicalEnemies.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      Enemigos: {selectedRoomTypeInfo.metadata.typicalEnemies.join(", ")}
                    </Badge>
                  )}
                  {selectedRoomTypeInfo.metadata.typicalRewards && selectedRoomTypeInfo.metadata.typicalRewards.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      Recompensas: {selectedRoomTypeInfo.metadata.typicalRewards.join(", ")}
                    </Badge>
                  )}
                  {selectedRoomTypeInfo.metadata.environmentalHazards && selectedRoomTypeInfo.metadata.environmentalHazards.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      Peligros: {selectedRoomTypeInfo.metadata.environmentalHazards.join(", ")}
                    </Badge>
                  )}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="order_index">Orden</Label>
        <Input
          id="order_index"
          type="number"
          min="0"
          value={formData.order_index}
          onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
          placeholder="0"
        />
        <p className="text-xs text-muted-foreground">Orden de la sala en la mazmorra (0 = primero)</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe esta sala"
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

