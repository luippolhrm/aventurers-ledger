# Preguntas abiertas — Modelo de datos nuevo

> **Propósito:** todo lo que necesito definido para escribir `modelo-de-datos.md` sin inventar nada.
> **Estado:** esperando respuestas. La fase 0 está detenida hasta que estén.

## Cómo usar este documento

Cada pregunta tiene un ID (`P1`, `P2`…). Puedes responder con `P7: opción B` o en texto libre.
Donde propongo opciones, la marcada con ⭐ es mi recomendación y el porqué está en su descripción.

**Importante:** las respuestas deberían terminar en Notion, no solo en un chat. Varias de estas
preguntas ya fueron contestadas en algún lado, pero la página *Decisiones confirmadas* no las tiene —
por eso volvieron a aparecer. Sugerencia: lo que se decida aquí entra como D24, D25… o como
corrección explícita de una decisión existente.

---

# Sección 0 · Contradicciones duras

Estas cuatro tienen dos respuestas distintas escritas en dos lugares distintos. No puedo elegir yo.

## P1 · El contenedor del botín, ¿obligatorio u opcional?

- **Tu prompt (punto 9):** el botín *"puede contener un contenedor"* → opcional.
- **Notion D16 + HU-9.1:** *"El botín siempre está dentro de un contenedor real"*, con un criterio
  Gherkin explícito: *"Escenario: Botín sin contenedor → la operación es rechazada"*.

| Opción | Consecuencia en el esquema |
|---|---|
| ⭐ **A. Obligatorio siempre** | FK `NOT NULL` al ítem contenedor + CHECK de que sea `is_container`. Es lo que está cerrado en Notion y ya tiene criterio de aceptación escrito. |
| **B. Opcional** | FK nullable. Requiere superseder D16 y reescribir HU-9.1. Hay que definir qué recibe un personaje cuando el botín no trae envase. |
| **C. Obligatorio solo si va a un personaje** | Al baúl se vuelca igual (D16), así que el envase solo importa cuando alguien debe cargarlo. FK nullable + validación en la RPC según destino. |

## P2 · Estados del botín, ¿dos o tres?

- **Tu prompt (punto 9):** borrador / listo / entregado.
- **Notion D15 + HU-9.1:** borrador → entregado. *"Listo"* no aparece en ninguna página.

| Opción | Consecuencia |
|---|---|
| ⭐ **A. Dos estados** | Enum de 2 valores. Editable hasta entregar, congelado después. Fiel a lo cerrado. |
| **B. Tres estados** | Hay que definir: ¿pasar a *listo* bloquea la edición? ¿se puede volver a *borrador*? ¿se puede entregar directo desde *borrador*? |

## P3 · ¿La cuenta del personaje pertenece a una campaña?

Contradicción **dentro de** Notion, no contigo:

- **HU-3.1:** *"Toda cuenta pertenece a una campaña"* + Gherkin *"y todas pertenecen a la misma campaña"*.
- **D4 + D6:** el personaje nace libre y *"la campaña es el contexto donde ocurren las transacciones,
  no la dueña del dinero del personaje"*.

Un personaje libre tiene cartera y no tiene campaña. Las dos frases no pueden ser ciertas a la vez.

| Opción | Consecuencia |
|---|---|
| ⭐ **A. La cartera nunca tiene campaña** | `accounts.campaign_id` NULL siempre para carteras de personaje, dentro o fuera de campaña. El contexto se deriva de la membresía. Baúl, tienda y mundo/GM sí llevan `campaign_id`. Fiel a D6; HU-3.1 queda superseded. |
| **B. Se llena al unirse** | La cartera queda ligada a la campaña mientras dura la membresía y vuelve a NULL al salir. Reconcilia ambos textos pero la cuenta muta en el tiempo y ensucia la trazabilidad de asientos viejos. |
| **C. HU-3.1 literal** | `campaign_id NOT NULL`. El personaje libre no tendría cartera hasta unirse: rompe D4 y D9b. Lo listo solo por completitud. |

