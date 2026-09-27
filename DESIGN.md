---
name: Tutor de IA de trigonometría
description: Taller tocable donde niños descubren trigonometría jugando con una IA que dibuja.
colors:
  noche: "#0d1117"
  panel-noche: "#0a0e14"
  carta-noche: "#111826"
  tinta: "#e2e8f0"
  papel: "#f6f8fb"
  panel-dia: "#ffffff"
  carta-dia: "#f1f5f9"
  texto-dia: "#1f2937"
  cielo: "#38bdf8"
  cielo-profundo: "#0284c7"
  ia: "#a78bfa"
  ia-profunda: "#7c3aed"
  ambar: "#fbbf24"
  ambar-quemado: "#b45309"
  usuario: "#1d4ed8"
  exito: "#4ade80"
  error: "#f87171"
  tenue-noche: "#8b949e"
  tenue-dia: "#61708b"
  borde-noche: "#1f2630"
  borde-dia: "#d7dee8"
typography:
  display:
    fontFamily: "system-ui, sans-serif"
    fontSize: "44px"
    fontWeight: 900
    lineHeight: 1.1
    letterSpacing: "normal"
  headline:
    fontFamily: "system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.3
  title:
    fontFamily: "system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.08em"
  body:
    fontFamily: "system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "system-ui, sans-serif"
    fontSize: "10px"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "1.5px"
rounded:
  sm: "4px"
  input: "6px"
  btn: "8px"
  card: "10px"
  bubble: "12px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button:
    backgroundColor: "{colors.carta-noche}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.btn}"
    padding: "6px 12px"
  button-primary:
    backgroundColor: "{colors.cielo}"
    textColor: "{colors.noche}"
    rounded: "{rounded.btn}"
    padding: "10px 24px"
  button-primary-hover:
    backgroundColor: "{colors.cielo}"
    textColor: "{colors.noche}"
    rounded: "{rounded.btn}"
    padding: "10px 24px"
  input:
    backgroundColor: "{colors.carta-noche}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.input}"
    padding: "6px 8px"
  bubble-user:
    backgroundColor: "{colors.usuario}"
    textColor: "#ffffff"
    rounded: "{rounded.bubble}"
    padding: "8px 12px"
  bubble-ia:
    backgroundColor: "{colors.carta-noche}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.bubble}"
    padding: "8px 12px"
---

# Design System: Tutor de IA de trigonometría

## Overview

**Creative North Star: "El Taller del Descubridor"**

Este no es un libro ni un chatbot: es una mesa de trabajo donde todo se puede tocar. En el centro hay una pizarra viva —un lienzo SVG estilo GeoGebra con grilla, puntos gordos y segmentos de colores— y a los lados dos ayudantes silenciosos: el panel Álgebra que cuenta en vivo lo que pasa en la figura, y el Tutor IA que dibuja con su propio cursor violeta, habla con voz cálida y celebra cada hallazgo.

Todo está pensado para que un niño de 10 años toque primero y entienda después. Los números usan letra monoespaciada grande y editable (todo valor con ✎ se reescribe y la figura se mueve), los botones son ligeros y precisos con bordes finos de 1px, y el color solo aparece donde hay significado: cielo para lo tocable, ámbar para el ángulo que se descubre, violeta para la IA. Sin red, el taller sigue abierto: el tutor local sostiene la sesión.

**Key Characteristics:**
- Pizarra tocable al centro, paneles estrechos a los lados (290–300px).
- Plano por defecto: profundidad por tono, no por sombras.
- Monoespaciada para medir, system-ui para conversar.
- Color con oficio: cada acento tiene un dueño (tacto, ángulo, IA).

## Colors

Paleta doble (noche y día) con la noche como casa: fondo tinta oscura, acentos luminosos que invitan a tocar.

