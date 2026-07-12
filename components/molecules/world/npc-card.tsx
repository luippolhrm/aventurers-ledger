"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Npc } from "@/lib/infrastructure/repositories/npc-repository"

interface NpcCardProps {
  npc: Npc
  onClick?: () => void
}

export function NpcCard({ npc, onClick }: NpcCardProps) {
  return (
    <Card onClick={onClick} className={onClick ? "cursor-pointer transition-colors hover:bg-muted/50" : undefined}>
      <CardHeader>
        <CardTitle className="text-base md:text-lg">{npc.name}</CardTitle>
        {npc.title && <CardDescription className="text-xs md:text-sm">{npc.title}</CardDescription>}
        {npc.story && <p className="text-xs md:text-sm text-muted-foreground mt-2">{npc.story}</p>}
        {npc.resistances && (
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            <strong>Resistencias:</strong> {npc.resistances}
          </p>
        )}
      </CardHeader>
    </Card>
  )
}

