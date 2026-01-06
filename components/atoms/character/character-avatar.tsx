"use client"

import Image from "next/image"
import { User } from "lucide-react"
import { getCharacterAvatar } from "@/lib/character-utils"
import { cn } from "@/lib/utils"

interface CharacterAvatarProps {
  characterId: string
  name: string
  gender?: string | null
  avatarUrl?: string | null
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
  xl: "w-24 h-24",
}

const iconSizeClasses = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
  xl: "w-12 h-12",
}

/**
 * Componente atom para mostrar el avatar de un personaje
 * Incluye fallback a icono si la imagen no carga
 */
export function CharacterAvatar({
  characterId,
  name,
  gender,
  avatarUrl,
  size = "md",
  className,
}: CharacterAvatarProps) {
  const sizeClass = sizeClasses[size]
  const iconSizeClass = iconSizeClasses[size]

  // Usar avatarUrl si está disponible, sino usar la función helper
  const avatarSrc = avatarUrl || getCharacterAvatar({ avatar_url: null, gender })

  return (
    <div
      className={cn(
        "relative rounded-full overflow-hidden bg-muted flex items-center justify-center border-2 border-border",
        sizeClass,
        className
      )}
    >
      <Image
        src={avatarSrc}
        alt={name}
        fill
        className="object-cover"
        onError={(e) => {
          // Ocultar imagen si falla, mostrará el icono de fallback
          e.currentTarget.style.display = "none"
        }}
      />
      <User
        className={cn(
          "absolute text-muted-foreground opacity-50",
          iconSizeClass
        )}
      />
    </div>
  )
}

