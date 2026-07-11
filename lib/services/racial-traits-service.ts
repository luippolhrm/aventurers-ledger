/**
 * Servicio para gestionar traits raciales, Character Origins y Backgrounds del PHB 2024
 * Todos los textos están en español
 */

import { FeatService, type OriginFeat as FeatServiceOriginFeat } from "@/lib/application/services/feat-service"

export interface RacialTrait {
  id: string
  name: string // En español
  description: string // En español
  affects: ("carrying_capacity" | "ability_scores" | "speed" | "vision" | "saving_throws" | "skills" | "shop" | "other")[]
  requiredLevel?: number // Nivel mínimo requerido (opcional)
  lineage?: string // Linaje al que pertenece (opcional, ej: "high_elf", "drow", "wood_elf")
  shopEffects?: {
    discount_percent?: number
    negotiation_bonus?: number
  }
}

export interface SpeciesLineage {
  id: string
  name: string
  description: string
  traits: string[] // IDs de traits del linaje (pueden tener requiredLevel)
}

/**
 * @deprecated Esta interfaz está deprecada. Usa OriginFeat de FeatService en su lugar.
 * Se mantiene por compatibilidad hacia atrás.
 */
export interface OriginFeat {
  id: string
  name: string
  description: string
  prerequisites?: string[] // Requisitos opcionales (ej: nivel mínimo, otros feats)
}

export interface CharacterOrigin {
  id: string
  name: string // En español
  description: string
  defaultSize: "small" | "medium" | "large"
  sizeOptions?: ("small" | "medium" | "large")[] // Opciones de tamaño disponibles (si aplica)
  traits: string[] // IDs de traits base (siempre activos)
  lineages?: SpeciesLineage[] // Linajes disponibles (opcional, solo para especies con linajes)
  lineageTypeName?: string // Nombre del tipo de linaje (ej: "Linaje Élfico", "Legado Infernal", "Linaje de Gnomo")
  shopBonuses?: {
    discount_percent?: number
    negotiation_bonus?: number
  }
}

export interface BackgroundDefinition {
  id: string
  name: string // En español
  description: string
  // Las tres características que este background puede mejorar (PHB 2024)
  abilityScoreOptions: Array<"strength" | "dexterity" | "constitution" | "intelligence" | "wisdom" | "charisma">
  // Mantener como sugerencias/valores por defecto (opcional, para referencia)
  suggestedBonuses?: {
    strength?: number
    dexterity?: number
    constitution?: number
    intelligence?: number
    wisdom?: number
    charisma?: number
  }
}

export interface AbilityScores {
  strength?: number | null
  dexterity?: number | null
  constitution?: number | null
  intelligence?: number | null
  wisdom?: number | null
  charisma?: number | null
}

export interface ShopBonuses {
  discount_percent?: number
  negotiation_bonus?: number
}

/**
 * Interfaces para el sistema PHB 2014
 */
export interface Subrace2014 {
  id: string
  name: string // En español
  description: string
  abilityBonuses: Partial<AbilityScores> // Bonos adicionales de la subraza
  traits: string[] // Traits adicionales de la subraza
}

export interface Race2014 {
  id: string
  name: string // En español
  description: string
  baseAbilityBonuses: Partial<AbilityScores> // Bonos base de la raza
  hasSubraces: boolean
  subraces?: Subrace2014[]
  defaultSize: "small" | "medium" | "large"
  traits: string[] // IDs de traits raciales base
  // Para casos especiales: humano variante y semielfo
  requiresManualSelection?: boolean // Si requiere selección manual de características
  abilityScoreOptions?: Array<"strength" | "dexterity" | "constitution" | "intelligence" | "wisdom" | "charisma"> // Opciones disponibles para selección manual
}

/**
 * Servicio estático para gestionar traits raciales, Character Origins y Backgrounds
 */
