/**
 * Utility functions for character-related operations
 */

/**
 * Gets the avatar URL for a character, using default silhouette if no avatar_url is provided
 * @param character - Character object with optional avatar_url and gender
 * @returns URL to the character's avatar or default silhouette
 */
export function getCharacterAvatar(character: { avatar_url?: string | null; gender?: string | null }): string {
  // Si tiene avatar_url, usarlo
  if (character.avatar_url && character.avatar_url.trim() !== "") {
    return character.avatar_url
  }
  
  // Si no, usar silueta según gender
  switch (character.gender) {
    case 'male':
      return '/character-silhouette-male.svg'
    case 'female':
      return '/character-silhouette-female.svg'
    case 'other':
      return '/character-silhouette-default.svg'
    default:
      return '/character-silhouette-default.svg'
  }
}
