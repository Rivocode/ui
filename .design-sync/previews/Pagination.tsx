import { Pagination } from '@rivocode/ui'

export function ComReticencia() {
  return <Pagination page={5} pageCount={12} onPageChange={() => {}} />
}

export function ListaCurta() {
  return <Pagination page={1} pageCount={3} onPageChange={() => {}} />
}
