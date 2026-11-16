# Constantes

**Sistema de diseño para software clínico.**
Aplicable a historia clínica electrónica, laboratorio, consultorio, guardia, enfermería y telemedicina.

| | |
|---|---|
| Versión | 1.0 |
| Estado | Propuesta de dirección |
| Alcance | Productos clínicos multiusuario (web y desktop). Español neutro (es-AR). |
| Fuera de alcance | Portales de autogestión para pacientes, marketing, sitio institucional |

---

## 1. Qué es esto y cómo usarlo

`Constantes` es un sistema de diseño, no una hoja de estilos ni un kit de pantallas. Define **decisiones** (color, tipografía, espacio, estructura, movimiento, lenguaje) y **reglas** para combinarlas, de modo que dos equipos construyendo dos módulos distintos de un mismo producto clínico produzcan algo que se siente del mismo instrumento.

Se usa de tres maneras:

1. **Como contrato.** Los tokens de la sección 4 son la fuente de verdad. El código consume variables; nadie escribe hex sueltos.
2. **Como repertorio.** Los componentes (sección 6) y patrones (sección 7) resuelven los problemas recurrentes del trabajo clínico: identificar a una persona, leer un resultado, registrar un dato obligatorio, avisar de un valor crítico, dejar rastro.
3. **Como criterio.** Cuando algo no está en el sistema, la sección 3 (principios) y la 10 (guardarraíles) deciden. Si hay que inventar, se inventa dentro de la lógica.

El nombre no es decorativo: `Constantes` son los signos vitales que se miden y se vigilan, y son también las constantes que fijan el diseño. El doble sentido es el tema del sistema: **medir contra un rango, y sostener el criterio.**

---

## 2. El concepto

### El problema real

El software clínico se usa en un entorno con tres condiciones que casi ningún otro dominio tiene juntas:

- **La decisión es irreversible y de alto riesgo.** Un dato mal leído no es una molestia; es un daño.
- **El tiempo es escaso y la atención es intermitente.** El personal lee de pie, con guantes, interrumpido cada pocos minutos, en cambios de guardia.
- **Todo debe ser trazable y confidencial.** Quién cargó qué, cuándo, y quién puede verlo.

La consecuencia de diseño: la interfaz tiene que ser **legible de un vistazo, difícil de malinterpretar y honesta sobre su estado.** La estética no es un adorno que se aplica encima; es la forma que toma la seguridad.

### La dirección

Dos objetos reales del mundo clínico definen la identidad:

- **El instrumento.** Un monitor, un analizador, una bomba de infusión: carcasa oscura y serena, información de alto contraste, color reservado para lo que significa algo, cero adornos. Es un objeto diseñado para no mentir.
- **La ficha.** La hoja de constantes y el informe de laboratorio: columnas regladas, valores alineados, y —lo esencial— cada número **situado respecto de un rango de referencia**.

De ahí salen las dos decisiones que sostienen todo el sistema:

1. **El color es información, no decoración.** El sistema es casi monocromo (papel frío, tinta profunda, grafito). El color saturado aparece solo cuando **significa**: un estado, un valor fuera de rango, una alerta. Si algo está verde, ámbar o rojo, no es porque se vea lindo.
2. **Todo valor clínico se muestra contra su rango.** La unidad de diseño memorable no es un botón ni una tarjeta: es el **valor con su banda de referencia** (§5). Es lo que distingue a este sistema de cualquier dashboard genérico, y es exactamente lo que el trabajo clínico necesita ver.

### Paleta en una frase

**Pino clínico sobre papel frío, con tinta de grafito y color reservado para el significado.** No es el azul médico por defecto, ni el rojo de sangre sobre blanco, ni el crema cálido de moda. Es el verde quirúrgico y el acero de un instrumento.

---

## 3. Principios