### Primary
- **Cielo** (#38bdf8 / #0284c7 en día): lo tocable y lo vivo. Botones activos, tabs seleccionados, valores de base, cursor hover, burbuja de envío ➤. En día se oscurece a cielo-profundo para contraste sobre blanco.
- **Noche** (#0d1117): fondo del lienzo y de la app en modo oscuro. La grilla (#26334a / fuerte #3d4f6e) y los ejes (#5c6f8c) flotan sobre ella.

### Secondary
- **IA** (#a78bfa / #7c3aed en día): solo la tutora. Su cursor, su nombre en subtítulos, el botón «Entrar a este mundo». Nunca se usa para acciones del niño.
- **Ámbar** (#fbbf24 / #b45309 en día): el descubrimiento. Arco del ángulo θ, selección, badge de snap (⚡), celebración a 44px. Raro por diseño: si todo brilla, nada celebra.

### Tertiary
- **Usuario** (#1d4ed8): burbuja del niño en el chat. Único azul sólido, sin borde.
- **Éxito** (#4ade80): punto «● en línea» del tutor.
- **Error** (#f87171): mensajes de ErrorBoundary y botón ⏹ Cancelar.

### Neutral
- **Tinta** (#e2e8f0): texto sobre noche, puntos del lienzo, hipotenusa.
- **Texto-día** (#1f2937): texto sobre papel blanco.
- **Tenue** (#8b949e / #61708b en día): etiquetas secundarias, hints del footer, iconos apagados.
- **Papel** (#f6f8fb): fondo día; **Panel-día** (#ffffff) y **Carta-día** (#f1f5f9) para superficies.
- **Panel-noche** (#0a0e14) y **Carta-noche** (#111826): laterales y burbujas IA en oscuro.
- **Borde** (#1f2630 / #d7dee8 en día): línea de 1px que separa header, panels y cards.

### Named Rules (optional, powerful)
**The Un Dueño Por Color Rule.** Cada acento tiene un solo dueño: cielo = tocable, ámbar = ángulo/selección, violeta = IA, azul usuario = mensaje del niño. Nunca intercambiarlos.
**The Noche Primero Rule.** Se diseña en noche (#0d1117); el día es traducción tonal, no rediseño.

## Typography

**Display Font:** system-ui, sans-serif (celebración 900)
**Body Font:** system-ui, sans-serif
**Label/Mono Font:** ui-monospace, monospace (medidas, álgebra, canvas)

**Character:** Conversa en system-ui cálida y pequeña (12–13px); mide en monoespaciada precisa. Los números nunca usan la voz conversacional.

### Hierarchy
- **Display** (900, 44px, 1.1): solo celebración a pantalla completa («¡Descubierto!», color ámbar con sombra 0 4px 30px rgba(0,0,0,.8)).
- **Headline** (700, 22px, 1.3): título de ErrorBoundary «Algo salió mal»; títulos de mundo en Descubrir (16px).
- **Title** (700, 13px, 1.4, +0.08em): «Tutor IA», «ÁLGEBRA», cabeceras de panel.
- **Body** (400, 12.5px, 1.6): mensajes de chat, historias de mundos, filas de álgebra (estas en mono 12.5px).
- **Label** (700, 10px, 1.4, 1.5px tracking, uppercase): SectionTitle («PUNTOS», «SEGMENTOS»), «Biblioteca de mundos», hints de herramienta en el lienzo (11px).

### Named Rules (optional)
**The Mono Mide Rule.** Todo número que el niño lee o edita va en monospace (medidas, θ, base, altura, hip, fórmulas sin/cos/tan). El resto va en system-ui.

## Layout

Tres columnas vivas: lateral izquierdo estrecho (SidePanel 290px / Álgebra 272px), lienzo central flexible que ocupa todo lo que queda, chat derecho (300px). Header fino (10px 16px) con marca Δ + título + controles del docente; footer monoespaciado con sliders θ/base, atajos 30°/45°/60° y fórmula viva tan(θ). Descubrir reemplaza la triple columna por biblioteca (250px) + lienzo + historia/retos (300px).

Densidad compacta de taller: gaps 4–12px, padding de filas 7px 10px, panel scroll independiente (overflowY auto) mientras el lienzo nunca scrollea. Responsive por colapso, no por reflow: los laterales se pliegan a pestañas verticales de 30px («PANEL», «TUTOR IA», «ÁLGEBRA» con writing-mode vertical-rl). El lienzo usa ResizeObserver + fitView para no perder la figura.

## Elevation & Depth

Plano por defecto. No hay sombras de Material: la profundidad se construye con capas tonales (noche → panel-noche → carta-noche; papel → blanco → carta-día) más una línea de borde de 1px y un halo interior sutil (inset -1px 0 0 rgba(148,163,184,0.08) en el lateral).

### Shadow Vocabulary (if applicable)
- Sin vocabulario de sombras. La única sombra del sistema es la de la celebración (text-shadow 0 4px 30px rgba(0,0,0,.8)) y el halo de selección en SVG (stroke 9px al 30% + pulseGlow).

### Named Rules (optional)
**The Flat-By-Default Rule.** Las superficies descansan planas. El brillo solo aparece como respuesta a estado: hover/selección (fondo rgba(56,189,248,.10) + borde cielo), pulso IA (glow-pulse 0.8s), pop de celebración (popIn 0.5s), subtítulo que sube (fadeUp 0.3s).

## Shapes

Lenguaje redondeado-amable de instrumento: todo es rectángulo con radio generoso, nada es Sharp salvo el cursor IA (flecha triangular) y el marcador de ángulo recto. Escala: scrollbar 4px, inputs 6px, botones 8px, cards/filas 10px, burbujas chat y subtítulos 12px, pills y badges 999px (snapBadge, slider values, punto Δ). Bordes de 1px sólidos (nunca dashed salvo el valor editable: underline 1px dashed cielo + ✎). Puntos del lienzo circulares (r 6–8px, borde 2.5px); segmentos con linecap round de 3–3.5px; swatches de álgebra con pastilla 18×3px.

## Components

### Buttons
Ligeros y precisos: borde 1px, fondo carta, texto 12px. La forma invita sin gritar.
- **Shape:** suavemente redondeado (8px radius)
- **Primary:** fondo cielo (#38bdf8) + texto noche (#0d1117), padding 10px 24px, peso 700 (ej. «🔄 Reiniciar tutor», botón ➤ del chat con texto blanco)
- **Hover / Focus:** borde cielo + fondo rgba(56,189,248,.10) + texto cielo; transición all 0.2s ease en filas
- **Secondary / Ghost / Tertiary (if applicable):** ghost transparente con borde tenue para tabs apagados y «Recargar página»; danger solo en texto rojo (#f87171) para Cancelar, sin fondo rojo

### Chips (if used)
- **Style:** tab activo = fondo rgba(56,189,248,.08) + borde inferior 2px cielo + texto cielo 700; inactivo = transparente + texto tenue
- **State:** atajos 30°/45°/60° como mini-botones (4px 8px) que se apagan a 0.45 opacidad cuando chain está off

### Cards / Containers
- **Corner Style:** 10px en cards y filas, 12px en burbujas y toasts
- **Background:** carta-noche (#111826) en oscuro / carta-día (#f1f5f9) en claro; panel-noche para laterales
- **Shadow Strategy:** sin sombra; separación por borde 1px + tono
- **Border:** 1px sólido borde-noche/borde-día; activo = 1px cielo
- **Internal Padding:** 8px 12px (burbujas), 7px 10px (filas álgebra), 10px 14px (cabeceras)

### Inputs / Fields
- **Style:** fondo carta, borde 1px borde, radio 6–8px, texto 12–12.5px mono por defecto en álgebra, system-ui en chat
- **Focus:** borde cielo (álgebra: 1px sólido cielo, ancho 96px); sin anillo externo
- **Error / Disabled:** disabled a 0.5 opacidad + cursor default; sliders usan accent-color #38bdf8 nativo

### Navigation
Tabs del SidePanel (∑ 🛠 🧮 ▦) equidistantes (flex 1), 11–14px, icono solo. Activo: franja inferior 2px cielo + fondo cielo al 8%. Etiqueta de sección debajo en uppercase 10px tenue. En móvil conceptual: plegado a rail vertical de 30px.

### [Signature Component] (optional; if the project has a distinctive custom component worth documenting)
**Lienzo-manipulable + fila-álgebra enlazada.** Cada fila del Álgebra (punto/segmento/ángulo) ilumina su gemelo en el SVG al hover (halo 13px + glow-pulse) y viceversa; clic selecciona en ambos. Los valores con ✎ se editan inline y la figura se mueve en vivo. El cursor IA (flecha violeta + etiqueta «IA» 11px mono 700) dibuja la construcción paso a paso con subtítulo inferior (bubbleBg + borde bubbleBorder, fadeUp) y badge ámbar de snap. Esta doble vida lienzo↔número es la firma: nunca documentar uno sin el otro.

## Do's and Don'ts

Concrete visual guardrails grounded in the incumbent implementation or the user's chosen world. Lead each with "Do" or "Don't" and include exact values only when established. Do not turn a task-specific concept or surface strategy into a system-wide prohibition.

### Do:
- **Do** mantener títulos del dueño intactos: «Tutor de IA de trigonometría» en header y «altura» (no «height») en Álgebra.
- **Do** usar system-ui 12–13px para conversar y monospace 12–12.5px para medir; sliders y footer siempre en mono.
- **Do** reservar ámbar (#fbbf24) para ángulo/selección/celebración y violeta (#a78bfa) solo para la IA.
- **Do** plegar laterales a rail de 30px en vez de amontonar columnas en pantallas estrechas.
- **Do** anunciar estados con tono cálido en español («🤔 IA pensando…», «🔊 Voz on», toast inferior-derecho 8px 14px).

### Don't:
- **Don't** introducir sombras grandes, gradientes decorativos ni radios sharp: el sistema es plano con radios 6–12px (el único gradiente permitido es el del botón «✨ Simular IA» 135deg cielo/IA al 8%).
- **Don't** usar el violeta IA para acciones del niño ni el cielo para mensajes del niño (esos van en azul usuario #1d4ed8).
- **Don't** subir el cuerpo conversacional por encima de 13px ni poner números en system-ui: rompería la lectura viva del taller.
- **Don't** ejecutar sin sanitizar: nada del modelo o del input llega al lienzo sin allowlist + clamp + revalidación en frontend.
- **Don't** fabricar testimonios, métricas de aula o casos de estudio en futuros diseños: no existen y no se inventan.
