"use client"

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface NavigationCardProps {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  onClick: () => void
  iconColor?: string
  className?: string
}

export function NavigationCard({
  title,
  description,
  icon: Icon,
  onClick,
  iconColor,
  className,
}: NavigationCardProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer hover:bg-accent/50 transition-colors",
        className
      )}
      onClick={onClick}
    >
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Icon className={cn("w-5 h-5", iconColor)} />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  )
}