1. **El dato manda.** La jerarquía visual sigue a la jerarquía clínica: identidad de la persona, luego estado, luego el dato, luego la acción. Si un elemento decorativo compite con un valor, se elimina el elemento.
2. **Un color saturado es una afirmación.** Verde, ámbar y rojo se usan solo para estados y valores. Nunca como acento estético, nunca para "dar vida" a una pantalla.
3. **Nunca solo color.** Todo estado lleva color **más** ícono **más** texto. Regla dura, no recomendación: hay daltonismo, hay pantallas malas, hay sol en la guardia.
4. **El estado siempre es visible.** Quién es la persona, en qué contexto estoy, si el sistema está guardando, si hay red, si un valor es crítico. La interfaz no oculta su estado.
5. **Denso por defecto, no apretado.** La densidad es una función, no un descuido: se muestran muchos datos con aire medido y alineación estricta. La densidad es configurable (§4.4), la alineación no.
6. **Alineación y repetición antes que cajas.** Las columnas, los renglones y las bandas organizan; las tarjetas con sombra son el último recurso.
7. **El movimiento explica un cambio.** Se anima lo que el sistema hizo (guardó, llegó un resultado, se bloqueó una acción). No se anima para dar vida.
8. **Escribir es diseñar.** Un mensaje de error es una instrucción. Un estado vacío es una invitación. Un rótulo nombra lo que la persona reconoce, no lo que el sistema construyó.
9. **La accesibilidad es clínica.** Contraste, foco visible, tamaño de objetivo y escalado de texto no son cumplimiento: son seguridad del paciente.
10. **Sustraer.** Antes de terminar una pantalla, sacar un elemento. Lo memorable se gana con disciplina en todo lo demás.

---

## 4. Fundamentos

### 4.1 Color

Neutros fríos como base; marca en pino; semántica reservada. Los valores son punto de partida: **verificar contraste** en la implementación final.

#### Neutros y tinta

| Token | Hex | Uso |
|---|---|---|
| `--c-paper` | `#F4F6F6` | Fondo de la aplicación. Off-white frío, no crema. |
| `--c-surface` | `#FFFFFF` | Superficies de contenido: fichas, formularios, tablas. |
| `--c-surface-sunk` | `#E9EEEE` | Pozos, filas alternas, encabezados de tabla. |
| `--c-line` | `#D6DEDD` | Separadores, bordes de 1px. |
| `--c-line-strong` | `#BFCAC8` | Bordes de campos activos, divisores de sección. |
| `--c-ink` | `#16211F` | Texto principal. Grafito con sesgo pino. |
| `--c-ink-soft` | `#3C4A48` | Texto secundario, subtítulos. |
| `--c-ink-muted` | `#5C6B68` | Metadatos, ayudas, texto deshabilitado (≈5,5:1 sobre blanco). |
| `--c-ink-inverse` | `#FFFFFF` | Texto sobre superficies oscuras o de marca. |

#### Marca (pino)

| Token | Hex | Uso |
|---|---|---|
| `--c-brand` | `#0F5449` | Acciones primarias, foco, enlaces, elementos activos. ≈8,4:1 sobre blanco. |
| `--c-brand-strong` | `#0A3B33` | Estados *hover*/pressed de la marca. |
| `--c-brand-soft` | `#E2EFEC` | Fondos tenues de marca, fila seleccionada, chip informativo. |
| `--c-on-brand` | `#FFFFFF` | Texto e íconos sobre marca. |

#### Semántica (estado y significado)

| Token | Hex | Fondo | Uso |
|---|---|---|---|
| `--c-ok` | `#1C7A45` | `--c-ok-bg` `#E6F3EA` | Resultado normal, confirmado, dentro de rango, guardado. |
| `--c-warn` | `#946200` | `--c-warn-bg` `#FAF0DA` | Atención, pendiente, valor límite, dato por revisar. |
| `--c-danger` | `#B02A2F` | `--c-danger-bg` `#FBE9EA` | Error, fuera de rango, contraindicación, acción destructiva. |
| `--c-critical` | `#7A0E14` | `--c-critical-bg` `#F7DFE0` | Valor crítico / alerta que exige acción inmediata. Más peso que `danger`. |
| `--c-info` | `#0F5449` | `--c-info-bg` `#E2EFEC` | Información, ayuda contextual. Reutiliza la marca: no se agrega un azul. |

> **Regla de precedencia.** Si un mismo elemento es "marca" y "estado", gana el estado. La marca cede ante la semántica, siempre.

#### Tema oscuro

La guardia nocturna y las salas con luz baja lo justifican. No es una inversión automática: se recalibra para mantener contraste y bajar la luminancia.

```css
[data-theme="dark"] {
  --c-paper:        #101A18;
  --c-surface:      #16211F;
  --c-surface-sunk: #1E2B29;
  --c-line:         #2B3A37;
  --c-line-strong:  #3C4D49;

  --c-ink:          #EAF0EE;
  --c-ink-soft:     #B9C6C3;
  --c-ink-muted:    #8A9A96;

  --c-brand:        #5FB6A6;
  --c-brand-strong: #7FC9BB;
  --c-brand-soft:   #14332D;
  --c-on-brand:     #08211C;

  --c-ok:      #5FC98A;  --c-ok-bg:      #12301F;
  --c-warn:    #E0AC4A;  --c-warn-bg:    #322612;
  --c-danger:  #F08A8C;  --c-danger-bg:  #351A1B;
  --c-critical:#F4B4B6;  --c-critical-bg:#3A1B1D;
  --c-info:    #5FB6A6;  --c-info-bg:    #14332D;
}
```

