"use client"

import { LocationsMap } from "./locations-map"
interface MapProps {
  language?: "es" // Mantener por compatibilidad, pero ya no se usa
}

export function Map({ language }: MapProps) {
  return <LocationsMap language={language} />
}
