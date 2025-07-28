export interface IPage<T> {
  size: number
  current: number
  records: T[]
  total: number
}

interface Pagesort{
  empty: boolean
  sorted: boolean
  unsorted: boolean
}

interface Pageable{
  offset: number
  sort: Pagesort
  pageNumber: number
  pageSize: number
  paged: boolean
  unpaged: boolean
}

export interface PageResponse<T> {
  totalElements: number
  totalPages: number
  size: number
  content: T[]
  number: number
  sort: Pagesort
  pageable: Pageable
  first: boolean
  last: boolean
  numberOfElements: number
  empty: boolean
}
