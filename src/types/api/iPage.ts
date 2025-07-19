export interface IPage<T> {
  size: number
  current: number
  records: T[]
  total: number
}