export class RacialTraitService {
  /**
   * Obtiene todos los traits raciales disponibles
   */
  static getTraits(): RacialTrait[] {
    return [
      {
        id: "powerful_build",
        name: "Constitución poderosa",
        description: "Tienes ventaja en cualquier prueba de característica que hagas para poner fin al estado de agarrado. Además, al determinar tu capacidad de carga, cuentas como si tuvieras un tamaño una categoría superior.",
        affects: ["carrying_capacity", "saving_throws"],
      },
      {
        id: "large_form",
        name: "Forma grande",
        description: "A partir del nivel 5 de personaje, puedes cambiar de tamaño a Grande como acción adicional si estás en un lugar lo bastante espacioso. Esta transformación dura 10 minutos o hasta que le pongas fin (no requiere acción). Durante ese tiempo, tendrás ventaja en las pruebas de Fuerza y tu velocidad aumentará en 3 m. Cuando uses este atributo, no podrás volver a hacerlo hasta que finalices un descanso largo.",
        affects: ["speed", "ability_scores"],
        requiredLevel: 5,
      },
      {
        id: "giant_lineage",
        name: "Linaje gigante",
        description: "Desciendes de los gigantes. Elige uno de los siguientes beneficios sobrenaturales que te concede tu linaje; podrás usar el beneficio elegido una cantidad de veces igual a tu bonificador por competencia y recuperas todos los usos tras finalizar un descanso largo.",
        affects: ["other"],
      },
      {
        id: "darkvision",
        name: "Visión en la Oscuridad",
        description: "Puedes ver en luz tenue dentro de un rango específico como si fuera luz brillante, y en la oscuridad como si fuera luz tenue. El rango varía según la especie.",
        affects: ["vision"],
      },
      {
        id: "keen_senses",
        name: "Sentidos Agudos",
        description: "Tienes competencia en la habilidad Percepción, Perspicacia o Supervivencia.",
        affects: ["skills"],
      },
      {
        id: "fey_ancestry",
        name: "Ascendencia Feérica",
        description: "Tienes ventaja en las tiradas de salvación contra ser hechizado, y la magia no puede hacerte dormir.",
        affects: ["saving_throws"],
      },
      {
        id: "trance",
        name: "Trance",
        description: "No necesitas dormir. En lugar de eso, meditas profundamente, permaneciendo semiconsciente, durante 4 horas al día.",
        affects: ["other"],
      },
      // stonecunning - PHB 2014 (comentado, reemplazado por stone_affinity en PHB 2024)
      // {
      //   id: "stonecunning",
      //   name: "Astucia de Piedra",
      //   description: "Siempre que hagas una tirada de Inteligencia (Historia) relacionada con el origen de una obra de mampostería, se considera que tienes competencia en la habilidad Historia y añades el doble de tu bonificador de competencia a la tirada, en lugar de tu bonificador normal.",
      //   affects: ["skills"],
      // },
      {
        id: "dwarven_resistance",
        name: "Resistencia Enana",
        description: "Tienes resistencia al daño por veneno y ventaja en las tiradas de salvación para evitar o terminar la condición envenenado.",
        affects: ["saving_throws", "other"],
      },
      {
        id: "stone_affinity",
        name: "Afinidad con la Piedra",
        description: "Como acción adicional, ganas la capacidad de sentir vibraciones dentro de 18m durante 10 minutos, siempre que estés sobre o en contacto con una superficie de piedra natural o trabajada. Puedes usar este atributo un número de veces igual a tu bonificador por competencia, y recuperas todos los usos gastados cuando termines un descanso largo.",
        affects: ["other"],
      },
      {
        id: "dwarven_endurance",
        name: "Aguante Enano",
        description: "Tus puntos de golpe máximos aumentan en 1, y en 1 adicional cada vez que ganas un nivel.",
        affects: ["other"],
      },
      // dwarf_darkvision_36m - Eliminado, ahora se usa darkvision genérico con getDarkvisionRange()
      {
        id: "gnome_cunning",
        name: "Astucia Gnoma",
        description: "Tienes ventaja en todas las tiradas de salvación de Inteligencia, Sabiduría y Carisma contra magia.",
        affects: ["saving_throws"],
      },
      {
        id: "lucky",
        name: "Fortuna",
        description: "Cuando saques un 1 en una prueba con d20, podrás repetir la tirada y deberás utilizar el nuevo resultado.",
        affects: ["other"],
      },
      {
        id: "brave",
        name: "Valiente",
        description: "Tienes ventaja en las tiradas de salvación que hagas para evitar o poner fin al estado de asustado.",
        affects: ["saving_throws"],
      },
      {
        id: "halfling_nimbleness",
        name: "Agilidad de mediano",
        description: "Puedes moverte a través del espacio ocupado por cualquier criatura de tamaño superior al tuyo, pero no puedes detenerte en el mismo espacio.",
        affects: ["speed"],
      },
      {
        id: "naturally_stealthy",
        name: "Sigiloso por naturaleza",
        description: "Puedes llevar a cabo la acción de esconderte incluso tras una criatura cuyo tamaño sea, al menos, una categoría superior al tuyo.",
        affects: ["skills"],
      },
      {
        id: "relentless_endurance",
        name: "Aguante incansable",
        description: "Cuando te reduzcan a 0 puntos de golpe pero no mueras inmediatamente, puedes recuperar 1 punto de golpe en su lugar. No puedes usar este rasgo de nuevo hasta que termines un descanso largo.",
        affects: ["other"],
      },
      {
        id: "adrenaline_rush",
        name: "Descarga de adrenalina",
        description: "Puedes usar la acción de Correr como acción adicional. Cuando lo hagas, ganas puntos de golpe temporales iguales a tu bonificador por competencia. Puedes usar este atributo un número de veces igual a tu bonificador por competencia, y recuperas todos los usos gastados cuando termines un descanso corto o largo.",
        affects: ["speed", "other"],
      },
      {
        id: "savage_attacks",
        name: "Ataques Salvajes",
        description: "Cuando consigas un crítico con un ataque cuerpo a cuerpo con un arma, puedes tirar uno de los dados de daño del arma una vez más y añadirlo al daño adicional del crítico.",
        affects: ["other"],
      },
      {
        id: "hellish_resistance",
        name: "Resistencia Infernal",
        description: "Tienes resistencia al daño por fuego.",
        affects: ["other"],
      },
      {
        id: "infernal_legacy",
        name: "Legado infernal",
        description: "Recibes un legado que te otorga habilidades sobrenaturales. Eliges un legado de la tabla 'Legados infernales' y obtienes el beneficio de Nivel 1. Al alcanzar los niveles de personaje 3 y 5, aprendes un hechizo de nivel superior como se muestra en la tabla. Ese hechizo siempre está preparado y puedes lanzarlo una vez sin gastar un espacio de conjuro, recuperando esta habilidad cuando termines un descanso largo. También puedes lanzarlo usando cualquier espacio de conjuro de nivel apropiado. La aptitud mágica para estos hechizos (Inteligencia, Sabiduría o Carisma) se elige cuando seleccionas el legado.",
        affects: ["other"],
      },
      {
        id: "supernatural_presence",
        name: "Presencia sobrenatural",
        description: "Conoces el truco taumaturgia. Cuando lo lanzas con este atributo, el hechizo usa la misma aptitud mágica que el atributo Legado infernal.",
        affects: ["other"],
      },
      {
        id: "breath_weapon",
        name: "Ataque de Aliento",
        description: "Como acción de ataque, puedes reemplazar uno de tus ataques con una exhalación de energía mágica. Elige un cono de 4.5m o una línea de 9m de largo y 1.5m de ancho. Las criaturas en el área deben realizar una tirada de salvación de Destreza (CD = 8 + tu modificador de Constitución + tu bonificador por competencia). Si fallan, reciben 1d10 de daño del tipo determinado por tu Linaje Dracónico; si tienen éxito, reciben la mitad del daño. El daño aumenta a 2d10 en el nivel 5, 3d10 en el nivel 11 y 4d10 en el nivel 17. Puedes usar este atributo un número de veces igual a tu bonificador por competencia, y recuperas todos los usos gastados cuando termines un descanso largo.",
        affects: ["other"],
      },
      {
        id: "damage_resistance",
        name: "Resistencia al Daño",
        description: "Tienes resistencia al tipo de daño determinado por tu Linaje Dracónico (ver tabla de Ancestros Dracónicos).",
        affects: ["other"],
      },
      {
        id: "draconic_ancestry",
        name: "Linaje Dracónico",
        description: "Tu linaje proviene de un progenitor dragón. Elige un tipo de dragón de la tabla de Ancestros Dracónicos, que determina el tipo de daño de tu Ataque de Aliento y tu Resistencia al Daño, así como tu apariencia. Ancestros Dracónicos: Azul/Bronce (Relámpago), Blanco/Plata (Frío), Cobre/Negro (Ácido), Oro/Oropel/Rojo (Fuego), Verde (Veneno).",
        affects: ["other"],
      },
      {
        id: "draconic_flight",
        name: "Vuelo Dracónico",
        description: "Cuando alcances el nivel 5 de personaje, puedes manifestar alas espectrales temporalmente como acción adicional. Las alas duran 10 minutos o hasta que las descartes (no requiere acción) o quedes incapacitado. Mientras vuelas, tu velocidad de vuelo es igual a tu velocidad caminando. Las alas parecen estar hechas de la misma energía que tu aliento. Cuando uses este atributo, no podrás volver a hacerlo hasta que finalices un descanso largo.",
        affects: ["other"],
      },
      {
        id: "natural_armor",
        name: "Armadura Natural",
        description: "Cuando no llevas armadura, tu CA es 13 + tu modificador de Destreza. Puedes usar un escudo y seguir obteniendo este beneficio.",
        affects: ["other"],
      },
      {
        id: "goliath_power",
        name: "Poder Goliat",
        description: "Cuentas como una categoría de tamaño más grande cuando determinas tu capacidad de carga y el peso que puedes empujar, arrastrar o levantar.",
        affects: ["carrying_capacity"],
      },
      {
        id: "healing_hands",
        name: "Manos Curativas",
        description: "Como acción de magia, tocas a una criatura y tiras una cantidad de d4 igual a tu bonificador por competencia. La criatura recupera una cantidad de puntos de golpe igual al resultado total de la tirada. Cuando uses este atributo, no podrás volver a hacerlo hasta que finalices un descanso largo.",
        affects: ["other"],
      },
      {
        id: "light_bearer",
        name: "Portador de Luz",
        description: "Conoces el truco luz. El Carisma es tu aptitud mágica para lanzarlo.",
        affects: ["other"],
      },
      {
        id: "celestial_resistance",
        name: "Resistencia Celestial",
        description: "Tienes resistencia al daño necrótico y al radiante.",
        affects: ["other"],
      },
      {
        id: "celestial_revelation",
        name: "Revelación Celestial",
        description: "Cuando alcanzas el nivel 3 de personaje, puedes transformarte como acción adicional y usar una de las opciones: Alas Celestiales (velocidad volando igual a tu velocidad), Fulgor Interior (emites luz brillante en 3m y luz tenue 3m más, y al final de cada turno las criaturas a 3m o menos reciben daño radiante igual a tu bonificador por competencia), o Mortaja Necrótica (alas que no permiten volar y asustan a enemigos a 3m o menos con una tirada de salvación de Carisma). La transformación dura 1 minuto o hasta que le pongas fin. Una vez por descanso largo.",
        affects: ["other"],
      },
      // Traits de Linajes Élficos - Alto Elfo
      {
        id: "high_elf_prestidigitation",
        name: "Prestidigitación (Alto Elfo)",
        description: "Conoces el truco prestidigitación. Tras finalizar un descanso largo, puedes sustituir ese truco por otro truco diferente de la lista de conjuros de mago. La aptitud mágica para lanzarlo es Inteligencia, Sabiduría o Carisma (eliges cuando seleccionas el linaje).",
        affects: ["other"],
        requiredLevel: 1,
        lineage: "high_elf",
      },
      {
        id: "high_elf_detect_magic",
        name: "Detectar Magia (Alto Elfo)",
        description: "A partir del nivel 3, puedes lanzar el hechizo detectar magia una vez sin gastar un espacio de conjuro. Siempre lo tienes preparado y también puedes lanzarlo usando espacios de conjuro de nivel apropiado. Recuperas todos los usos gastados cuando termines un descanso largo.",
        affects: ["other"],
        requiredLevel: 3,
        lineage: "high_elf",
      },
      {
        id: "high_elf_misty_step",
        name: "Paso Brumoso (Alto Elfo)",
        description: "A partir del nivel 5, puedes lanzar el hechizo paso brumoso una vez sin gastar un espacio de conjuro. Siempre lo tienes preparado y también puedes lanzarlo usando espacios de conjuro de nivel apropiado. Recuperas todos los usos gastados cuando termines un descanso largo.",
        affects: ["other"],
        requiredLevel: 5,
        lineage: "high_elf",
      },
      // Traits de Linajes Élficos - Drow
      // drow_darkvision_36m - Eliminado, ahora se usa darkvision genérico con getDarkvisionRange()
      // El rango de 36m para drow se maneja en getDarkvisionRange("drow")
      {
        id: "drow_dancing_lights",
        name: "Luces Danzantes (Drow)",
        description: "Conoces el truco luces danzantes. La aptitud mágica para lanzarlo es Inteligencia, Sabiduría o Carisma (eliges cuando seleccionas el linaje).",
        affects: ["other"],
        requiredLevel: 1,
        lineage: "drow",
      },
      {
        id: "drow_faerie_fire",
        name: "Fuego Feérico (Drow)",
        description: "A partir del nivel 3, puedes lanzar el hechizo fuego feérico una vez sin gastar un espacio de conjuro. Siempre lo tienes preparado y también puedes lanzarlo usando espacios de conjuro de nivel apropiado. Recuperas todos los usos gastados cuando termines un descanso largo.",
        affects: ["other"],
        requiredLevel: 3,
        lineage: "drow",
      },
      {
        id: "drow_darkness",
        name: "Oscuridad (Drow)",
        description: "A partir del nivel 5, puedes lanzar el hechizo oscuridad una vez sin gastar un espacio de conjuro. Siempre lo tienes preparado y también puedes lanzarlo usando espacios de conjuro de nivel apropiado. Recuperas todos los usos gastados cuando termines un descanso largo.",
        affects: ["other"],
        requiredLevel: 5,
        lineage: "drow",
      },
      // Traits de Linajes Élficos - Elfo de los Bosques
      {
        id: "wood_elf_speed_10_5m",
        name: "Velocidad Aumentada (Elfo de los Bosques)",
        description: "Tu velocidad aumenta a 10.5m.",
        affects: ["speed"],
        requiredLevel: 1,
        lineage: "wood_elf",
      },
      {
        id: "wood_elf_druidcraft",
        name: "Saber Druídico (Elfo de los Bosques)",
        description: "Conoces el truco saber druídico. La aptitud mágica para lanzarlo es Inteligencia, Sabiduría o Carisma (eliges cuando seleccionas el linaje).",
        affects: ["other"],
        requiredLevel: 1,
        lineage: "wood_elf",
      },
      {
        id: "wood_elf_longstrider",
        name: "Zancada Prodigiosa (Elfo de los Bosques)",
        description: "A partir del nivel 3, puedes lanzar el hechizo zancada prodigiosa una vez sin gastar un espacio de conjuro. Siempre lo tienes preparado y también puedes lanzarlo usando espacios de conjuro de nivel apropiado. Recuperas todos los usos gastados cuando termines un descanso largo.",
        affects: ["other"],
        requiredLevel: 3,
        lineage: "wood_elf",
      },
      {
        id: "wood_elf_pass_without_trace",
        name: "Pasar sin Rastro (Elfo de los Bosques)",
        description: "A partir del nivel 5, puedes lanzar el hechizo pasar sin rastro una vez sin gastar un espacio de conjuro. Siempre lo tienes preparado y también puedes lanzarlo usando espacios de conjuro de nivel apropiado. Recuperas todos los usos gastados cuando termines un descanso largo.",
        affects: ["other"],
        requiredLevel: 5,
        lineage: "wood_elf",
      },
      // Traits de Linajes Gnomos - Gnomo de las Rocas
      {
        id: "rock_gnome_prestidigitation",
        name: "Prestidigitación y Reparar (Gnomo de las Rocas)",
        description: "Conoces los trucos prestidigitación y reparar. La aptitud mágica para lanzarlos es Inteligencia, Sabiduría o Carisma (eliges cuando seleccionas el linaje).",
        affects: ["other"],
        requiredLevel: 1,
        lineage: "rock_gnome",
      },
      {
        id: "rock_gnome_mechanical_devices",
        name: "Dispositivos Mecánicos (Gnomo de las Rocas)",
        description: "Puedes pasar 10 minutos lanzando prestidigitación para crear un dispositivo mecánico diminuto (CA 5, 1 pg), como un juguete, un encendedor o una caja de música. Al crearlo, eliges un efecto de prestidigitación que determina su función. El dispositivo produce este efecto cada vez que otra criatura o tú usáis una acción adicional para activarlo con un toque. Si el efecto elegido tiene múltiples opciones, se selecciona una para el dispositivo al crearlo. Puedes tener tres de estos dispositivos activos simultáneamente. Se desmontan 8 horas después de su creación o cuando los desmontas con un toque como acción.",
        affects: ["other"],
        requiredLevel: 1,
        lineage: "rock_gnome",
      },
      // Traits de Linajes Gnomos - Gnomo de los Bosques
      {
        id: "forest_gnome_minor_illusion",
        name: "Ilusión Menor (Gnomo de los Bosques)",
        description: "Conoces el truco ilusión menor. La aptitud mágica para lanzarlo es Inteligencia, Sabiduría o Carisma (eliges cuando seleccionas el linaje).",
        affects: ["other"],
        requiredLevel: 1,
        lineage: "forest_gnome",
      },
      {
        id: "forest_gnome_speak_with_animals",
        name: "Hablar con Animales (Gnomo de los Bosques)",
        description: "Siempre tienes preparado el hechizo hablar con animales. Puedes lanzarlo sin gastar un espacio de conjuro un número de veces igual a tu bonificador por competencia, y recuperas todos los usos gastados cuando termines un descanso largo. También puedes lanzarlo usando cualquier espacio de conjuro de nivel apropiado.",
        affects: ["other"],
        requiredLevel: 1,
        lineage: "forest_gnome",
      },
      // Traits de Humanos
      {
        id: "human_skilled",
        name: "Diestro",
        description: "Ganas competencia en una habilidad de tu elección.",
        affects: ["skills"],
      },
      {
        id: "human_ingenious",
        name: "Ingenioso",
        description: "Obtienes inspiración heroica tras finalizar un descanso largo.",
        affects: ["other"],
      },
      {
        id: "human_versatile",
        name: "Versátil",
        description: "Obtienes una dote de origen de tu elección (consulta el capítulo 5). Se recomienda Habilidoso. Las dotes de origen se seleccionan al crear el personaje.",
        affects: ["other"],
      },
      // Traits del Linaje Gigante (Goliat)
      {
        id: "giant_lineage_fire",
        name: "Abrasión del fuego (gigante de fuego)",
        description: "Cuando aciertes a un objetivo con una tirada de ataque y le causes daño, también puedes causarle 1d10 de daño de fuego.",
        affects: ["other"],
      },
      {
        id: "giant_lineage_hill",
        name: "Caída de las colinas (gigante de las colinas)",
        description: "Cuando aciertes a una criatura Grande o más pequeña con una tirada de ataque y le causes daño, también puedes infligirle el estado de derribada.",
        affects: ["other"],
      },
      {
        id: "giant_lineage_cloud",
        name: "Excursión de las nubes (gigante de las nubes)",
        description: "Como acción adicional, te teletransportas mágicamente hasta 9 m a un espacio sin ocupar que puedas ver.",
        affects: ["speed"],
      },
      {
        id: "giant_lineage_frost",
        name: "Frío de la escarcha (gigante de escarcha)",
        description: "Cuando aciertes a un objetivo con una tirada de ataque y le causes daño, también puedes causarle 1d6 de daño de frío y reducir su velocidad en 3 m hasta el principio de tu siguiente turno.",
        affects: ["other"],
      },
      {
        id: "giant_lineage_stone",
        name: "Resistencia de la piedra (gigante de piedra)",
        description: "Cuando recibas daño, puedes usar una reacción para tirar 1d12. Suma tu modificador por Constitución al resultado y reduce el daño en ese total.",
        affects: ["other"],
      },
      {
        id: "giant_lineage_storm",
        name: "Trueno de la tormenta (gigante de las tormentas)",
        description: "Cuando una criatura que esté a 18 m o menos de ti te cause daño, puedes usar una reacción para infligirle 1d8 de daño de trueno.",
        affects: ["other"],
      },
      // Traits del Legado Abisal (Tiefling)
      {
        id: "abyssal_poison_resistance",
        name: "Resistencia al Veneno (Legado Abisal)",
        description: "Tienes resistencia al daño de veneno.",
        affects: ["other"],
        requiredLevel: 1,
        lineage: "abyssal",
      },
      {
        id: "abyssal_poison_spray",
        name: "Rociada Venenosa (Legado Abisal)",
        description: "Conoces el truco rociada venenosa. La aptitud mágica para lanzarlo es Inteligencia, Sabiduría o Carisma (eliges cuando seleccionas el legado).",
        affects: ["other"],
        requiredLevel: 1,
        lineage: "abyssal",
      },
      {
        id: "abyssal_ray_of_sickness",
        name: "Rayo Nauseabundo (Legado Abisal)",
        description: "A partir del nivel 3, puedes lanzar el hechizo rayo nauseabundo una vez sin gastar un espacio de conjuro. Siempre lo tienes preparado y también puedes lanzarlo usando espacios de conjuro de nivel apropiado. Recuperas todos los usos gastados cuando termines un descanso largo.",
        affects: ["other"],
        requiredLevel: 3,
        lineage: "abyssal",
      },
      {
        id: "abyssal_hold_person",
        name: "Inmovilizar Persona (Legado Abisal)",
        description: "A partir del nivel 5, puedes lanzar el hechizo inmovilizar persona una vez sin gastar un espacio de conjuro. Siempre lo tienes preparado y también puedes lanzarlo usando espacios de conjuro de nivel apropiado. Recuperas todos los usos gastados cuando termines un descanso largo.",
        affects: ["other"],
        requiredLevel: 5,
        lineage: "abyssal",
      },
      // Traits del Legado Ctónico (Tiefling)
      {
        id: "chthonic_necrotic_resistance",
        name: "Resistencia al Necrótico (Legado Ctónico)",
        description: "Tienes resistencia al daño necrótico.",
        affects: ["other"],
        requiredLevel: 1,
        lineage: "chthonic",
      },
      {
        id: "chthonic_chill_touch",
        name: "Toque Helado (Legado Ctónico)",
        description: "Conoces el truco toque helado. La aptitud mágica para lanzarlo es Inteligencia, Sabiduría o Carisma (eliges cuando seleccionas el legado).",
        affects: ["other"],
        requiredLevel: 1,
        lineage: "chthonic",
      },
      {
        id: "chthonic_false_life",
        name: "Falsa Vida (Legado Ctónico)",
        description: "A partir del nivel 3, puedes lanzar el hechizo falsa vida una vez sin gastar un espacio de conjuro. Siempre lo tienes preparado y también puedes lanzarlo usando espacios de conjuro de nivel apropiado. Recuperas todos los usos gastados cuando termines un descanso largo.",
        affects: ["other"],
        requiredLevel: 3,
        lineage: "chthonic",
      },
      {
        id: "chthonic_ray_of_enfeeblement",
        name: "Rayo Debilitador (Legado Ctónico)",
        description: "A partir del nivel 5, puedes lanzar el hechizo rayo debilitador una vez sin gastar un espacio de conjuro. Siempre lo tienes preparado y también puedes lanzarlo usando espacios de conjuro de nivel apropiado. Recuperas todos los usos gastados cuando termines un descanso largo.",
        affects: ["other"],
        requiredLevel: 5,
        lineage: "chthonic",
      },
      // Traits del Legado Infernal (Tiefling)
      {
        id: "infernal_fire_resistance",
        name: "Resistencia al Fuego (Legado Infernal)",
        description: "Tienes resistencia al daño de fuego.",
        affects: ["other"],
        requiredLevel: 1,
        lineage: "infernal",
      },
      {
        id: "infernal_fire_bolt",
        name: "Descarga de Fuego (Legado Infernal)",
        description: "Conoces el truco descarga de fuego. La aptitud mágica para lanzarlo es Inteligencia, Sabiduría o Carisma (eliges cuando seleccionas el legado).",
        affects: ["other"],
        requiredLevel: 1,
        lineage: "infernal",
      },
      {
        id: "infernal_hellish_rebuke",
        name: "Reprensión Infernal (Legado Infernal)",
        description: "A partir del nivel 3, puedes lanzar el hechizo reprensión infernal una vez sin gastar un espacio de conjuro. Siempre lo tienes preparado y también puedes lanzarlo usando espacios de conjuro de nivel apropiado. Recuperas todos los usos gastados cuando termines un descanso largo.",
        affects: ["other"],
        requiredLevel: 3,
        lineage: "infernal",
      },
      {
        id: "infernal_darkness",
        name: "Oscuridad (Legado Infernal)",
        description: "A partir del nivel 5, puedes lanzar el hechizo oscuridad una vez sin gastar un espacio de conjuro. Siempre lo tienes preparado y también puedes lanzarlo usando espacios de conjuro de nivel apropiado. Recuperas todos los usos gastados cuando termines un descanso largo.",
        affects: ["other"],
        requiredLevel: 5,
        lineage: "infernal",
      },
    ]
  }

