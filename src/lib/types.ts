export type LispAtom = string | number | boolean
export type LispList = LispValue[]
export type LispFunction = (...args: LispValue[]) => LispValue
// eslint-disable-next-line @typescript-eslint/no-wrapper-object-types
export type LispDottedPair = { car: LispValue, cdr: LispValue, __dotted_pair: true }
export type LispValue = LispAtom | String | LispList | LispFunction | LispDottedPair | null | undefined