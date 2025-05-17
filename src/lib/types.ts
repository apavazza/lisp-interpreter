export type LispAtom = string | number | boolean
export type LispList = LispValue[]
export type LispFunction = (...args: LispValue[]) => LispValue
// eslint-disable-next-line @typescript-eslint/no-wrapper-object-types
export type LispValue = LispAtom | String | LispList | LispFunction | null | undefined