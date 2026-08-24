import { useEffect, useRef } from 'react'

/* ---------------------------------------------------------------------------
 * Code river
 *
 * The page background: rows of monospace glyphs drifting sideways in three
 * layers, each at its own speed, every row riding a sine wave so the current
 * visibly bends the text. Sideways and slow is what keeps it reading as a
 * river instead of falling code.
 *
 * The canvas is fixed behind the page and holds the same opacity from top to
 * bottom, so the whole site reads as one surface. Glyphs are painted
 * once into an atlas and copied from there. A frame is a couple thousand
 * drawImage calls, which is cheap, where the same count of fillText is not.
 * ------------------------------------------------------------------------- */

const GLYPHS = '{}()[]<>/\\=+-*;:.,_|#$&%!?01'

const FG = '#f2f3f0'
const BRAND = '#d4f34a'

/** Horizontal advance per glyph, as a multiple of its font size. Wider than
 * the font's own advance: spaced-out glyphs read as current, packed ones as
 * a wall of text. */
const ADVANCE = 1.8

/** Cell height, as a multiple of font size. Wide enough for descenders. */
const CELL_H = 1.6

/** Half of a 60Hz budget. The drift is slow enough that nothing steps. */
const FRAME_MS = 1000 / 30

type LayerSpec = {
  /** Font size in px. */
  size: number
  /** Sideways drift, px per second. */
  speed: number
  /** Opacity of the whole layer. */
  alpha: number
  /** Wave amplitude in px. */
  amp: number
  /** Wave frequency per px of width. */
  freq: number
  /** Row spacing, as a multiple of font size. */
  gap: number
  /** Share of glyphs painted in the brand color. */
  accent: number
}

/* Back to front: the far layer is small, slow and faint, the near one is
 * larger, quicker and carries the few lime glyphs that catch the eye. */
const LAYERS: LayerSpec[] = [
  { size: 11, speed: 7, alpha: 0.038, amp: 12, freq: 0.0034, gap: 5.5, accent: 0 },
  { size: 14, speed: 13, alpha: 0.05, amp: 18, freq: 0.0029, gap: 6, accent: 0.009 },
  { size: 18, speed: 22, alpha: 0.062, amp: 26, freq: 0.0024, gap: 6.5, accent: 0.016 },
]

type Atlas = {
  fg: HTMLCanvasElement
  brand: HTMLCanvasElement
  cellW: number
  cellH: number
}

type Row = {
  layer: number
  y: number
  phase: number
  glyphs: Uint8Array
  accent: Uint8Array
}

function mod(n: number, m: number) {
  return ((n % m) + m) % m
}

function paintAtlas(size: number, dpr: number, color: string, cellW: number, cellH: number) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(cellW * GLYPHS.length * dpr)
  canvas.height = Math.ceil(cellH * dpr)

  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  ctx.scale(dpr, dpr)
  ctx.font = `${size}px "JetBrains Mono Variable", ui-monospace, monospace`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = color

  for (let i = 0; i < GLYPHS.length; i++) {
    ctx.fillText(GLYPHS[i], (i + 0.5) * cellW, cellH / 2)
  }

  return canvas
}

export function CodeRiver() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let disposed = false
    let raf = 0
    let width = 0
    let height = 0
    let dpr = 1
    let atlases: Atlas[] = []
    let rows: Row[] = []
    let start = 0
    let last = 0
    let hiddenAt = 0

    const build = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight

      canvas.width = Math.ceil(width * dpr)
      canvas.height = Math.ceil(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      atlases = LAYERS.map((layer) => {
        const cellW = layer.size * ADVANCE
        const cellH = layer.size * CELL_H
        return {
          fg: paintAtlas(layer.size, dpr, FG, cellW, cellH),
          brand: paintAtlas(layer.size, dpr, BRAND, cellW, cellH),
          cellW,
          cellH,
        }
      })

      rows = []
      LAYERS.forEach((layer, index) => {
        const step = layer.size * layer.gap
        // A generous surplus over what fits on screen: the row wraps around
        // its own glyphs, and a longer strip pushes the repeat out of sight.
        const len = Math.ceil(width / (layer.size * ADVANCE)) + 64

        for (let y = -step; y < height + step; y += step) {
          const glyphs = new Uint8Array(len)
          const accent = new Uint8Array(len)

          for (let i = 0; i < len; i++) {
            glyphs[i] = Math.floor(Math.random() * GLYPHS.length)
            accent[i] = Math.random() < layer.accent ? 1 : 0
          }

          rows.push({
            layer: index,
            y: y + Math.random() * step * 0.4,
            phase: Math.random() * 1000,
            glyphs,
            accent,
          })
        }
      })
    }

    const draw = (t: number) => {
      ctx.clearRect(0, 0, width, height)

      for (const row of rows) {
        const layer = LAYERS[row.layer]
        const atlas = atlases[row.layer]

        const base = layer.alpha
        const accentAlpha = Math.min(0.5, base * 5)

        const cols = Math.ceil(width / atlas.cellW) + 2
        const drift = t * layer.speed + row.phase * 10
        const cells = Math.floor(drift / atlas.cellW)
        const offset = drift % atlas.cellW
        const wave = t * 0.55 + row.phase

        const srcW = atlas.cellW * dpr
        const srcH = atlas.cellH * dpr

        ctx.globalAlpha = base

        for (let i = -1; i < cols; i++) {
          const x = i * atlas.cellW + offset
          const index = mod(i - cells, row.glyphs.length)
          const y = row.y + Math.sin(x * layer.freq + wave) * layer.amp - atlas.cellH / 2

          if (row.accent[index]) {
            ctx.globalAlpha = accentAlpha
            ctx.drawImage(
              atlas.brand,
              row.glyphs[index] * srcW,
              0,
              srcW,
              srcH,
              x,
              y,
              atlas.cellW,
              atlas.cellH,
            )
            ctx.globalAlpha = base
            continue
          }

          ctx.drawImage(
            atlas.fg,
            row.glyphs[index] * srcW,
            0,
            srcW,
            srcH,
            x,
            y,
            atlas.cellW,
            atlas.cellH,
          )
        }
      }

      ctx.globalAlpha = 1
    }

    const tick = (now: number) => {
      if (disposed) return

      if (start === 0) {
        start = now
        last = now - FRAME_MS
      }

      raf = requestAnimationFrame(tick)

      if (now - last < FRAME_MS) return
      last = now

      draw((now - start) / 1000)
    }

    let resizeTimer = 0
    const onResize = () => {
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(() => {
        if (disposed) return
        build()
        if (reduced) draw(0)
      }, 150)
    }

    // Pausing while hidden also means the clock would jump on return, which
    // would teleport the river. Push `start` forward by the time we missed.
    const onVisibility = () => {
      if (reduced) return

      if (document.hidden) {
        hiddenAt = performance.now()
        cancelAnimationFrame(raf)
        raf = 0
        return
      }

      if (hiddenAt !== 0) {
        const away = performance.now() - hiddenAt
        start += away
        last += away
        hiddenAt = 0
      }

      if (raf === 0) raf = requestAnimationFrame(tick)
    }

    const init = () => {
      if (disposed) return

      build()

      if (reduced) {
        draw(0)
        return
      }

      raf = requestAnimationFrame(tick)
    }

    // Building the atlas before JetBrains Mono lands would bake the fallback
    // font into every glyph, so wait for it.
    if (document.fonts) {
      document.fonts.ready.then(init)
    } else {
      init()
    }

    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      window.clearTimeout(resizeTimer)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  )
}