### 4.2 Tipografía

Una sola familia grotesca con eje de ancho, más una monoespaciada de alcance estricto. Dos familias, claramente distintas, cada una con un trabajo.

| Rol | Familia | Detalle |
|---|---|---|
| Interfaz, cuerpo, títulos | **Archivo** | Grotesca institucional diseñada para información densa. Se usa su eje de ancho: **Normal** para cuerpo, **SemiCondensada** para tablas y rieles densos, **Expandida** solo para el logotipo. Pesos 400 / 500 / 600 / 700. |
| Datos de máquina | **IBM Plex Mono** | Solo identificadores y valores que exigen desambiguación y alineación: números de historia, DNI, códigos de estudio, dosis, fecha/hora de auditoría. Nunca para rótulos de interfaz. |

> **Nota sobre la monoespaciada.** No se usa como estilo. Se usa porque `0/O` y `1/l/I` deben distinguirse en un número de historia y porque las columnas de valores deben alinear. Fuera de ese uso es un error.

#### Escala

Base 16px. Interlineado generoso en texto largo, ajustado en tablas.

| Rol | Tamaño / línea | Peso | Tracking | Uso |
|---|---|---|---|---|
| `display` | 28 / 34 | 700 | −0.02em | Título de pantalla, nombre de la persona en la ficha. |
| `title-1` | 22 / 28 | 600 | −0.01em | Título de sección. |
| `title-2` | 18 / 24 | 600 | 0 | Subsección, encabezado de panel. |
| `title-3` | 15 / 20 | 600 | 0 | Rótulo de campo, encabezado de grupo. |
| `body` | 15 / 24 | 400 | 0 | Texto corriente, notas clínicas, descripciones. |
| `body-sm` | 13 / 20 | 400 | 0 | Tablas, listas densas, texto de apoyo. |
| `meta` | 12 / 16 | 500 | 0.01em | Metadatos, marcas de tiempo, ayudas. |
| `value` | 20 / 24 | 600 | 0 | Medición destacada (tabulares). |
| `data` | 13 / 18 | 500 | 0 | Identificadores y valores en tablas (mono, tabulares). |

- **Cifras tabulares siempre** en columnas de datos y valores: `font-variant-numeric: tabular-nums;`
- **Longitud de línea:** ≤ 68ch en notas clínicas y texto largo. Las tablas ocupan el ancho disponible.
- **Nunca** todo-mayúsculas para rótulos. La versalita de marca se reserva para el logotipo.

### 4.3 Espacio, forma y elevación

```css
:root {
  /* Espacio — base 4 */
  --s-1: 4px;  --s-2: 8px;  --s-3: 12px; --s-4: 16px;
  --s-5: 20px; --s-6: 24px; --s-8: 32px; --s-10: 40px;
  --s-12: 48px; --s-16: 64px;

  /* Radio — contenido, no personalidad */
  --r-xs: 2px;   /* chips, campos, badges */
  --r-sm: 4px;   /* tarjetas, paneles, botones */
  --r-md: 6px;   /* modales, drawers */

  /* Elevación — solo para lo que flota */
  --e-overlay: 0 8px 24px rgba(16, 33, 31, 0.12);
  --e-popover: 0 2px 8px rgba(16, 33, 31, 0.10);

  /* Densidad */
  --row-h: 40px;        /* cómodo */
  --control-h: 36px;
}
```

- **El radio no expresa jerarquía.** Casi todo es 2–4px. Un sistema clínico se ve preciso, no esponjoso.
- **La elevación es escasa.** La separación se logra con borde de 1px y cambio de fondo. La sombra aparece solo en superposiciones reales (modal, popover, drawer). Sin sombras bajo tarjetas en reposo.
- **Densidad:** dos modos conmutables por contexto (no por gusto).
  - `comfortable` — carga de datos, formularios, uso con pantalla táctil. `--row-h: 40px`.
  - `compact` — revisión de historial, tablas largas, escritorio. `--row-h: 32px`.

### 4.4 Layout

Grilla de **12 columnas** en escritorio, con canal de **24px** y márgenes de **24–32px**; 6 columnas en tablet, 1 en móvil. Ancho máximo de contenido de lectura: **1120px**; las tablas pueden desbordar ese límite con scroll horizontal propio.

