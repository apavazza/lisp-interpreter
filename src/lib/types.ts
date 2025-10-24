export type LispAtom = string | number | boolean
export type LispList = LispValue[]
export type LispFunction = (...args: LispValue[]) => LispValue
export type LispDottedPair = { car: LispValue, cdr: LispValue, __dotted_pair: true }
export type LispRational = { num: number, den: number, __rational: true }
export type LispString = { __string: string }
export type LispValue = LispAtom | LispString | LispList | LispFunction | LispDottedPair | LispRational | null | undefined