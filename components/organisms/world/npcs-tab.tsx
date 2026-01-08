"use client"

import { EmptyState } from "@/components/molecules/empty"
import { NpcCard } from "@/components/molecules/world/npc-card"
import type { Npc } from "@/lib/infrastructure/repositories/npc-repository"
import { Users } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

interface NpcsTabProps {
  npcs: Npc[]
  language?: "es" // Mantener por compatibilidad, pero ya no se usa
}

export function NpcsTab({ npcs, language }: NpcsTabProps) {
  const { t } = useLanguage()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 md:w-5 md:h-5" />
            NPCs
          </h3>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            {t.marketplace?.npcHint || "Personajes no jugadores de la campaña."}
          </p>
        </div>
      </div>
      {npcs.length === 0 ? (
        <EmptyState icon={Users} title="No hay NPCs" description="No hay NPCs creados aún." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {npcs.map((npc) => (
            <NpcCard key={npc.id} npc={npc} />
          ))}
        </div>
      )}
    </div>
  )
}