**Alineación: izquierda, siempre.** Texto a la izquierda, números a la derecha en columnas (con cifras tabulares), encabezados de columna alineados con su contenido. Nada centrado salvo estados vacíos y diálogos de confirmación cortos.

#### Cáscara de la aplicación

```
┌────────────────────────────────────────────────────────────────────────────┐
│ CONSTANTES          Buscar…  (Ctrl K)          Guardia · L. Pérez  ▾        │ barra superior 56px
├──────────────┬─────────────────────────────────────────────────────────────┤
│              │  ◣ BANNER DE LA PERSONA ◢                                   │ banda de identidad, pegajosa
│  Navegación  │  PÉREZ, Lucía · 34 a · F · DNI 31.234.567 · HC 88-4120 · O+  │
│              │  ⚠ Alergia: penicilina           ● Estable                  │
│  Resumen     ├─────────────────────────────────────────────────────────────┤
│  Notas       │                                                             │
│  Estudios    │    contenido de la sección                                  │
│  Signos      │                                        ┌──────────────────┐ │
│  Recetas     │                                        │ Panel de contexto │ │
│  Auditoría   │                                        │ (opcional)        │ │
│              │                                        └──────────────────┘ │
└──────────────┴─────────────────────────────────────────────────────────────┘
   riel 240px                                                      drawer 320px
```

- **Barra superior:** identidad del producto, búsqueda global, identidad del usuario y su rol/contexto de trabajo. Nunca muestra datos clínicos.
- **Riel de navegación:** 240px, colapsable a 56px. Módulos, no acciones.
- **Banda de identidad:** ver §7.1. Es lo primero y lo que nunca se pierde de vista.
- **Panel de contexto:** resumen del paciente, alergias, últimas constantes. Se abre a demanda; no compite con el contenido.

#### Formulario de carga

```
┌──────────────────────────────────────────────────────────────┐
│  Nueva consulta                                              │
│                                                              │
│  Motivo *                                                    │
│  ┌────────────────────────────────────────────────────────┐  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  Signos vitales                          ⓘ se guarda al salir│
│  ─────────────────────────────────────────────────────────── │
│  TA        ┌────────┐  ┌────────┐   FC   ┌────────┐          │
│  * mmHg    └────────┘  └────────┘        └────────┘          │
│                                                              │
│  Notas                                                       │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                                                        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│                                   [ Cancelar ]  [ Guardar ]  │
└──────────────────────────────────────────────────────────────┘
```

- Una columna para texto libre y notas (≤ 68ch). Dos columnas para campos estructurados y pares de valores (p. ej. presión sistólica/diastólica).
- Campos obligatorios marcados en el rótulo; el resumen de errores va arriba del formulario, con foco al primer campo inválido.
- Acciones primarias abajo a la derecha, una sola por pantalla.

### 4.5 Movimiento

| Token | Duración | Uso |
|---|---|---|
| `--m-fast` | 120ms | Hover, press, cambio de foco. |
| `--m-base` | 180ms | Aparición de chips, expansión de filas, toasts. |
| `--m-overlay` | 240ms | Modales, drawers, paneles. |

Curva: `cubic-bezier(0.2, 0.8, 0.2, 1)`.
- Se animan **cambios de estado**, no entradas decorativas. Sin *fade-and-slide* por sección, sin hover en cada tarjeta.
- `prefers-reduced-motion` desactiva transiciones y animaciones. Regla obligatoria.

### 4.6 Íconos e imágenes

- Set de trazo coherente (p. ej. Lucide), **trazo 1.75px**, tamaños **16 / 20 / 24**. El ícono hereda el color del texto salvo que comunique estado.
- Todo estado lleva ícono + texto (§3.3). Ícono solo, únicamente en acciones universales con `aria-label` y tooltip.
- **Sin ilustraciones decorativas.** Si hace falta una imagen, es una foto clínica, un diagrama anatómico o un gráfico de datos. Nunca *blobs*, nunca ilustraciones de personas sonriendo, nunca degradados como relleno.

---

## 5. La pieza que firma el sistema: valor con banda de referencia

Es el componente que ningún dashboard genérico tiene y que el trabajo clínico necesita: un número **situado** respecto de su rango normal. Se usa para constantes vitales y resultados de laboratorio.

```
Hemoglobina                                             13,4 g/dL
                                                        ▲ dentro de rango

        bajo  ├───────────────●──────────────────────┤  alto
              10       12,0          14        17,5     18
                        └────── rango de referencia ──────┘
```

**Anatomía**

