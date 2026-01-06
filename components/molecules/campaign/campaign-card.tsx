"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Map, Users, Crown, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface CampaignCardProps {
  id: string
  name: string
  description?: string | null
  status?: string
  role?: "game_master" | "player"
  memberCount?: number
  gmName?: string
  onClick?: () => void
  onView?: () => void
  className?: string
}

/**
 * Componente molecule para mostrar una tarjeta de campaña
 */
export function CampaignCard({
  id,
  name,
  description,
  status,
  role,
  memberCount,
  gmName,
  onClick,
  onView,
  className,
}: CampaignCardProps) {
  const isGM = role === "game_master"
  const isPlayer = role === "player"

  return (
    <Card
      onClick={onClick}
      className={cn(
        "transition-all hover:shadow-lg",
        onClick && "cursor-pointer hover:border-primary",
        className
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Map className="w-5 h-5 text-primary" />
              <CardTitle className="text-xl">{name}</CardTitle>
            </div>
            {description && (
              <CardDescription className="line-clamp-2">
                {description}
              </CardDescription>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {isGM && (
              <Badge variant="default" className="gap-1">
                <Crown className="w-3 h-3" />
                GM
              </Badge>
            )}
            {isPlayer && (
              <Badge variant="secondary" className="gap-1">
                <Users className="w-3 h-3" />
                Player
              </Badge>
            )}
            {status && (
              <Badge variant="outline" className="text-xs">
                {status}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {memberCount !== undefined && (
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{memberCount} miembros</span>
            </div>
          )}
          {gmName && (
            <div className="flex items-center gap-1">
              <Crown className="w-4 h-4" />
              <span>{gmName}</span>
            </div>
          )}
        </div>

        {onView && (
          <Button
            variant="outline"
            className="w-full"
            onClick={(e) => {
              e.stopPropagation()
              onView()
            }}
          >
            Ver Campaña
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

