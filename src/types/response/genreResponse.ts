export interface GenreResponse<T=unknown> {
  code: number
  message: string
  data: T|string|number|boolean|[]|null
}
