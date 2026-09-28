import { Pagination } from '@rivocode/ui'

/** With ellipsis */
export function WithEllipsis() {
  return <Pagination page={5} pageCount={12} onPageChange={() => {}} />
}

/** Short list */
export function ShortList() {
  return <Pagination page={1} pageCount={3} onPageChange={() => {}} />
}
