"use client"

import { LocationsMap } from "./locations-map"
import { type Language } from "@/lib/translations"

interface MapProps {
  language: Language
}

export function Map({ language }: MapProps) {
  return <LocationsMap language={language} />
}