  /**
   * Obtiene todos los Character Origins del PHB 2024
   */
  static getOrigins(): CharacterOrigin[] {
    return [
      {
        id: "aasimar",
        name: "Aasimar",
        description: "Los aasimars son mortales cuyas almas albergan una chispa de los Planos Superiores. Tanto si descienden de un ser angelical como si están imbuidos de poder celestial, pueden encender esa chispa para traer la luz, la curación y la furia divina. Los aasimars pueden surgir entre cualquier población de mortales. Se parecen a sus padres, pero viven hasta 160 años y tienen rasgos que insinúan su herencia celestial, como pecas metálicas, ojos brillantes, un halo o el color de piel de un ángel (plateada, verde opalescente o roja cobriza).",
        defaultSize: "medium",
        sizeOptions: ["small", "medium"], // Puede elegir entre Small o Medium
        traits: ["healing_hands", "light_bearer", "celestial_resistance", "darkvision", "celestial_revelation"],
      },
      {
        id: "dragonborn",
        name: "Dracónido",
        description: "Los ancestros de los dracónidos nacieron de huevos de dragones cromáticos y metálicos. Según una historia, los dioses dragones Bahamut y Tiamat bendijeron esos huevos para poblar el multiverso con criaturas a su imagen. Según otra, los dragones crearon a los primeros dracónidos sin bendición divina. Los dracónidos son dragones bípedos sin alas, cubiertos de escamas, con ojos brillantes, estructura ósea densa y cuernos en la cabeza. Sus diversos colores y características se asemejan a sus ancestros dracónicos.",
        defaultSize: "medium",
        traits: ["draconic_ancestry", "breath_weapon", "damage_resistance", "darkvision", "draconic_flight"],
      },
      {
        id: "elf",
        name: "Elfo",
        description: "Los primeros elfos, creados por el dios Corellon, podían cambiar de forma a voluntad. Perdieron esta habilidad tras ser maldecidos por conspirar con la diosa Lolth. Los elfos tienen orejas puntiagudas y carecen de vello facial y corporal. Viven unos 750 años y no duermen; en su lugar, entran en trance cuando necesitan descansar.",
        defaultSize: "medium",
        traits: ["fey_ancestry", "keen_senses", "trance", "darkvision"], // Traits base comunes a todos los elfos
        lineageTypeName: "Linaje Élfico",
        lineages: [
          {
            id: "high_elf",
            name: "Alto Elfo",
            description: "Los altos elfos están imbuidos de magia de los cruces entre el Plano Feérico y el Plano Material. En algunos mundos se les llama elfos del sol o elfos de la luna (Reinos Olvidados), Silvanesti y Qualinesti (Dragonlance), o Aereni (Eberron).",
            traits: ["high_elf_prestidigitation", "high_elf_detect_magic", "high_elf_misty_step"],
          },
          {
            id: "drow",
            name: "Drow",
            description: "Los drows suelen vivir en el Inframundo, que los ha influenciado. Incluso hay sociedades drows que evitan completamente el Inframundo pero siguen imbuidas de su magia. En Eberron, los drows habitan las junglas y ruinas ciclópeas del continente de Xen'drik.",
            traits: ["darkvision", "drow_dancing_lights", "drow_faerie_fire", "drow_darkness"],
          },
          {
            id: "wood_elf",
            name: "Elfo de los Bosques",
            description: "Los elfos de los bosques llevan la magia de los bosques primigenios dentro de ellos. Se les conoce por muchos otros nombres, como elfos salvajes, elfos verdes y elfos silvanos. En Greyhawk, los grugach son elfos de los bosques solitarios. En Dragonlance y Eberron, los kalanesti y tairnadal, respectivamente, son elfos de los bosques.",
            traits: ["wood_elf_speed_10_5m", "wood_elf_druidcraft", "wood_elf_longstrider", "wood_elf_pass_without_trace"],
          },
        ],
      },
      {
        id: "dwarf",
        name: "Enano",
        description: "Los enanos surgieron de la tierra por un dios forjador (como Moradin o Reorx), que les otorgó afinidad por la piedra, el metal y la vida subterránea. Fueron hechos firmes como las montañas y viven unos 350 años. Los enanos originales eran robustos y barbudos, tallaban ciudades en las laderas de las montañas y bajo tierra. Sus leyendas relatan conflictos con monstruos de las cumbres y el Inframundo (gigantes, horrores subterráneos). Los enanos suelen cantar sobre cómo los pequeños derrotaron a los poderosos.",
        defaultSize: "medium",
        traits: ["stone_affinity", "dwarven_endurance", "dwarven_resistance", "darkvision"],
      },
      {
        id: "gnome",
        name: "Gnomo",
        description: "Los gnomos son un pueblo mágico creado por dioses de la inventiva, las ilusiones y la vida subterránea. Son reservados y prefieren vivir en bosques y madrigueras. A pesar de su pequeño tamaño, compensan con astucia, usando trampas y túneles laberínticos para confundir a los depredadores. Aprendieron magia de dioses como Garl Oro Reluciente, Baervan Viajero Indómito y Baravar Capa de Sombras, que los visitaron disfrazados. Esta magia llevó a la creación de los linajes de gnomo de las rocas y gnomo de los bosques. Los gnomos son seres pequeños con ojos grandes y orejas puntiagudas, viven aproximadamente 425 años y disfrutan la sensación de tener un techo sobre sus cabezas, incluso si es solo un sombrero simple.",
        defaultSize: "small",
        traits: ["gnome_cunning", "darkvision"], // Traits base
        lineageTypeName: "Linaje de Gnomo",
        lineages: [
          {
            id: "rock_gnome",
            name: "Gnomo de las Rocas",
            description: "Los gnomos de las rocas son conocidos por su habilidad con dispositivos mecánicos y su conocimiento de la magia.",
            traits: ["rock_gnome_prestidigitation", "rock_gnome_mechanical_devices"],
          },
          {
            id: "forest_gnome",
            name: "Gnomo de los Bosques",
            description: "Los gnomos de los bosques tienen una conexión especial con la naturaleza y los animales.",
            traits: ["forest_gnome_minor_illusion", "forest_gnome_speak_with_animals"],
          },
        ],
      },
      {
        id: "goliath",
        name: "Goliat",
        description: "Los goliat son descendientes lejanos de gigantes, superan a la mayoría de especies en altura. Se benefician de los favores de los primeros gigantes, lo que se manifiesta como varios beneficios sobrenaturales, como la capacidad de crecer súbitamente y alcanzar temporalmente la altura de sus parientes gigantescos. Los goliat poseen rasgos físicos que evocan a sus ancestros. Por ejemplo, algunos goliat se parecen a gigantes de piedra, mientras que otros se parecen a gigantes de fuego. Independientemente de su linaje, los goliat han forjado su propio camino en el multiverso, libres de los conflictos internos que han plagado a los gigantes durante siglos, y aspiran a superar a sus ancestros.",
        defaultSize: "medium",
        traits: ["powerful_build", "giant_lineage", "large_form"],
      },
      {
        id: "human",
        name: "Humano",
        description: "Los humanos están extendidos por todo el multiverso, variados y numerosos, esforzándose por lograr todo lo posible en sus vidas. Su ambición e ingenio son alabados, respetados y temidos en muchos mundos. Los humanos exhiben apariencias diversas, similares a la población de la Tierra, y adoran a muchos dioses. Los eruditos debaten el origen de la humanidad, pero se menciona que una de las primeras concentraciones humanas conocidas ocurrió en Sigil, una ciudad toroidal ubicada en el centro del multiverso y cuna de la lengua común. Desde allí, se cree que los humanos se dispersaron por el multiverso, llevando consigo el cosmopolitismo de la Ciudad de las Puertas.",
        defaultSize: "medium",
        sizeOptions: ["small", "medium"], // Puede elegir entre Pequeño o Mediano
        traits: ["human_skilled", "human_ingenious", "human_versatile"],
      },
      {
        id: "halfling",
        name: "Mediano",
        description: "Los medianos son valorados y guiados por dioses que aprecian la vida, el hogar y la tranquilidad. Se sienten atraídos por lugares bucólicos donde la familia y la comunidad prosperan. A pesar de esto, muchos medianos poseen un espíritu valiente y aventurero que los lleva a explorar el mundo y forjar nuevas amistades. Su tamaño, similar al de un niño humano, les ayuda a pasar desapercibidos entre las personas y a colarse por espacios estrechos. Cualquiera que haya pasado tiempo con medianos, especialmente aventureros, probablemente haya presenciado su famosa 'suerte de mediano' en acción. Cuando un mediano está en peligro mortal, una fuerza invisible parece intervenir a su favor. Muchos medianos creen en la buena fortuna y atribuyen este don inusual a uno o más de sus dioses benévolos, como Yondalla, Brandobaris y Charmalaine. Este mismo don puede ser la causa de su prolongada esperanza de vida (alrededor de 150 años). Hay muchos tipos de comunidades medianas. Por cada condado aislado en una parte inmaculada del mundo, existe una organización criminal como el clan Boromar del escenario de Eberron o una banda territorial de medianos como los del escenario de Dark Sun. Los medianos que prefieren vivir bajo tierra se llaman 'mediano fortecor' o 'fornidos'. Los medianos nómadas, así como los que viven entre humanos y otras personas altas, a veces se llaman 'mediano piesligeros' o 'grandullones'.",
        defaultSize: "small",
        traits: ["halfling_nimbleness", "lucky", "naturally_stealthy", "brave"],
      },
      {
        id: "orc",
        name: "Orco",
        description: "Los orcos fueron creados por Gruumsh, un dios poderoso que les otorgó dones como resistencia, determinación y visión en la oscuridad para sobrevivir en diversos terrenos y enfrentar monstruos. Físicamente, los orcos son altos y robustos, con piel gris, orejas muy puntiagudas y colmillos inferiores prominentes. Algunos orcos se inspiran en las hazañas heroicas de sus ancestros y buscan el favor de Gruumsh, mientras que otros prefieren forjar su propio camino.",
        defaultSize: "medium",
        traits: ["relentless_endurance", "adrenaline_rush", "darkvision"],
      },
      {
        id: "tiefling",
        name: "Tiefling",
        description: "Los tieflings pueden nacer en los Planos Inferiores o tener ancestros infernales de allí. Un tiefling (pronunciado TII-flin) tiene un vínculo de sangre con un diablo, demonio u otro ser infernal. Esta conexión con los Planos Inferiores es el 'legado infernal' del tiefling, que otorga una promesa de poder pero no influye en su moralidad. Los tieflings eligen si aceptan o lamentan su legado infernal.",
        defaultSize: "medium",
        sizeOptions: ["small", "medium"], // Puede elegir entre Pequeño o Mediano
        traits: ["infernal_legacy", "supernatural_presence", "darkvision"],
        lineageTypeName: "Legado Infernal",
        lineages: [
          {
            id: "abyssal",
            name: "Abisal",
            description: "Los tieflings del legado Abisal se sienten atraídos por la entropía del Abismo, el caos de Pandemonio y la desesperación de Carceri. Los rasgos físicos comunes incluyen cuernos, pelaje, colmillos y un olor peculiar. La sangre de demonio corre por sus venas.",
            traits: ["abyssal_poison_resistance", "abyssal_poison_spray", "abyssal_ray_of_sickness", "abyssal_hold_person"],
          },
          {
            id: "chthonic",
            name: "Ctónico",
            description: "Los tieflings del legado Ctónico sienten la llamada de Carceri, la codicia de Gehenna y la melancolía de Hades. Algunos tienen una apariencia cadavérica. Otros poseen la belleza sobrenatural de un súcubo o comparten rasgos físicos con una bruja nocturna, un yugoloth u otro ancestro infernal de alineamiento neutral maligno.",
            traits: ["chthonic_necrotic_resistance", "chthonic_chill_touch", "chthonic_false_life", "chthonic_ray_of_enfeeblement"],
          },
          {
            id: "infernal",
            name: "Infernal",
            description: "El legado Infernal vincula a los tieflings no solo con Gehenna, sino también con los Nueve Infiernos y los campos de batalla violentos de Acheron. Los rasgos físicos comunes incluyen cuernos, púas, cola, ojos dorados y un ligero olor a azufre o humo. La mayoría de estos tieflings tuvieron diablos como ancestros.",
            traits: ["infernal_fire_resistance", "infernal_fire_bolt", "infernal_hellish_rebuke", "infernal_darkness"],
          },
        ],
      },
    ]
  }