| Parte | Función |
|---|---|
| Rótulo | Nombre clínico de la medición. |
| Valor | Número en `--value`, cifras tabulares, con unidad siempre visible. |
| Banda | Línea horizontal con el tramo del rango de referencia resaltado. |
| Marcador | Posición del valor dentro del eje. |
| Estado | Texto explícito: *dentro de rango*, *por encima*, *por debajo*, *crítico*. |
| Tendencia (opcional) | Flecha y delta respecto de la última medición. |

**Estados y color**

| Estado | Color | Cuándo |
|---|---|---|
| Dentro de rango | `--c-ok` | El valor cae en el tramo de referencia. |
| Límite | `--c-warn` | Próximo al borde o fuera pero no crítico. |
| Fuera de rango | `--c-danger` | Fuera del rango, sin riesgo inmediato. |
| Crítico | `--c-critical` | Umbral que exige aviso y acción (§7.4). |
| Sin dato / pendiente | `--c-ink-muted` | Aún no cargado. |

**Reglas**

- La unidad nunca se omite y nunca se repite en cada fila de una misma tabla: va en el encabezado de la columna o en el valor, no en ambos.
- El estado se escribe. El color es refuerzo, no el mensaje.
- El eje es estable dentro de una misma serie: si dos valores de la misma medición se comparan, comparten escala.
- Sin dato es un estado de primera clase, no un vacío. Se muestra "Sin dato" y cuándo se espera.

---

## 6. Componentes

Cada componente lista su anatomía, estados y reglas duras. Estados base de todo interactivo: `default`, `hover`, `focus-visible`, `active`, `disabled`, `loading`, `error` (cuando aplica).

### 6.1 Botones

| Variante | Uso | Apariencia |
|---|---|---|
| `primary` | La acción principal de la pantalla. Una sola. | Fondo `--c-brand`, texto `--c-on-brand`. |
| `secondary` | Acciones alternativas, filtros. | Fondo `--c-surface`, borde `--c-line-strong`, texto `--c-ink`. |
| `tertiary` / `ghost` | Acciones terciarias, dentro de tablas. | Sin borde; fondo al hover. |
| `danger` | Acción destructiva o irreversible. | Fondo `--c-danger`. Requiere confirmación (§7.5). |

- Alto `--control-h` (36px) mínimo; **44px** en contextos táctiles.
- El verbo es el mismo a lo largo del flujo: el botón que dice **Guardar** produce el aviso **Guardado**.
- Estado `loading`: se conserva el ancho, se reemplaza el contenido por un indicador; nunca se deshabilita en silencio.

### 6.2 Campos de entrada

- Alto 36px, radio `--r-xs`, borde `--c-line-strong`, foco con anillo `--c-brand` de 2px y offset 2px.
- **Rótulo siempre visible arriba** del campo. El *placeholder* es un ejemplo, nunca el rótulo.
- Ayuda debajo del campo; error reemplaza la ayuda, en `--c-danger`, con ícono y texto.
- **Obligatorio** marcado en el rótulo; nunca con un asterisco sin leyenda.
- Tipos específicos: fecha, fecha/hora, selección, búsqueda, numérico con unidad. Un campo numérico muestra su unidad y su rango válido.

### 6.3 Chips y estados

- Chip de estado = **ícono + texto + color**. Forma de píldora, `--r-xs`, alto 24px, texto `meta`.
- Chips semánticos: *Estable / En observación / Crítico*, *Normal / Fuera de rango / Pendiente*, *Borrador / Firmado / Anulado*.
- No se usan chips como decoración ni como etiquetas de categorías arbitrarias.

### 6.4 Tablas

- Encabezado sobre `--c-surface-sunk`, texto `meta` en `--c-ink-soft`.
- Filas de `--row-h` (40px cómodo / 32px compacto). Separadores horizontales de 1px; sin bordes verticales salvo que las columnas necesiten agruparse.
- Números a la derecha, cifras tabulares. Texto a la izquierda.
- Columna de estado fija y visible; orden y filtros en el encabezado.
- Fila seleccionada con fondo `--c-brand-soft` y barra izquierda de marca de 2px.
- **Paginación** o scroll virtual; nunca una tabla sin fin.
- Encabezado pegajoso en tablas largas.

### 6.5 Alertas y avisos

