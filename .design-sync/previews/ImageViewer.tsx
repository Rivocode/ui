import { Button, ImageViewer, type ImageViewerImage } from '@rivocode/ui'
import { useState } from 'react'

function photo(hue: number, title: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${hue} 45% 62%)"/>
      <stop offset="1" stop-color="hsl(${hue + 40} 50% 28%)"/>
    </linearGradient></defs>
    <rect width="1200" height="800" fill="url(#g)"/>
    <circle cx="900" cy="220" r="110" fill="hsl(${hue + 20} 70% 85%)" opacity="0.7"/>
    <path d="M0 640 L320 380 L560 580 L780 420 L1200 700 L1200 800 L0 800 Z" fill="hsl(${hue + 60} 35% 18%)"/>
    <text x="60" y="110" font-family="sans-serif" font-size="56" fill="white">${title}</text>
  </svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

const PHOTOS: ImageViewerImage[] = [
  { src: photo(200, 'Fachada'), alt: 'Fachada do prédio comercial', caption: 'Fachada, vista da avenida' },
  { src: photo(30, 'Recepção'), alt: 'Recepção com balcão de madeira', caption: 'Recepção no térreo' },
  { src: photo(140, 'Sala 1'), alt: 'Sala de reunião com mesa para oito pessoas' },
  { src: photo(260, 'Sala 2'), alt: 'Sala de trabalho com seis estações' },
  { src: photo(330, 'Copa'), alt: 'Copa com geladeira e micro-ondas', caption: 'Copa compartilhada' },
  { src: photo(90, 'Terraço'), alt: 'Terraço com vista para o parque' },
]

/** Grade de miniaturas */
export function Gallery() {
  return <ImageViewer images={PHOTOS} className="max-w-xl" />
}

/** Em volta, da última volta à primeira */
export function Looping() {
  return <ImageViewer images={PHOTOS.slice(0, 3)} loop className="max-w-xs" />
}

/** Controlado, aberto por outro botão */
export function Controlled() {
  const [index, setIndex] = useState<number | null>(null)

  return (
    <div className="flex items-center gap-3">
      <Button variant="secondary" onClick={() => setIndex(0)}>
        Ver as {PHOTOS.length} fotos
      </Button>
      <ImageViewer
        images={PHOTOS}
        thumbnails={false}
        index={index}
        onIndexChange={setIndex}
      />
    </div>
  )
}
