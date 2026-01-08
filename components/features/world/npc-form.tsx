"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useLanguage } from "@/lib/language-context"
import type { Npc } from "@/lib/infrastructure/repositories/npc-repository"

interface NpcFormData {
  name: string
  title: string
  resistances: string
  story: string
}

interface NpcFormProps {
  initialData?: Npc | { name: string; title: string | null; resistances: string | null; story: string | null }
  onSubmit: (data: NpcFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function NpcForm({ initialData, onSubmit, onCancel, isLoading = false }: NpcFormProps) {
  const { t } = useLanguage()
  const [formData, setFormData] = useState<NpcFormData>({
    name: initialData?.name || "",
    title: initialData?.title || "",
    resistances: initialData?.resistances || "",
    story: initialData?.story || "",
  })

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        title: initialData.title || "",
        resistances: initialData.resistances || "",
        story: initialData.story || "",
      })
    }
  }, [initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return
    await onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">{t.marketplace?.npcName || "Nombre"}</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder={t.marketplace?.npcName || "Ingresa el nombre del NPC"}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">{t.marketplace?.npcTitleField || "Título"}</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder={t.marketplace?.npcTitleField || "Título o cargo del NPC (opcional)"}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="resistances">{t.marketplace?.npcResistances || "Resistencias"}</Label>
        <Textarea
          id="resistances"
          value={formData.resistances}
          onChange={(e) => setFormData({ ...formData, resistances: e.target.value })}
          placeholder={t.marketplace?.npcResistances || "Resistencias y vulnerabilidades (opcional)"}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="story">{t.marketplace?.npcStory || "Historia"}</Label>
        <Textarea
          id="story"
          value={formData.story}
          onChange={(e) => setFormData({ ...formData, story: e.target.value })}
          placeholder={t.marketplace?.npcStory || "Historia y descripción del NPC (opcional)"}
          rows={5}
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