| Tipo | Presentación | Uso |
|---|---|---|
| Inline (`info`) | Banda `--c-info-bg`, borde izquierdo 3px, ícono | Contexto, ayuda, reglas del sistema. |
| Advertencia (`warn`) | Banda `--c-warn-bg`, borde izquierdo | Algo puede salir mal; el usuario puede continuar. |
| Error de campo | Bajo el campo, `--c-danger` | Validación. |
| Error de formulario | Resumen arriba + foco al primer error | Envío rechazado. |
| Crítico | Banda de página completa `--c-critical-bg`, borde superior 4px, no descartable hasta acusar recibo | Valor crítico o riesgo inmediato (§7.4). |

- Una alerta dice **qué pasó y qué hacer**, en la voz del sistema. No se disculpa, no es vaga.
- El color del borde va acompañado de ícono y título.

### 6.6 Superposiciones

- **Modal / diálogo:** radio `--r-md`, `--e-overlay`, foco atrapado, cierre con `Esc`, `aria-modal`. Ancho máximo 560px.
- **Drawer:** 320px, para detalle sin perder el contexto de la pantalla.
- **Popover / tooltip:** `--e-popover`. El tooltip nunca contiene información indispensable.
- **Toast:** esquina inferior derecha, `--m-base`, se anuncia con `role="status"`. Confirma una acción; no es un canal de errores.

### 6.7 Navegación y estructura

- **Riel lateral** con el módulo activo marcado por fondo + texto en `--c-ink` y barra de marca.
- **Pestañas** para secciones de una misma entidad (Resumen / Notas / Estudios). Subrayado de marca en la activa.
- **Migas** solo cuando la jerarquía tiene tres o más niveles reales.
- **Pasos (stepper)** solo si el contenido **es una secuencia** (p. ej. validación → firma → registro). No se numera lo que no es secuencial.

### 6.8 Retroalimentación y carga

- **Skeleton** con la forma del contenido real, no *spinners* de página completa.
- **Vacío:** ícono discreto, una frase que explica qué falta y una acción. *"Sin estudios cargados. Cargá el primero para ver resultados."*
- **Error de red:** estado persistente, con reintento y marca de última sincronización. Relevante en guardia y conectividad mala.

---

## 7. Patrones clínicos

### 7.1 Banda de identidad de la persona

El elemento de seguridad más importante de un sistema clínico. Debe estar presente en todo contexto que muestre datos de una persona.

```
┌────────────────────────────────────────────────────────────────────────────┐
│  PÉREZ, Lucía              F · 34 años · DNI 31.234.567 · HC 88-4120        │
│  ────────────────────────────────────────────────────────────────────────  │
│  O+ Rh(D) positivo     ⚠ Alergia: penicilina            ● Estable          │
└────────────────────────────────────────────────────────────────────────────┘
```

- **Apellido primero**, en `display`, porque es como se busca y se lee en el entorno clínico.
- Identificadores en monoespaciada. Edad calculada, no fecha de nacimiento cruda (la fecha queda en tooltip).
- Alergias siempre visibles cuando existen; en `--c-danger` si son graves.
- Estado clínico actual como chip semántico.
- La banda es pegajosa y de alto contraste. Nunca se comprime hasta perder un identificador.

### 7.2 Búsqueda de persona

- Campo de búsqueda primero en la pantalla, con foco automático y soporte de lector de código de barras (el campo acepta ráfagas de teclado y termina con Enter).
- Acepta **un identificador o nombre**: DNI, número de historia, nombre y apellido.
- Resultados como lista densa, con identificadores a la izquierda y estado a la derecha.
- Cero resultados: estado vacío con la acción de alta cuando corresponda.

### 7.3 Carga con validación

- Validación al salir del campo y al enviar. No se valida mientras se escribe.
- El resumen de errores lleva foco al primer campo inválido.
- El sistema **no permite guardar con obligatorios incompletos** y dice cuáles faltan.
- Guardado con confirmación explícita; en formularios largos, borrador automático visible.

### 7.4 Valores críticos

- Un valor crítico no se muestra como un número en rojo: dispara una banda `--c-critical` con la conducta esperada y exige acuse de recibo.
- Se registra en la auditoría quién acusó recibo y cuándo.
- Nunca se resuelve con un color solo. Ícono, título, texto y acción.

### 7.5 Acciones irreversibles

- Confirmación explícita con el **nombre del objeto** y la consecuencia ("Anular la receta de Pérez, Lucía"). Se escribe el objeto, no "el registro".
- Cuando la acción es de alto impacto, se pide reingresar el dato o confirmar con texto.
- El botón destructivo no es el que recibe el foco inicial.

### 7.6 Trazabilidad y auditoría

- Toda entidad muestra **quién, qué y cuándo**, en monoespaciada para la marca temporal.
- La vista de auditoría es una línea de tiempo; los cambios se leen como diferencias, no como volcados.
- El historial es de solo lectura y no se edita.

