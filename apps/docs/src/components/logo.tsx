const WAVE =
  'M29 90.5C45.7 83 95.7 47.8 129 45.5s66.7 15.3 100 31c33.3 15.7 66.8 54.3 100 63c33.2 8.7 65.8 2.7 99-10.5c33.2-13.2 66.7-52.2 100-69c33.3-16.8 83.3-26.7 100-32'

/**
 * O simbolo da RivoCode: tres ondas empilhadas, cada uma mais apagada que a
 * anterior. A mesma geometria da landing page, para a marca nao se afastar
 * entre as duas.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 -1 657 470"
      fill="none"
      role="img"
      aria-label="RivoCode"
      className={className}
    >
      {[
        { opacity: 1, y: 0 },
        { opacity: 0.62, y: 150 },
        { opacity: 0.3, y: 300 },
      ].map(({ opacity, y }) => (
        <path
          key={y}
          d={WAVE}
          transform={`translate(0 ${y})`}
          stroke="currentColor"
          strokeWidth="58"
          strokeLinecap="round"
          opacity={opacity}
        />
      ))}
    </svg>
  )
}
