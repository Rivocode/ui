import { Pagination } from '@rivocode/ui'

/** Com reticência */
export function WithEllipsis() {
  return <Pagination page={5} pageCount={12} onPageChange={() => {}} />
}

/** Lista curta */
export function ShortList() {
  return <Pagination page={1} pageCount={3} onPageChange={() => {}} />
}