### 7.7 Permisos y roles

- Un elemento sin permiso se **oculta** si su existencia no es relevante, o se muestra **deshabilitado con motivo** si el usuario necesita saber que existe.
- Nunca un error genérico tras intentar la acción: el estado se comunica antes.
- La vista de solo lectura (áreas externas) es una variante del mismo componente, no una pantalla aparte.

### 7.8 Impresión y exportación

- Constancias, informes y certificados tienen una hoja de estilo de impresión propia: sin navegación, sin sombras, alto contraste, encabezado con la identidad de la institución y pie con la marca temporal y el operador.
- El PDF exportado usa la misma tipografía y jerarquía que la pantalla.

---

## 8. Accesibilidad

Objetivo: **WCAG 2.2 AA**, y donde el riesgo clínico lo exige, más.

- **Contraste:** ≥ 4,5:1 en texto normal, ≥ 3:1 en texto grande, íconos y bordes de control. Verificar en tema claro y oscuro.
- **Nunca color solo** (§3.3).
- **Foco visible** siempre: anillo de 2px `--c-brand` con offset 2px. En superficies de marca, anillo claro.
- **Objetivos táctiles** ≥ 44×44px en dispositivos táctiles.
- **Teclado:** todo alcanzable y operable; orden lógico; `Esc` cierra superposiciones; el foco vuelve al disparador.
- **Escalado de texto** hasta 200% sin pérdida de contenido ni solapamiento.
- **Formularios:** cada campo con rótulo asociado; errores anunciados con `role="alert"`; estado obligatorio en el texto.
- **Tablas:** encabezados con `scope`; resumen para lectores de pantalla cuando la tabla es grande.
- **Movimiento:** `prefers-reduced-motion` respetado; sin parpadeos; animaciones > 5s, ninguna.
- **Alto contraste / forzado de color:** la interfaz no depende de imágenes de fondo ni de degradados.

---

## 9. Contenido y voz

La escritura es parte del sistema. Una interfaz clínica se escribe como se escribe una indicación: clara, breve, sin ambigüedad.

- **Voz activa.** *"Guardar cambios"*, no *"Enviar"*. El botón dice qué hace.
- **Nombrar desde el usuario.** *"Estudios"*, no *"módulo de determinaciones"*. Término clínico que la persona reconoce.
- **Una acción, un nombre, en todo el flujo.** El botón *Firmar* produce *"Firmado"*.
- **Oración simple, sin relleno.** Se corta todo lo que no ayude a decidir o actuar.
- **Errores:** qué pasó y cómo seguir. *"La fecha de nacimiento no puede ser futura. Corregila para continuar."* Sin disculpas, sin vaguedad.
- **Vacíos:** invitan a actuar. *"Sin resultados para este filtro. Quitá el filtro de fecha o buscá por DNI."*
- **Confirmaciones:** dicen qué ocurrió y qué sigue.
- **Unidades y formatos:** unidad siempre visible; fecha `DD/MM/AAAA`; hora 24h; separador decimal coma (es-AR); miles con punto.
- **Vocabulario prohibido en la interfaz:** "hacer clic", "por favor", "lo sentimos", "¡Ups!", "usuario" cuando se puede nombrar el rol, y cualquier jerga técnica interna.

---

## 10. Guardarraíles: lo que este sistema no hace

Recopilado porque son los valores por defecto que este sistema **rechaza** deliberadamente, y conviene saberlo al construir.

- ❌ **Fondo crema cálido + serif de alto contraste + acento terracota.** El paquete "cálido-editorial" que se ve en cualquier brief.
- ❌ **Fondo casi negro + un único acento ácido.** El "modo oscuro de herramienta de IA".
- ❌ **Estética de diario: filetes finísimos, radio cero, columnas densas.** La densidad se usa para datos, no como disfraz tipográfico.
- ❌ **Kit SaaS: todo en tarjetas redondeadas idénticas, mismo radio para todo, misma sombra gris debajo, degradados como decoración.** Acá la jerarquía se construye con estructura, borde y fondo.
- ❌ **Cromo de plantilla:** rótulos en versalitas sobre cada título, metadatos unidos con puntos medios, etiquetas tipo "PALABRA — fragmento", monoespaciada en todo, flecha "→" pegada a cada enlace.
- ❌ **El azul médico por defecto** (`#2563EB` y familia) y el **rojo de sangre sobre blanco**.
- ❌ **Color decorativo.** Si un color no significa, no va.
- ❌ **Degradados** como relleno de marca. La marca es un color plano.
- ❌ **Ilustraciones de personas, *blobs* y formas orgánicas** como relleno.
- ❌ **Animación de entrada por sección** y hover en cada elemento.
- ❌ **Números "grandes con etiqueta chica" y estadísticas decorativas** sin función clínica.