  /**
   * Obtiene todos los Backgrounds del PHB 2024
   */
  static getBackgrounds(): BackgroundDefinition[] {
    return [
      {
        id: "acolyte",
        name: "Acólito",
        description: "Has pasado tu vida al servicio de un templo.",
        abilityScoreOptions: ["intelligence", "wisdom", "charisma"],
        suggestedBonuses: {
          wisdom: 1,
          charisma: 1,
        },
      },
      {
        id: "artisan",
        name: "Artesano",
        description: "Eres un maestro artesano, creando objetos de calidad.",
        abilityScoreOptions: ["strength", "dexterity", "intelligence"],
        suggestedBonuses: {
          intelligence: 1,
          wisdom: 1,
        },
      },
      {
        id: "charlatan",
        name: "Charlatán",
        description: "Has sobrevivido usando tu ingenio y tu capacidad para engañar a otros.",
        abilityScoreOptions: ["dexterity", "intelligence", "charisma"],
        suggestedBonuses: {
          dexterity: 1,
          charisma: 1,
        },
      },
      {
        id: "criminal",
        name: "Criminal",
        description: "Has vivido una vida de delitos y actividades ilegales.",
        abilityScoreOptions: ["dexterity", "intelligence", "wisdom"],
        suggestedBonuses: {
          dexterity: 1,
          intelligence: 1,
        },
      },
      {
        id: "cultist",
        name: "Cultista",
        description: "Has servido a una organización secreta o culto.",
        abilityScoreOptions: ["intelligence", "wisdom", "charisma"],
        suggestedBonuses: {
          intelligence: 1,
          charisma: 1,
        },
      },
      {
        id: "entertainer",
        name: "Artista",
        description: "Has vivido de tu talento para entretener a otros.",
        abilityScoreOptions: ["dexterity", "constitution", "charisma"],
        suggestedBonuses: {
          dexterity: 1,
          charisma: 1,
        },
      },
      {
        id: "farmer",
        name: "Granjero",
        description: "Has trabajado la tierra y criado animales toda tu vida.",
        abilityScoreOptions: ["strength", "constitution", "wisdom"],
        suggestedBonuses: {
          strength: 1,
          constitution: 1,
        },
      },
      {
        id: "gladiator",
        name: "Gladiador",
        description: "Has luchado en arenas para entretener a las multitudes.",
        abilityScoreOptions: ["strength", "constitution", "charisma"],
        suggestedBonuses: {
          strength: 1,
          charisma: 1,
        },
      },
      {
        id: "guard",
        name: "Guardia",
        description: "Has servido como guardia o soldado, protegiendo a otros.",
        abilityScoreOptions: ["strength", "constitution", "wisdom"],
        suggestedBonuses: {
          strength: 1,
          wisdom: 1,
        },
      },
      {
        id: "hermit",
        name: "Ermitaño",
        description: "Has vivido en soledad, buscando conocimiento o iluminación.",
        abilityScoreOptions: ["intelligence", "wisdom", "charisma"],
        suggestedBonuses: {
          intelligence: 1,
          wisdom: 1,
        },
      },
      {
        id: "laborer",
        name: "Trabajador",
        description: "Has trabajado en trabajos manuales y físicos.",
        abilityScoreOptions: ["strength", "constitution", "dexterity"],
        suggestedBonuses: {
          strength: 1,
          constitution: 1,
        },
      },
      {
        id: "noble",
        name: "Noble",
        description: "Has nacido en una familia noble o rica.",
        abilityScoreOptions: ["intelligence", "wisdom", "charisma"],
        suggestedBonuses: {
          intelligence: 1,
          charisma: 1,
        },
      },
      {
        id: "pilgrim",
        name: "Peregrino",
        description: "Has viajado extensamente, visitando lugares sagrados.",
        abilityScoreOptions: ["constitution", "wisdom", "charisma"],
        suggestedBonuses: {
          wisdom: 1,
          charisma: 1,
        },
      },
      {
        id: "sage",
        name: "Sabio",
        description: "Has dedicado tu vida a la búsqueda del conocimiento.",
        abilityScoreOptions: ["intelligence", "wisdom", "charisma"],
        suggestedBonuses: {
          intelligence: 1,
          wisdom: 1,
        },
      },
      {
        id: "sailor",
        name: "Marinero",
        description: "Has pasado tu vida en el mar, navegando y explorando.",
        abilityScoreOptions: ["strength", "dexterity", "constitution"],
        suggestedBonuses: {
          strength: 1,
          dexterity: 1,
        },
      },
      {
        id: "scholar",
        name: "Erudito",
        description: "Has estudiado extensamente en una academia o universidad.",
        abilityScoreOptions: ["intelligence", "wisdom", "charisma"],
        suggestedBonuses: {
          intelligence: 1,
          wisdom: 1,
        },
      },
      {
        id: "soldier",
        name: "Soldado",
        description: "Has servido en un ejército o milicia.",
        abilityScoreOptions: ["strength", "constitution", "wisdom"],
        suggestedBonuses: {
          strength: 1,
          constitution: 1,
        },
      },
      {
        id: "urchin",
        name: "Huérfano",
        description: "Has crecido en las calles, sobreviviendo por tu cuenta.",
        abilityScoreOptions: ["dexterity", "intelligence", "wisdom"],
        suggestedBonuses: {
          dexterity: 1,
          wisdom: 1,
        },
      },
    ]
  }