## P4 · La cuadratura del saldo de apertura

El agujero más serio, y no está resuelto en ninguna página.

- **HU-2.2:** en modo edición libre *"no se generan asientos"*.
- **D7b:** la verificación manual *"suma todos los asientos de la cuenta y compara contra el saldo guardado"*.

Un personaje de nivel 12 entra con 5.000 gp cargados a mano: saldo 5.000, suma de asientos 0.
**Descuadre permanente desde el día uno**, y solo el GM podría taparlo con un ajuste.

| Opción | Consecuencia |
|---|---|
| ⭐ **A. Asiento de apertura al unirse** | Al unirse, una RPC genera un asiento desde mundo/GM por el oro e ítems que trae. Cuadra siempre, el GM ve con qué entró cada uno, y HU-2.2 se respeta (la edición libre sigue sin generar asientos). |
| **B. Saldo inicial como baseline** | La cuenta guarda `saldo_inicial` congelado al unirse. Cuadratura: `saldo = saldo_inicial + suma(asientos)`. No ensucia el ledger, pero el oro de apertura es invisible en el historial. |
| **C. Asientos desde la creación** | Hasta la edición libre genera asientos. Un solo camino, nunca hay saldo sin respaldo. Contradice HU-2.2 explícitamente. |

---

# Sección 1 · Huecos en Notion

## P5 · D19 y D20 no existen en la página de decisiones

La página salta de **D18c a D21**. Son 21 decisiones documentadas, no 23. Reconstruí su contenido
desde las épicas:

- **D19** = retiro libre del baúl con auditoría; el control es social, no técnico (citada en HU-10.3 y HU-10.4).
- **D20** = ante una regla discutible, decide el GM (citada en E12).

**¿Confirmas que ese es su contenido, o se perdió algo más?**

## P6 · D7b no está en tu prompt

Saldo guardado en columnas + cuadratura automática con rollback + asientos de ajuste solo del GM.
Es un driver mayor del esquema (columnas de saldo, tabla de ajustes, permisos diferenciados).
**¿Lo modelo tal como está en Notion?**

## P7 · E12 (configuración de campaña) no está en tu prompt

Implica tablas para: monedas activas, tasas de cambio, % de recompra por defecto, umbrales de carga
y si el vuelto está habilitado — todo por campaña. **¿Entra al MVP?**

## P8 · Salir de una campaña no está definido en ningún lado

Si un personaje está en una sola campaña a la vez, puede irse y unirse a otra. Nadie definió:

- ¿Se reabre la edición libre al salir? (Si sí: se puede lavar oro entrando y saliendo.)
- ¿El personaje se lleva el oro y los ítems que ganó ahí?
- ¿Qué pasa con su historial en el ledger de esa campaña?
- ¿Quién puede sacarlo: solo el jugador, o también el GM (expulsión)?
- ¿Qué pasa con los ítems que retiró del baúl y nunca devolvió?

## P9 · Tasas de cambio y electrum del personaje libre

E12 hace las tasas y las monedas activas configurables **por campaña**. El personaje libre no tiene campaña.

- ¿Qué tasas usa su conversor? ¿Las oficiales por defecto?
- ¿Qué pasa si entra con `ep` en la bolsa a una campaña con el electrum desactivado?
- ¿Las tasas configurables afectan el **cálculo del vuelto**, o solo al conversor? (Si un GM define
  1 gp = 3 sp, el "pago óptimo" y el vuelto cambian por completo.)

---

# Sección 2 · Ledger y cuentas

## P10 · ¿Una cuenta por personaje, o dos?

- **HU-3.1 Gherkin:** *"cada uno tiene exactamente **una** cuenta asociada"*.
- **D6 tabla:** lista *"Cartera del personaje"* e *"Inventario del personaje"* como dos filas distintas.

¿El personaje tiene una cuenta que contiene monedas **e** ítems, o dos cuentas separadas?
⭐ Recomiendo **una cuenta** (fiel a HU-3.1): más simple y el asiento ya distingue monedas de ítems.

