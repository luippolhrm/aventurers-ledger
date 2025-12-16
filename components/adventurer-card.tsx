"use client"

import { Coins, Shield } from "lucide-react"

interface AdventurerCardProps {
  name: string
  race: string
  wealth: number
  onSelect?: () => void
}

export function AdventurerCard({ name, race, wealth, onSelect }: AdventurerCardProps) {
  // wealth is already in GP (Gold Pieces), not CP (Copper Pieces)
  // The database stores total_wealth as: (platinum * 10) + gold + (electrum * 0.5) + (silver * 0.1) + (copper * 0.01)
  const goldPieces = Math.floor(wealth)
  const silverPieces = Math.floor((wealth % 1) * 10)
  const copperPieces = Math.floor((wealth % 0.1) * 100)

  return (
    <div
      onClick={onSelect}
      className="group relative p-5 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-900 border-2 border-amber-200 dark:border-amber-800 rounded-lg hover:shadow-lg hover:border-amber-400 dark:hover:border-amber-600 transition-all duration-300 cursor-pointer overflow-hidden"
    >
      {/* Parchment texture effect */}
      <div className="absolute inset-0 opacity-5 pattern-bg pointer-events-none" />

      {/* Decorative corner elements */}
      <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-amber-400 dark:border-amber-600" />
      <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-amber-400 dark:border-amber-600" />

      <div className="relative z-10 space-y-3">
        {/* Character Name - Prominent */}
        <div className="mb-3">
          <h3 className="text-2xl font-bold text-amber-900 dark:text-amber-50 leading-tight">{name}</h3>
          <p className="text-sm text-amber-700 dark:text-amber-200 font-serif italic">{race}</p>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-amber-300 dark:via-amber-600 to-transparent" />

        {/* Wealth Display */}
        <div className="flex items-center gap-3 pt-2">
          <div className="flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-amber-700 dark:text-amber-300" />
            <span className="text-sm font-semibold text-amber-800 dark:text-amber-100">
              {goldPieces > 0 && <span>{goldPieces} GP</span>}
              {goldPieces === 0 && silverPieces > 0 && <span>{silverPieces} SP</span>}
              {goldPieces === 0 && silverPieces === 0 && <span>{copperPieces} CP</span>}
              {goldPieces === 0 && silverPieces === 0 && copperPieces === 0 && <span>0 GP</span>}
            </span>
          </div>
          <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400 ml-auto" />
        </div>
      </div>

      {/* Hover effect glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-r from-amber-400 to-yellow-400 dark:from-amber-600 dark:to-yellow-600 transition-opacity duration-300 pointer-events-none" />
    </div>
  )
}