  /**
   * Obtiene un Character Origin por ID
   */
  static getOriginById(id: string): CharacterOrigin | null {
    return this.getOrigins().find((origin) => origin.id === id) || null
  }

  /**
   * Obtiene un Background por ID
   */
  static getBackgroundById(id: string): BackgroundDefinition | null {
    return this.getBackgrounds().find((bg) => bg.id === id) || null
  }

  /**
   * Obtiene un Trait por ID
   */
  static getTraitById(id: string): RacialTrait | null {
    return this.getTraits().find((trait) => trait.id === id) || null
  }

  /**
   * Obtiene todas las dotes de origen del PHB 2024
   * @deprecated Este método delega a FeatService. Usa FeatService.getOriginFeats() directamente.
   * Se mantiene por compatibilidad hacia atrás.
   * Las dotes de origen se otorgan al nivel 1 y están disponibles para ciertas especies (ej: Humanos)
   */
  static getOriginFeats(): OriginFeat[] {
    // Delegar al nuevo FeatService y convertir al formato legacy
    const feats = FeatService.getOriginFeats()
    return feats.map((feat) => ({
      id: feat.id,
      name: feat.name,
      description: feat.description,
      prerequisites: feat.prerequisites?.otherFeats, // Convertir a formato legacy
    }))
  }

