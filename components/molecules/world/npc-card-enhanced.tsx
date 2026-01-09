"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { Npc } from "@/lib/infrastructure/repositories/npc-repository"
import type { Shop } from "@/lib/infrastructure/repositories/shop-repository"
import type { DungeonRoom } from "@/lib/infrastructure/repositories/dungeon-repository.types"
import { CheckCircle2, Circle, Store, MapPin, ChevronDown, ChevronRight } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

interface NpcCardEnhancedProps {
  npc: Npc
  shops?: Shop[]
  dungeonRooms?: Array<DungeonRoom & { dungeonName?: string }>
  showAssignments?: boolean
  onClick?: () => void
  campaignId: string
}

export function NpcCardEnhanced({
  npc,
  shops = [],
  dungeonRooms = [],
  showAssignments = true,
  onClick,
  campaignId,
}: NpcCardEnhancedProps) {
  const { t } = useLanguage()
  const [isExpanded, setIsExpanded] = useState(false)

  const isAssigned = shops.length > 0 || dungeonRooms.length > 0
  const totalAssignments = shops.length + dungeonRooms.length

  return (
    <Card className={onClick ? "cursor-pointer hover:bg-muted/50 transition-colors" : ""} onClick={onClick}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base md:text-lg truncate">{npc.name}</CardTitle>
            {npc.title && <CardDescription className="text-xs md:text-sm truncate">{npc.title}</CardDescription>}
          </div>
          {showAssignments && (
            <Badge variant={isAssigned ? "default" : "secondary"} className="shrink-0">
              {isAssigned ? (
                <>
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  {t.marketplace?.npcs?.assigned || "Asignado"}
                </>
              ) : (
                <>
                  <Circle className="w-3 h-3 mr-1" />
                  {t.marketplace?.npcs?.unassigned || "Sin asignar"}
                </>
              )}
            </Badge>
          )}
        </div>
      </CardHeader>

      {showAssignments && isAssigned && totalAssignments > 0 && (
        <CardContent>
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between text-xs">
                <span>
                  {totalAssignments} {totalAssignments === 1 ? "asignación" : "asignaciones"}
                </span>
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              {shops.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    {t.marketplace?.shops || "Tiendas"}:
                  </p>
                  <div className="space-y-1">
                    {shops.map((shop) => (
                      <div key={shop.id} className="flex items-center gap-2 text-xs">
                        <Store className="w-3 h-3 text-muted-foreground" />
                        <span className="truncate">{shop.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {dungeonRooms.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    {t.marketplace?.dungeons?.rooms || "Salas"}:
                  </p>
                  <div className="space-y-1">
                    {dungeonRooms.map((room) => (
                      <div key={room.id} className="flex items-center gap-2 text-xs">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        <span className="truncate">
                          {room.name}
                          {room.dungeonName && (
                            <span className="text-muted-foreground"> ({room.dungeonName})</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      )}
    </Card>
  )
}

