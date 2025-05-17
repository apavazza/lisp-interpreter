export type LispAtom = string | number | boolean
export type LispList = LispValue[]
export type LispFunction = (...args: LispValue[]) => LispValue
export type LispValue = LispAtom | String | LispList | LispFunction | null | undefined