  /**
   * Obtiene una dote de origen por ID
   * @deprecated Este método delega a FeatService. Usa FeatService.getOriginFeatById() directamente.
   * Se mantiene por compatibilidad hacia atrás.
   */
  static getOriginFeatById(id: string): OriginFeat | null {
    const feat = FeatService.getOriginFeatById(id)
    if (!feat) return null
    
    // Convertir al formato legacy
    return {
      id: feat.id,
      name: feat.name,
      description: feat.description,
      prerequisites: feat.prerequisites?.otherFeats,
    }
  }

  /**
   * Obtiene el ID del trait de linaje gigante basado en la selección
   */
  static getGiantLineageTraitId(lineage: string): string | null {
    const validLineages = ["fire", "hill", "cloud", "frost", "stone", "storm"]
    if (!validLineages.includes(lineage)) {
      return null
    }
    return `giant_lineage_${lineage}`
  }

  /**
   * Obtiene todos los IDs de traits de linaje gigante (para limpieza)
   */
  static getAllGiantLineageTraitIds(): string[] {
    return [
      "giant_lineage_fire",
      "giant_lineage_hill",
      "giant_lineage_cloud",
      "giant_lineage_frost",
      "giant_lineage_stone",
      "giant_lineage_storm",
    ]
  }

  /**
   * Obtiene el rango de darkvision en metros para una especie específica
   * @param originId ID de la especie (ej: "elf", "dwarf", "drow")
   * @returns Rango en metros o null si la especie no tiene darkvision o no está en el mapa
   */
  static getDarkvisionRange(originId: string): number | null {
    const darkvisionRanges: Record<string, number> = {
      "elf": 18,           // 18m para elfos
      "dwarf": 36,         // 36m para enanos
      "dragonborn": 18,    // 18m para dracónidos
      "aasimar": 18,       // 18m para aasimars
      "gnome": 18,         // 18m para gnomos (ajustar según PHB 2024)
      "orc": 36,           // 36m para orcos (PHB 2024)
      "tiefling": 18,      // 18m para tieflings (ajustar según PHB 2024)
      // Para linajes élficos, usar el ID del linaje
      "drow": 36,          // 36m para drow (linaje élfico)
    }
    
    return darkvisionRanges[originId] || null
  }