### Antes de dar una pantalla por terminada

1. ¿Cuál es la acción principal y es la única primaria visible?
2. ¿Se ve, sin buscarla, la identidad de la persona y su estado?
3. ¿Algún color está ahí sin significar algo?
4. ¿Todo valor tiene unidad y, si corresponde, su rango?
5. ¿Todo estado tiene color **más** ícono **más** texto?
6. ¿Se puede operar con teclado y ver el foco?
7. ¿Sobra algún elemento? Sacar uno.

---

## 11. Implementación

### 11.1 Tokens

Un solo bloque de variables para la aplicación; el tema oscuro sobreescribe, no duplica.

```css
:root {
  /* Color */
  --c-paper:        #F4F6F6;
  --c-surface:      #FFFFFF;
  --c-surface-sunk: #E9EEEE;
  --c-line:         #D6DEDD;
  --c-line-strong:  #BFCAC8;
  --c-ink:          #16211F;
  --c-ink-soft:     #3C4A48;
  --c-ink-muted:    #5C6B68;
  --c-ink-inverse:  #FFFFFF;
  --c-brand:        #0F5449;
  --c-brand-strong: #0A3B33;
  --c-brand-soft:   #E2EFEC;
  --c-on-brand:     #FFFFFF;
  --c-ok:           #1C7A45;  --c-ok-bg:       #E6F3EA;
  --c-warn:         #946200;  --c-warn-bg:     #FAF0DA;
  --c-danger:       #B02A2F;  --c-danger-bg:   #FBE9EA;
  --c-critical:     #7A0E14;  --c-critical-bg: #F7DFE0;
  --c-info:         #0F5449;  --c-info-bg:     #E2EFEC;

  /* Tipografía */
  --font-ui:   "Archivo", system-ui, sans-serif;
  --font-data: "IBM Plex Mono", ui-monospace, monospace;

  /* Espacio, forma, elevación, movimiento */
  --s-1: 4px;  --s-2: 8px;  --s-3: 12px; --s-4: 16px;
  --s-5: 20px; --s-6: 24px; --s-8: 32px; --s-10: 40px;
  --s-12: 48px; --s-16: 64px;
  --r-xs: 2px; --r-sm: 4px; --r-md: 6px;
  --e-overlay: 0 8px 24px rgba(16, 33, 31, 0.12);
  --e-popover: 0 2px 8px rgba(16, 33, 31, 0.10);
  --row-h: 40px; --control-h: 36px;
  --m-fast: 120ms; --m-base: 180ms; --m-overlay: 240ms;
  --m-ease: cubic-bezier(0.2, 0.8, 0.2, 1);

  /* Ancho de lectura */
  --measure: 68ch;
  --content-max: 1120px;
}
```

### 11.2 Reglas de código

- **Ningún valor literal** de color, espacio o radio fuera de los tokens. Si falta un token, se discute y se agrega; no se improvisa.
- Cifras tabulares en toda columna de datos: `font-variant-numeric: tabular-nums;`.
- Foco estandarizado en un único estilo global; no se redefine por componente.
- El estado se comunica con atributos (`aria-*`, `data-state`), no solo con clases de color.
- Preferir borde y fondo antes que `box-shadow`. La sombra es una excepción justificada.
- Cada componente documenta sus estados en la tabla de la sección 6 antes de implementarse.

### 11.3 Nomenclatura

- Tokens: `--{categoría}-{rol}[-{variante}]` → `--c-danger`, `--c-danger-bg`, `--s-4`.
- Componentes: sustantivo en singular → `PatientBanner`, `ValueRange`, `StatusChip`.
- Variantes por prop semántica, no por apariencia → `variant="danger"`, no `variant="red"`.

---

## 12. Estado de la propuesta

Decisiones abiertas para la próxima revisión:

- **Nombre y logotipo** de `Constantes` (el logotipo usa Archivo Expandida; falta resolver la marca gráfica).
- **Set de íconos** definitivo y su licencia.
- **Modo oscuro**: definir si es por preferencia del sistema o por turno.
- **Componentes de datos** (gráficos de series temporales, tablas de resultados de laboratorio) merecen su propia especificación, con el componente de §5 como base.
- **Verificación de contraste** de todos los pares texto/fondo en claro y oscuro, con medición, no estimación.
