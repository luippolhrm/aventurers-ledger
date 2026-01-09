/**
 * Utilidad para obtener nombres de página en español basados en rutas
 */

export function getPageTitle(route: string): string {
  // Normalizar la ruta removiendo parámetros dinámicos
  const normalizedRoute = route
    .replace(/\[.*?\]/g, "") // Remover parámetros dinámicos como [characterId]
    .replace(/\/+/g, "/") // Remover slashes duplicados
    .replace(/^\/|\/$/g, "") // Remover slashes al inicio y final

  const titleMap: Record<string, string> = {
    "": "Dashboard",
    dashboard: "Dashboard",
    characters: "Aventureros",
    campaigns: "Campañas",
    profile: "Perfil",
    settings: "Configuración",
    "characters/new": "Crear Aventurero",
    "campaigns/new": "Crear Campaña",
    "characters/sheet": "Hoja de Personaje",
    "characters/edit": "Editar Aventurero",
    "characters/inventory": "Inventario",
    "characters/story": "Historia",
    "characters/campaigns": "Mis Campañas",
    "characters/join-campaign": "Unirse a Campaña",
    "campaigns/settings": "Configuración de Campaña",
    "campaigns/members": "Miembros",
    "campaigns/npcs": "NPCs",
    "campaigns/locations": "Ubicaciones",
    "campaigns/dungeons": "Mazmorras",
    "campaigns/admin": "Administración",
  }

  return titleMap[normalizedRoute] || "Libro de aventureros"
}

/**
 * Genera el título completo de la página con el sufijo
 */
export function getFullPageTitle(route: string): string {
  const pageTitle = getPageTitle(route)
  return `${pageTitle} - Libro de aventureros`
}