  /**
   * Calcula el tamaño efectivo considerando traits (ej: Powerful Build)
   */
  static calculateEffectiveSize(
    baseSize: "small" | "medium" | "large",
    traits: string[]
  ): "small" | "medium" | "large" | "huge" {
    let effectiveSize: "small" | "medium" | "large" | "huge" = baseSize

    // Traits que aumentan el tamaño efectivo para capacidad de carga
    const sizeIncreasingTraits = ["powerful_build", "goliath_power"]
    
    if (traits.some((trait) => sizeIncreasingTraits.includes(trait))) {
      // Aumentar una categoría de tamaño
      if (effectiveSize === "small") {
        effectiveSize = "medium"
      } else if (effectiveSize === "medium") {
        effectiveSize = "large"
      } else if (effectiveSize === "large") {
        effectiveSize = "huge"
      }
    }

    return effectiveSize
  }

  /**
   * Aplica bonificaciones de atributos a los valores base
   */
  static applyAbilityBonuses(
    baseScores: AbilityScores,
    bonuses: Partial<AbilityScores>
  ): AbilityScores {
    return {
      strength: (baseScores.strength || 0) + (bonuses.strength || 0),
      dexterity: (baseScores.dexterity || 0) + (bonuses.dexterity || 0),
      constitution: (baseScores.constitution || 0) + (bonuses.constitution || 0),
      intelligence: (baseScores.intelligence || 0) + (bonuses.intelligence || 0),
      wisdom: (baseScores.wisdom || 0) + (bonuses.wisdom || 0),
      charisma: (baseScores.charisma || 0) + (bonuses.charisma || 0),
    }
  }

  /**
   * Obtiene bonificadores de compra/tienda para un origin y sus traits
   */
  static getShopBonuses(originId: string, traits: string[]): ShopBonuses | null {
    const origin = this.getOriginById(originId)
    if (!origin) return null

    // Combinar bonificadores del origin y de los traits
    const bonuses: ShopBonuses = {
      ...origin.shopBonuses,
    }

    for (const traitId of traits) {
      const trait = this.getTraitById(traitId)
      if (trait?.shopEffects) {
        bonuses.discount_percent = (bonuses.discount_percent || 0) + (trait.shopEffects.discount_percent || 0)
        bonuses.negotiation_bonus = (bonuses.negotiation_bonus || 0) + (trait.shopEffects.negotiation_bonus || 0)
      }
    }

    // Retornar null si no hay bonificadores
    if (!bonuses.discount_percent && !bonuses.negotiation_bonus) {
      return null
    }

    return bonuses
  }

  // ============================================================================
  // MÉTODOS PARA PHB 2014
  // ============================================================================

