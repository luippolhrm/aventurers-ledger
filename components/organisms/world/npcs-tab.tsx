"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          NPCs ({npcs.length})
        </CardTitle>
        <CardDescription>
          {t.marketplace?.npcHint || "Personajes no jugadores de la campaña"}
        </CardDescription>
      </CardHeader>
      <Separator />
      <CardContent className="pt-6">
        {npcs.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No hay NPCs"
            description="No hay NPCs creados aún."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {npcs.map((npc) => (
              <NpcCard key={npc.id} npc={npc} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