## P11 · El asiento necesita más que origen/destino

Notion describe el asiento como *"origen, destino, tipo, monedas, ítems, autor, timestamp"*.
**Eso no alcanza para una compra**, donde tres cosas se mueven en dos direcciones a la vez:

1. Monedas del pago: jugador → tienda
2. Monedas del vuelto: tienda → jugador
3. Ítems: tienda → jugador

Con un solo par origen/destino no se puede representar. Mi propuesta: **cabecera + líneas**
(`transactions` + `transaction_lines`), donde cada línea tiene su propio origen, destino y contenido.
La cabecera guarda tipo, autor y timestamp.

**¿Apruebas el cambio de forma?** Es fiel al espíritu de D6 pero no a su literalidad.

## P12 · Tipos de transacción

Los que aparecen en Notion: `botín`, `compra`, `venta`, `depósito`, `retiro`, `ajuste`.
Faltarían según lo que decidas: `apertura` (P4). **¿La lista está completa? ¿Alguno sobra?**

## P13 · El asiento de ajuste

- ¿Puede ajustar **ítems**, o solo oro? (D7b habla de valor; un descuadre de ítems también es posible.)
- ¿La nota/motivo es obligatoria?
- ¿Contra qué cuenta se ajusta: mundo/GM, o una cuenta contable de ajustes?

## P14 · La cuenta mundo/GM

¿Es **una por campaña** o **una global**? Si toda cuenta lleva `campaign_id` (P3), es una por campaña.
Es también el origen del asiento de apertura si eliges P4-A — pero la apertura ocurre al unirse,
cuando ya hay campaña, así que calza.

## P15 · ¿El personaje libre tiene historial?

Si la edición libre no genera asientos (HU-2.2), un personaje libre tiene ledger vacío.
**¿Correcto?** ¿O quieres que sus cambios en edición libre queden registrados de algún modo
(aunque no sea como asiento contable)?

---

# Sección 3 · Monedas

## P16 · Saldos negativos

Asumo `CHECK (pp >= 0)` en las cinco denominaciones, para todas las cuentas.
**¿La caja de tienda infinita es la excepción**, o se modela con un flag que saltea la validación?

## P17 · El precio del catálogo, ¿en cobre?

Tensión real: D8 prohíbe normalizar a cobre **los saldos**, pero un precio de catálogo en cobre
es lo natural (el v1 usaba `value_in_copper`) y es lo que permite calcular el vuelto por equivalencia.

⭐ Mi lectura: D8 aplica a **tenencias** (lo que tienes en el bolsillo), no a **precios** (una etiqueta).
El precio vive en cobre; el pago se hace en monedas reales. **¿Correcto?**

## P18 · Vuelto deshabilitado

E12 permite apagar el vuelto. Si está apagado y el jugador no tiene el monto exacto:
¿la compra se rechaza? ¿o paga de más y pierde la diferencia?

---

# Sección 4 · Inventario y equipo

## P19 · Stacking: ¿una fila por unidad o cantidad en la fila?

El v1 creaba **N filas de cantidad 1** (`createMultipleItems`). 20 flechas = 20 filas.

⭐ Propongo híbrido: `quantity` en la fila para ítems fungibles (flechas, raciones, pociones) y
fila individual para lo que necesita identidad propia (equipable, sintonizable, contenedor).

**Ojo:** HU-10.4 pide *"rastrear un ítem: ver quién tiene la espada +1 ahora"*. Eso exige identidad
estable por instancia, al menos para los ítems que importan. **¿Apruebas el híbrido?**

## P20 · Rareza vs. sintonización

D13 dice: *"La rareza del ítem es campo obligatorio — **determina** si requiere sintonización"*.

**Eso no es correcto según PHB 2024.** La sintonización es un campo propio del ítem, no se deriva de
la rareza: hay ítems *rare* sin sintonización y *uncommon* con ella. **Propongo dos campos separados:
`rarity` y `requires_attunement`.** ¿Confirmas?

