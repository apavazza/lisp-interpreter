export type LispAtom = number | string | boolean | null
export type LispList = LispValue[]
export type LispFunction = (...args: LispValue[]) => LispValue
export type LispValue = LispAtom | LispList | LispFunction