  /**
   * Obtiene todas las razas del PHB 2014
   */
  static getRaces2014(): Race2014[] {
    return [
      // Enano
      {
        id: "dwarf",
        name: "Enano",
        description: "Enanos robustos y resistentes, conocidos por su resistencia y conocimiento de la piedra.",
        baseAbilityBonuses: { constitution: 2 },
        hasSubraces: true,
        defaultSize: "medium",
        traits: ["darkvision", "stonecunning", "dwarven_resilience"],
        subraces: [
          {
            id: "hill_dwarf",
            name: "Enano de las Colinas",
            description: "Enanos de las colinas y montañas bajas, conocidos por su sabiduría.",
            abilityBonuses: { wisdom: 1 },
            traits: [],
          },
          {
            id: "mountain_dwarf",
            name: "Enano de las Montañas",
            description: "Enanos de las montañas más altas, conocidos por su fuerza.",
            abilityBonuses: { strength: 2 },
            traits: [],
          },
        ],
      },
      // Elfo
      {
        id: "elf",
        name: "Elfo",
        description: "Elfos gráciles y longevos, con una conexión profunda con la magia y la naturaleza.",
        baseAbilityBonuses: { dexterity: 2 },
        hasSubraces: true,
        defaultSize: "medium",
        traits: ["darkvision", "keen_senses", "fey_ancestry", "trance"],
        subraces: [
          {
            id: "high_elf",
            name: "Alto Elfo",
            description: "Elfos refinados y mágicos con una conexión profunda con la magia arcana.",
            abilityBonuses: { intelligence: 1 },
            traits: [],
          },
          {
            id: "wood_elf",
            name: "Elfo del Bosque",
            description: "Elfos que viven en los bosques, con una conexión especial con la naturaleza.",
            abilityBonuses: { wisdom: 1 },
            traits: [],
          },
          {
            id: "drow",
            name: "Elfo Oscuro (Drow)",
            description: "Elfos que viven en el Inframundo, adaptados a la oscuridad.",
            abilityBonuses: { charisma: 1 },
            traits: [],
          },
        ],
      },
      // Mediano
      {
        id: "halfling",
        name: "Mediano",
        description: "Medianos pequeños y ágiles, conocidos por su suerte y valentía.",
        baseAbilityBonuses: { dexterity: 2 },
        hasSubraces: true,
        defaultSize: "small",
        traits: ["lucky", "brave", "halfling_nimbleness"],
        subraces: [
          {
            id: "lightfoot_halfling",
            name: "Mediano Piesligeros",
            description: "Medianos ágiles y sigilosos, conocidos por su carisma.",
            abilityBonuses: { charisma: 1 },
            traits: [],
          },
          {
            id: "stout_halfling",
            name: "Mediano Fornido",
            description: "Medianos robustos y resistentes, conocidos por su constitución.",
            abilityBonuses: { constitution: 1 },
            traits: [],
          },
        ],
      },
      // Humano
      {
        id: "human",
        name: "Humano",
        description: "Humanos versátiles y adaptables, la raza más común en los mundos de D&D.",
        baseAbilityBonuses: {}, // Se maneja de forma especial
        hasSubraces: true,
        defaultSize: "medium",
        traits: [],
        subraces: [
          {
            id: "standard_human",
            name: "Humano Estándar",
            description: "Humanos que reciben +1 a todas las características.",
            abilityBonuses: {
              strength: 1,
              dexterity: 1,
              constitution: 1,
              intelligence: 1,
              wisdom: 1,
              charisma: 1,
            },
            traits: [],
          },
          {
            id: "variant_human",
            name: "Humano Variante",
            description: "Humanos que reciben +1 a dos características de elección y una dote.",
            abilityBonuses: {}, // Se selecciona manualmente
            traits: [],
          },
        ],
        requiresManualSelection: true,
        abilityScoreOptions: ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"],
      },
      // Dracónido
      {
        id: "dragonborn",
        name: "Dracónido",
        description: "Descendientes de dragones, con escamas y aliento destructivo.",
        baseAbilityBonuses: { strength: 2, charisma: 1 },
        hasSubraces: false,
        defaultSize: "medium",
        traits: ["breath_weapon", "damage_resistance"],
      },
      // Gnomo
      {
        id: "gnome",
        name: "Gnomo",
        description: "Gnomos pequeños e ingeniosos, conocidos por su inteligencia y astucia.",
        baseAbilityBonuses: { intelligence: 2 },
        hasSubraces: true,
        defaultSize: "small",
        traits: ["darkvision", "gnome_cunning"],
        subraces: [
          {
            id: "forest_gnome",
            name: "Gnomo del Bosque",
            description: "Gnomos que viven en los bosques, conocidos por su destreza.",
            abilityBonuses: { dexterity: 1 },
            traits: [],
          },
          {
            id: "rock_gnome",
            name: "Gnomo de las Rocas",
            description: "Gnomos que viven bajo tierra, conocidos por su constitución.",
            abilityBonuses: { constitution: 1 },
            traits: [],
          },
        ],
      },
      // Semielfo
      {
        id: "half_elf",
        name: "Semielfo",
        description: "Descendientes de humanos y elfos, combinando lo mejor de ambas razas.",
        baseAbilityBonuses: { charisma: 2 },
        hasSubraces: false,
        defaultSize: "medium",
        traits: ["darkvision", "fey_ancestry"],
        requiresManualSelection: true,
        abilityScoreOptions: ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"],
      },
      // Semiorco
      {
        id: "half_orc",
        name: "Semiorco",
        description: "Descendientes de humanos y orcos, conocidos por su fuerza y resistencia.",
        baseAbilityBonuses: { strength: 2, constitution: 1 },
        hasSubraces: false,
        defaultSize: "medium",
        traits: ["darkvision", "relentless_endurance", "savage_attacks"],
      },
      // Tiefling
      {
        id: "tiefling",
        name: "Tiefling",
        description: "Humanoides con ascendencia infernal, con cuernos y cola.",
        baseAbilityBonuses: { charisma: 2, intelligence: 1 },
        hasSubraces: false,
        defaultSize: "medium",
        traits: ["darkvision", "hellish_resistance", "infernal_legacy"],
      },
    ]
  }

  /**
   * Obtiene una raza del PHB 2014 por ID
   */
  static getRace2014ById(id: string): Race2014 | null {
    return this.getRaces2014().find((race) => race.id === id) || null
  }

  /**
   * Obtiene una subraza del PHB 2014 por ID
   */
  static getSubrace2014ById(raceId: string, subraceId: string): Subrace2014 | null {
    const race = this.getRace2014ById(raceId)
    if (!race || !race.subraces) return null
    return race.subraces.find((subrace) => subrace.id === subraceId) || null
  }

  /**
   * Obtiene los bonos de características totales (raza + subraza) para PHB 2014
   * Si la raza requiere selección manual, retorna los bonos base y deja que el componente maneje la selección
   */
  static getRacialAbilityBonuses2014(
    raceId: string,
    subraceId?: string,
    manualBonuses?: Partial<AbilityScores>
  ): Partial<AbilityScores> {
    const race = this.getRace2014ById(raceId)
    if (!race) return {}

    // Iniciar con bonos base de la raza
    const bonuses: Partial<AbilityScores> = { ...race.baseAbilityBonuses }

    // Si hay subraza, agregar sus bonos
    if (subraceId && race.subraces) {
      const subrace = race.subraces.find((s) => s.id === subraceId)
      if (subrace) {
        // Combinar bonos de subraza
        for (const [key, value] of Object.entries(subrace.abilityBonuses)) {
          const abilityKey = key as keyof AbilityScores
          bonuses[abilityKey] = (bonuses[abilityKey] || 0) + (value || 0)
        }
      }
    }

    // Si hay bonos manuales (para humano variante o semielfo), agregarlos
    if (manualBonuses) {
      for (const [key, value] of Object.entries(manualBonuses)) {
        const abilityKey = key as keyof AbilityScores
        bonuses[abilityKey] = (bonuses[abilityKey] || 0) + (value || 0)
      }
    }

    return bonuses
  }
}

