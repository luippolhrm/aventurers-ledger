"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CharacterAvatar } from "@/components/atoms/character"
import { CurrencyAmount } from "@/components/atoms/currency"
import { Shield } from "lucide-react"
import { cn } from "@/lib/utils"

interface CharacterCardProps {
  id: string
  name: string
  race: string
  characterClass?: string | null
  level?: number | null
  gender?: string | null
  avatarUrl?: string | null
  wealth?: number
  platinum?: number
  gold?: number
  electrum?: number
  silver?: number
  copper?: number
  onClick?: () => void
  variant?: "default" | "parchment"
  className?: string
}

/**
 * Componente molecule para mostrar una tarjeta de personaje
 * Mejora de AdventurerCard con más opciones y usando nuevos componentes
 */
export function CharacterCard({
  id,
  name,
  race,
  characterClass,
  level,
  gender,
  avatarUrl,
  wealth,
  platinum,
  gold,
  electrum,
  silver,
  copper,
  onClick,
  variant = "default",
  className,
}: CharacterCardProps) {
  const isParchment = variant === "parchment"

  const cardContent = (
    <CardContent className="p-6">
      <div className="flex items-start gap-4">
        <CharacterAvatar
          characterId={id}
          name={name}
          gender={gender}
          avatarUrl={avatarUrl}
          size="lg"
        />

        <div className="flex-1 space-y-3">
          <div>
            <h3 className="font-semibold text-lg leading-tight">{name}</h3>
            <p className="text-sm text-muted-foreground font-serif italic">
              {race}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {characterClass && (
              <Badge variant="secondary">{characterClass}</Badge>
            )}
            {level && <Badge variant="outline">Level {level}</Badge>}
          </div>

          {(wealth !== undefined || platinum !== undefined) && (
            <div className="pt-2 flex items-center gap-2">
              {platinum !== undefined ? (
                <CurrencyAmount
                  platinum={platinum}
                  gold={gold}
                  electrum={electrum}
                  silver={silver}
                  copper={copper}
                />
              ) : (
                <div className="text-sm text-muted-foreground">
                  Wealth: {wealth?.toFixed(2)} GP
                </div>
              )}
              <Shield className="w-4 h-4 text-muted-foreground ml-auto" />
            </div>
          )}
        </div>
      </div>
    </CardContent>
  )

  if (isParchment) {
    return (
      <div
        onClick={onClick}
        className={cn(
          "group relative p-5 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-900 border-2 border-amber-200 dark:border-amber-800 rounded-lg hover:shadow-lg hover:border-amber-400 dark:hover:border-amber-600 transition-all duration-300 overflow-hidden",
          onClick && "cursor-pointer",
          className
        )}
      >
        {/* Parchment texture effect */}
        <div className="absolute inset-0 opacity-5 pattern-bg pointer-events-none" />

        {/* Decorative corner elements */}
        <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-amber-400 dark:border-amber-600" />
        <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-amber-400 dark:border-amber-600" />

        <div className="relative z-10 space-y-3">
          <div className="mb-3">
            <h3 className="text-2xl font-bold text-amber-900 dark:text-amber-50 leading-tight">
              {name}
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-200 font-serif italic">
              {race}
            </p>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-amber-300 dark:via-amber-600 to-transparent" />

          <div className="flex items-center gap-3 pt-2">
            {wealth !== undefined && (
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-amber-800 dark:text-amber-100">
                  {Math.floor(wealth)} GP
                </span>
              </div>
            )}
            <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400 ml-auto" />
          </div>
        </div>

        {/* Hover effect glow */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-r from-amber-400 to-yellow-400 dark:from-amber-600 dark:to-yellow-600 transition-opacity duration-300 pointer-events-none" />
      </div>
    )
  }

  return (
    <Card
      onClick={onClick}
      className={cn(
        "transition-all hover:shadow-lg",
        onClick && "cursor-pointer hover:border-primary",
        className
      )}
    >
      {cardContent}
    </Card>
  )
}