## P21 · El límite de 3 sintonizados, ¿cuenta equipados o poseídos?

- **El v1** contaba *"3 objetos con attunement **equipados**"*.
- **PHB:** la sintonización es independiente de llevar el ítem puesto.

**¿Cuál mando?** Afecta dónde vive el flag (`attuned` en la fila de inventario) y qué valida la BD.

## P22 · Anidación de contenedores

D16 evita anidar en el baúl volcando el botín. Pero en el inventario del personaje:
**¿puede meter una bolsa dentro de una mochila?** ¿Un nivel? ¿Multinivel? ¿Ninguno?
El v1 solo prohibía la auto-contención.

## P23 · ¿El contenedor debe estar equipado para que su contenido cuente?

HU-5.6 dice *"Dado que tengo una mochila **equipada** con espacio"*. ¿Se puede guardar en un
contenedor **no** equipado? Si sí: ¿ese contenido pesa? (Si no pesa, es una bodega infinita
y el enforcement de carga se evade guardando todo en una mochila desequipada.)

## P24 · Cambiar la Fuerza estando en campaña

La Fuerza sube (ASI, Manual del Ejercicio). Cambia la capacidad. Si **baja**:
¿qué pasa con un personaje que queda sobrecargado? ¿Se le desequipa algo? ¿Queda en sobrecarga
hasta que él resuelva? ¿Se puede editar la Fuerza en campaña, o es edición libre también?

## P25 · Especie y tamaño

- **Especie:** ¿enum cerrado de PHB 2024 o texto libre? (El descuento racial está fuera, así que
  hoy es puramente descriptiva.)
- **Tamaño:** ¿enum solo `Small | Medium`? Las especies de PHB 2024 solo son eso. Si permites
  `Tiny` o `Large`, hay que definir su multiplicador de capacidad — y D11 solo resolvió Small=Medium.

## P26 · Borrar un personaje

*"Archivar personajes"* está en el roadmap, pero **borrar** no está definido.
¿Se puede borrar un personaje con historial en el ledger? Si sí, sus asientos quedan huérfanos
y la inmutabilidad (HU-3.3) se rompe por la puerta de atrás.

---

# Sección 5 · Catálogo

## P27 · Alcance del seed

*"Seed con armas, armaduras y equipo de aventura del PHB 2024"* (HU-6.1).
**¿Incluye ítems mágicos?** Los ítems mágicos no están en el PHB 2024, están en el DMG.
Pero D13 (sintonización) y HU-5.2 (*"leer qué hace tu espada flamígera"*) los presuponen.
Si no van en el seed, todo ítem mágico es homebrew del GM.

## P28 · ¿El GM puede tocar los ítems oficiales?

Los oficiales son globales. **¿El GM puede editarlos, ocultarlos o desactivarlos en su campaña?**
(Ej: "en mi mundo no existe la pólvora".) Si puede editarlos, no pueden ser globales de verdad.

## P29 · Tipos y categorías de ítem

¿Enum cerrado? ¿Cuál es la lista? El v1 tenía `item_type` + `item_category` + `wondrous_type`,
y el slot equipable se derivaba de un mapa en código. **¿El catálogo declara directamente su
`equippable_slot`?** Es más simple y elimina el mapa.

## P30 · Armas versátiles sin daño

Se conserva *"la ocupación de slots"* y se elimina el daño. Entonces, ¿qué guarda el catálogo?
¿Un flag `is_versatile` + `is_two_handed`? ¿O el JSONB de propiedades del v1 sin los campos de daño?

## P31 · Ítems únicos con nombre propio

Si el catálogo es la única puerta (D14), un ítem único ("Colmillo, la espada de mi personaje")
tiene que ser un homebrew del catálogo. **¿La fila de inventario puede tener overrides**
(nombre propio, nota) **o eso también obliga a crear un homebrew?**
Un personaje **libre** no tiene campaña, y los homebrew pertenecen a una campaña — así que hoy
un personaje libre no puede tener ítems únicos. ¿Es aceptable?

---

