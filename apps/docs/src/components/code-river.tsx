import { useEffect, useRef } from 'react'

/* ---------------------------------------------------------------------------
 * O rio de codigo
 *
 * O fundo da pagina: fileiras de glifos monoespacados derivando de lado em tres
 * camadas, cada uma na sua velocidade, cada fileira montada numa senoide para a
 * correnteza dobrar o texto de forma visivel. De lado e devagar e o que mantem
 * a leitura de rio, em vez de codigo caindo.
 *
 * O canvas fica preso atras da pagina e guarda a mesma opacidade de cima a
 * baixo, para o site inteiro ler como uma superficie so. Os glifos sao pintados
 * uma vez num atlas e copiados de la. Um quadro sao alguns milhares de chamadas
 * de `drawImage`, que sai barato, onde a mesma conta em `fillText` nao sai.
 * ------------------------------------------------------------------------- */

const GLYPHS = '{}()[]<>/\\=+-*;:.,_|#$&%!?01'

const FG = '#f2f3f0'
const BRAND = '#d4f34a'

/** Avanco horizontal por glifo, em multiplos do tamanho da fonte. Maior que o
 * avanco da propria fonte: glifo espacado le como correnteza, glifo colado le
 * como parede de texto. */
const ADVANCE = 1.8

/** Altura da celula, em multiplos do tamanho da fonte. Cabe o que desce. */
const CELL_H = 1.6

/** Metade do orcamento de 60Hz. A deriva e lenta o bastante para nada pular. */
const FRAME_MS = 1000 / 30

type LayerSpec = {
  /** Tamanho da fonte, em px. */
  size: number
  /** Deriva lateral, em px por segundo. */
  speed: number
  /** Opacidade da camada inteira. */
  alpha: number
  /** Amplitude da onda, em px. */
  amp: number
  /** Frequencia da onda, por px de largura. */
  freq: number
  /** Espaco entre fileiras, em multiplos do tamanho da fonte. */
  gap: number
  /** Que fatia dos glifos sai na cor da marca. */
  accent: number
}

/* Do fundo para a frente: a camada longe e pequena, lenta e apagada; a de perto
 * e maior, mais rapida e carrega os poucos glifos limao que puxam o olho. */
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
        // Uma folga generosa sobre o que cabe na tela: a fileira da a volta
        // nos proprios glifos, e uma tira mais longa empurra a repeticao para
        // fora do campo de visao.
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

    // Pausar com a aba escondida tambem quer dizer que o relogio saltaria na
    // volta, e isso teleportaria o rio. Empurre o `start` para a frente pelo
    // tempo que ficamos fora.
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

    // Montar o atlas antes de a JetBrains Mono chegar assaria a fonte de
    // reserva em cada glifo, entao espere por ela.
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