# Sección 6 · Mundo y comercio

## P32 · ¿A qué precio recompra la tienda?

D22 dice *"50% del **precio base**"*. Pero HU-7.3 permite que la tienda tenga un precio distinto
del base (*"un pueblo remoto cobra más"*). **¿El 50% se aplica sobre el precio base del catálogo
o sobre el precio de esa tienda?** Cambia el resultado y la estrategia del jugador.

## P33 · ¿La tienda compra cualquier cosa?

**¿Puedo venderle una espada al alquimista?** ¿O la tienda solo recompra ítems que ya vende /
de su categoría? Nadie lo definió.

## P34 · Lo vendido, ¿entra al stock de la tienda?

Vendo una espada +1 al herrero. **¿Aparece en su catálogo para que otro jugador la compre?**
Si sí, el stock deja de ser solo del GM y la tienda se vuelve un mercado real.
Si no, el ítem se destruye — y eso hay que decirlo, porque el ledger registraría una desaparición.

## P35 · Stock infinito por ítem

D21 permite caja infinita. **¿Existe el stock infinito?** Una tienda con antorchas ilimitadas es
razonable. Hoy HU-7.3 dice *"si hay 3 espadas, la cuarta compra falla"*.

## P36 · Vender o depositar un ítem equipado

HU-10.2 resuelve el depósito: *"se desequipa y sale de mi inventario"*.
**¿La venta hace lo mismo?** ¿Y si el ítem está dentro de un contenedor, o es el contenedor
con cosas adentro?

## P37 · Tipo de tienda

*"Creo una tienda con nombre, tipo y configuración de caja"* (HU-7.2).
**¿Qué es "tipo"?** ¿Enum (herrería, alquimista, general)? ¿Texto libre? ¿Filtra qué puede vender (P33)?

---

# Sección 7 · Roles, campaña y RLS

## P38 · ¿El GM opera el baúl?

D18b: el GM *"no accede a la party como miembro"*. Entonces **el GM no deposita ni retira del baúl**.
¿Correcto? Es coherente (no tiene cartera de dónde sacar), pero conviene decirlo explícito porque
el baúl es lo único compartido.

## P39 · ¿El jugador ve los botines en borrador?

**Spoilers.** Si un jugador puede leer `loot` de su campaña, ve el tesoro del dragón antes de matarlo.
Asumo que los botines en borrador son **solo del GM** y que el jugador solo ve el asiento cuando se
entrega. ¿Confirmas?

## P40 · ¿El jugador ve el ledger de la tienda?

D18 dice que solo ve lo compartido: **el baúl**. Pero cada compra genera un asiento donde la tienda
es contraparte. **¿El jugador ve solo sus propios asientos, o el historial completo de la tienda**
(y con eso deduce lo que compraron los demás)?

## P41 · ¿Dos personajes del mismo jugador en la misma campaña?

*"Un personaje = una campaña"* no lo prohíbe. **¿Puede un jugador tener dos personajes en la misma
mesa?** (Caso real: personaje de repuesto, o el que murió.)

## P42 · ¿Una campaña puede tener más de un GM?

D18b separa GM de jugador, pero no dice cuántos GMs hay. **¿Co-GM existe?**

## P43 · Borrar una campaña

¿Se puede? ¿Qué pasa con los personajes que estaban dentro, su oro ganado ahí y el ledger?
Choca con la inmutabilidad (HU-3.3) igual que P26.

## P44 · El código de invitación

- ¿Formato y largo? ¿Único global o único por campaña?
- ¿Se puede **regenerar**? (Si se filtra, el GM necesita invalidarlo.)
- ¿Expira? ¿Tiene tope de usos?

---

# Qué hago cuando respondas

Con esto escribo `docs/nuevo-modelo/modelo-de-datos.md` completo:
diagrama mermaid, tablas con tipos y constraints, contratos de las RPCs, estrategia de RLS,
decisiones con alternativas descartadas, y las preguntas que queden abiertas.

**No escribo la migración 001 hasta que apruebes el modelo.**
