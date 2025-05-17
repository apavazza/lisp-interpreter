import { LispValue, LispFunction, LispList } from './types'

// Lisp interpreter implementation
export function evaluateLisp(program: string, inputProvider?: () => string): string {
  // Global environment to store variables and functions
  const globalEnv: Record<string, LispValue> = {}

  // Store output separately
  let outputBuffer: string[] = []

  // Tokenize the input
  function tokenize(str: string): string[] {
    const tokens: string[] = []
    let i = 0

    // Skip whitespace and get the next token
    function skipWhitespace() {
      while (i < str.length && /\s/.test(str[i])) {
        i++
      }
    }

    while (i < str.length) {
      skipWhitespace()
      if (i >= str.length) break

      // If the line starts with ';', skip to the end of the line
      if (str.substring(i, i + 2) === ";") {
        while (i < str.length && str[i] !== "\n") {
          i++
        }
        continue
      }

      const char = str[i]

      // Handle quote character specially
      if (char === "'") {
        tokens.push("'")
        i++
        continue
      }

      // Handle parentheses
      if (char === "(" || char === ")") {
        tokens.push(char)
        i++
        continue
      }

      // Handle string literals
      if (char === '"') {
        let j = i + 1
        while (j < str.length && str[j] !== '"') {
          if (str[j] === "\\" && j + 1 < str.length) {
            j += 2 // Skip escaped character
          } else {
            j++
          }
        }
        if (j < str.length) {
          tokens.push(str.substring(i, j + 1))
          i = j + 1
        } else {
          throw new Error("Unterminated string literal")
        }
        continue
      }

      // Handle symbols and numbers
      let j = i
      while (j < str.length && !/[\s()'"]/.test(str[j])) {
        j++
      }

      if (j > i) {
        tokens.push(str.substring(i, j))
        i = j
      }
    }

    return tokens
  }

  // Parse tokens into an abstract syntax tree
  function parse(tokens: string[]): LispValue {
    if (tokens.length === 0) {
      throw new Error("Unexpected EOF")
    }

    const token = tokens.shift()

    // Handle quote special form
    if (token === "'") {
      // Quote is shorthand for (quote ...)
      return ["quote", parse(tokens)]
    }

    if (token === "(") {
      const list: LispValue[] = []
      while (tokens[0] !== ")") {
        if (tokens.length === 0) {
          throw new Error("Missing closing parenthesis")
        }
        list.push(parse(tokens))
      }
      tokens.shift() // Remove the closing parenthesis
      return list
    } else if (token === ")") {
      throw new Error("Unexpected closing parenthesis")
    } else if (token?.startsWith('"') && token.endsWith('"')) {
      // Handle string literals
      return token.slice(1, -1)
    } else {
      // Return atom (number or symbol)
      if (token === "nil") return []
      if (token === "t") return true
      return token !== undefined && isNaN(Number(token)) ? token : Number(token)
    }
  }

  // Create the initial environment with basic operations
  function createEnvironment(currentInputProvider?: () => string): Record<string, LispValue> {
    const env: Record<string, LispValue> = {
      // Arithmetic operations
      "+": (...args: LispValue[]): LispValue => {
        if (!args.every(arg => typeof arg === "number")) {
          throw new Error("+: All arguments must be numbers");
        }
        return (args as number[]).reduce((a, b) => a + b, 0);
      },
      "-": (...args: LispValue[]): LispValue => {
        if (!args.every(arg => typeof arg === "number")) {
          throw new Error("-: All arguments must be numbers");
        }
        const nums = args as number[];
        return nums.length === 1 ? -nums[0] : nums.reduce((a, b, i) => (i === 0 ? a : a - b));
      },
      "*": (...args: LispValue[]): LispValue => {
        if (!args.every(arg => typeof arg === "number")) {
          throw new Error("*: All arguments must be numbers");
        }
        return (args as number[]).reduce((a, b) => a * b, 1);
      },
      "/": (...args: LispValue[]): LispValue => {
        if (!args.every(arg => typeof arg === "number")) {
          throw new Error("/: All arguments must be numbers");
        }
        const nums = args as number[];
        return nums.length === 1 ? 1 / nums[0] : nums.reduce((a, b, i) => (i === 0 ? a : a / b));
      },
      mod: (...args: LispValue[]): LispValue => {
        if (args.length !== 2) throw new Error("mod: Expected exactly 2 arguments");
        const [a, b] = args;
        if (typeof a !== "number" || typeof b !== "number") {
          throw new Error("mod: Both arguments must be numbers");
        }
        return a % b;
      },

      // Comparison operations
      ">": (...args: LispValue[]): LispValue => {
        if (args.length !== 2) throw new Error(">: Expected exactly 2 arguments");
        const [a, b] = args;
        if (typeof a !== "number" || typeof b !== "number") {
          throw new Error(">: Both arguments must be numbers");
        }
        return a > b;
      },
      "<": (...args: LispValue[]): LispValue => {
        if (args.length !== 2) throw new Error("<: Expected exactly 2 arguments");
        const [a, b] = args;
        if (typeof a !== "number" || typeof b !== "number") {
          throw new Error("<: Both arguments must be numbers");
        }
        return a < b;
      },
      ">=": (...args: LispValue[]): LispValue => {
        if (args.length !== 2) throw new Error(">=: Expected exactly 2 arguments");
        const [a, b] = args;
        if (typeof a !== "number" || typeof b !== "number") {
          throw new Error(">=: Both arguments must be numbers");
        }
        return a >= b;
      },
      "<=": (...args: LispValue[]): LispValue => {
        if (args.length !== 2) throw new Error("<=: Expected exactly 2 arguments");
        const [a, b] = args;
        if (typeof a !== "number" || typeof b !== "number") {
          throw new Error("<=: Both arguments must be numbers");
        }
        return a <= b;
      },
      "=": (...args: LispValue[]): LispValue => {
        if (args.length !== 2) throw new Error("=: Expected exactly 2 arguments");
        const [a, b] = args;
        if (typeof a !== "number" || typeof b !== "number") {
          throw new Error("=: Both arguments must be numbers");
        }
        return a === b;
      },

      // List operations – all use variadic parameters
      car: (...args: LispValue[]): LispValue => {
        if (args.length !== 1) throw new Error("car: Expected exactly 1 argument");
        const list = args[0];
        if (!Array.isArray(list)) throw new Error("car: Expected list");
        if (list.length === 0) throw new Error("car: Empty list");
        return list[0];
      },
      cdr: (...args: LispValue[]): LispValue => {
        if (args.length !== 1) throw new Error("cdr: Expected exactly 1 argument");
        const list = args[0];
        if (!Array.isArray(list)) throw new Error("cdr: Expected list");
        if (list.length === 0) throw new Error("cdr: Empty list");
        return list.slice(1);
      },
      rest: (...args: LispValue[]): LispValue => {
        if (args.length !== 1) throw new Error("rest: Expected exactly 1 argument");
        const list = args[0];
        if (!Array.isArray(list)) throw new Error("rest: Expected list");
        if (list.length === 0) throw new Error("rest: Empty list");
        return list.slice(1);
      },
      cons: (...args: LispValue[]): LispValue => {
        if (args.length !== 2) throw new Error("cons: Expected exactly 2 arguments");
        const [item, list] = args;
        if (!Array.isArray(list)) throw new Error("cons: Second argument must be a list");
        return [item, ...list];
      },
      list: (...args: LispValue[]): LispValue => args,
      append: (...args: LispValue[]): LispValue => {
        if (!args.every(arg => Array.isArray(arg))) {
          throw new Error("append: All arguments must be lists");
        }
        return (args as LispList[]).reduce((acc, list) => [...acc, ...list], []);
      },
      reverse: (...args: LispValue[]): LispValue => {
        if (args.length !== 1) throw new Error("reverse: Expected exactly 1 argument");
        const list = args[0];
        if (!Array.isArray(list)) throw new Error("reverse: Expected list");
        return [...list].reverse();
      },
      nth: (...args: LispValue[]): LispValue => {
        if (args.length !== 2) throw new Error("nth: Expected exactly 2 arguments");
        const [n, list] = args;
        if (typeof n !== "number") throw new Error("nth: First argument must be a number");
        if (!Array.isArray(list)) throw new Error("nth: Second argument must be a list");
        if (n < 0 || n >= list.length) throw new Error("nth: Index out of bounds");
        return list[n];
      },
      first: (...args: LispValue[]): LispValue => {
        if (args.length !== 1) throw new Error("first: Expected exactly 1 argument");
        const list = args[0];
        if (!Array.isArray(list)) throw new Error("first: Expected list");
        if (list.length === 0) throw new Error("first: Empty list");
        return list[0];
      },
      second: (...args: LispValue[]): LispValue => {
        if (args.length !== 1) throw new Error("second: Expected exactly 1 argument");
        const list = args[0];
        if (!Array.isArray(list)) throw new Error("second: Expected list");
        if (list.length < 2) throw new Error("second: List too short");
        return list[1];
      },
      third: (...args: LispValue[]): LispValue => {
        if (args.length !== 1) throw new Error("third: Expected exactly 1 argument");
        const list = args[0];
        if (!Array.isArray(list)) throw new Error("third: Expected list");
        if (list.length < 3) throw new Error("third: List too short");
        return list[2];
      },
      fourth: (...args: LispValue[]): LispValue => {
        if (args.length !== 1) throw new Error("fourth: Expected exactly 1 argument");
        const list = args[0];
        if (!Array.isArray(list)) throw new Error("fourth: Expected list");
        if (list.length < 4) throw new Error("fourth: List too short");
        return list[3];
      },
      fifth: (...args: LispValue[]): LispValue => {
        if (args.length !== 1) throw new Error("fifth: Expected exactly 1 argument");
        const list = args[0];
        if (!Array.isArray(list)) throw new Error("fifth: Expected list");
        if (list.length < 5) throw new Error("fifth: List too short");
        return list[4];
      },
      member: (...args: LispValue[]): LispValue => {
        if (args.length !== 2) throw new Error("member: Expected exactly 2 arguments");
        const [item, list] = args;
        if (!Array.isArray(list)) throw new Error("member: Second argument must be a list");
        const index = list.findIndex((x) => x === item);
        return index >= 0 ? list.slice(index) : false;
      },
      cadr: (...args: LispValue[]): LispValue => {
        if (args.length !== 1) throw new Error("cadr: Expected exactly 1 argument");
        const list = args[0];
        if (!Array.isArray(list)) throw new Error("cadr: Expected list");
        if (list.length < 2) throw new Error("cadr: List too short");
        return list[1];
      },
      caddr: (...args: LispValue[]): LispValue => {
        if (args.length !== 1) throw new Error("caddr: Expected exactly 1 argument");
        const list = args[0];
        if (!Array.isArray(list)) throw new Error("caddr: Expected list");
        if (list.length < 3) throw new Error("caddr: List too short");
        return list[2];
      },
      cadddr: (...args: LispValue[]): LispValue => {
        if (args.length !== 1) throw new Error("cadddr: Expected exactly 1 argument");
        const list = args[0];
        if (!Array.isArray(list)) throw new Error("cadddr: Expected list");
        if (list.length < 4) throw new Error("cadddr: List too short");
        return list[3];
      },
      subseq: (...args: LispValue[]): LispValue => {
        if (args.length < 2 || args.length > 3) throw new Error("subseq: Expected 2 or 3 arguments");
        const [list, start, end] = args;
        if (!Array.isArray(list)) throw new Error("subseq: First argument must be a list");
        if (typeof start !== "number") throw new Error("subseq: Second argument must be a number");
        if (end !== undefined && typeof end !== "number") throw new Error("subseq: Third argument must be a number");
        return list.slice(start, end);
      },

      // Function application operators
      funcall: (...args: LispValue[]): LispValue => {
        if (args.length < 1) throw new Error("funcall: Expected at least 1 argument");
        const [fnNameOrFn, ...fnArgs] = args;
        let fn: LispFunction;
        if (typeof fnNameOrFn === "string") {
          if (!(fnNameOrFn in env)) {
            throw new Error(`funcall: Function ${fnNameOrFn} not found`);
          }
          const value = env[fnNameOrFn];
          if (typeof value !== "function") {
            throw new Error(`funcall: ${fnNameOrFn} is not a function`);
          }
          fn = value;
        } else if (typeof fnNameOrFn === "function") {
          fn = fnNameOrFn;
        } else {
          throw new Error("funcall: First argument must be a function or function name");
        }
        return fn(...fnArgs);
      },
      mapcar: (...args: LispValue[]): LispValue => {
        if (args.length < 2) throw new Error("mapcar: Expected at least 2 arguments");
        const [fnNameOrFn, ...lists] = args;
        let func: LispFunction;
        if (typeof fnNameOrFn === "string") {
          if (!(fnNameOrFn in env)) {
            throw new Error(`mapcar: Function ${fnNameOrFn} not found`);
          }
          const value = env[fnNameOrFn];
          if (typeof value !== "function") {
            throw new Error(`mapcar: ${fnNameOrFn} is not a function`);
          }
          func = value;
        } else if (typeof fnNameOrFn === "function") {
          func = fnNameOrFn;
        } else {
          throw new Error("mapcar: First argument must be a function or function name");
        }
        if (!lists.every(arg => Array.isArray(arg))) {
          throw new Error("mapcar: All arguments after the first must be lists");
        }
        const minLength = Math.min(...(lists as LispList[]).map(list => list.length));
        const result: LispValue[] = [];
        for (let i = 0; i < minLength; i++) {
          const fargs = (lists as LispList[]).map(list => list[i]);
          result.push(func(...fargs));
        }
        return result;
      },

      // Predicates
      listp: (...args: LispValue[]): LispValue => {
        if (args.length !== 1) throw new Error("listp: Expected exactly 1 argument");
        return Array.isArray(args[0]);
      },
      atom: (...args: LispValue[]): LispValue => {
        if (args.length !== 1) throw new Error("atom: Expected exactly 1 argument");
        return !Array.isArray(args[0]);
      },
      null: (...args: LispValue[]): LispValue => {
        if (args.length !== 1) throw new Error("null: Expected exactly 1 argument");
        return Array.isArray(args[0]) && (args[0] as LispList).length === 0;
      },
      "null?": (...args: LispValue[]): LispValue => {
        if (args.length !== 1) throw new Error("null?: Expected exactly 1 argument");
        return Array.isArray(args[0]) && (args[0] as LispList).length === 0;
      },
      numberp: (...args: LispValue[]): LispValue => {
        if (args.length !== 1) throw new Error("numberp: Expected exactly 1 argument");
        return typeof args[0] === "number";
      },
      "number?": (...args: LispValue[]): LispValue => {
        if (args.length !== 1) throw new Error("number?: Expected exactly 1 argument");
        return typeof args[0] === "number";
      },
      zerop: (...args: LispValue[]): LispValue => {
        if (args.length !== 1) throw new Error("zerop: Expected exactly 1 argument");
        const x = args[0];
        if (typeof x !== "number") throw new Error("zerop: Argument must be a number");
        return x === 0;
      },
      plusp: (...args: LispValue[]): LispValue => {
        if (args.length !== 1) throw new Error("plusp: Expected exactly 1 argument");
        const x = args[0];
        if (typeof x !== "number") throw new Error("plusp: Argument must be a number");
        return x > 0;
      },
      minusp: (...args: LispValue[]): LispValue => {
        if (args.length !== 1) throw new Error("minusp: Expected exactly 1 argument");
        const x = args[0];
        if (typeof x !== "number") throw new Error("minusp: Argument must be a number");
        return x < 0;
      },
      eq: (...args: LispValue[]): LispValue => {
        if (args.length !== 2) throw new Error("eq: Expected exactly 2 arguments");
        return args[0] === args[1];
      },
      equal: (...args: LispValue[]): LispValue => {
        if (args.length !== 2) throw new Error("equal: Expected exactly 2 arguments");
        const [a, b] = args;
        if (Array.isArray(a) && Array.isArray(b)) {
          if (a.length !== b.length) return false;
          for (let i = 0; i < a.length; i++) {
            if (typeof env.equal === "function" && !env.equal(a[i], b[i])) return false;
          }
          return true;
        }
        return a === b;
      },
      "symbol?": (...args: LispValue[]): LispValue => {
        if (args.length !== 1) throw new Error("symbol?: Expected exactly 1 argument");
        return typeof args[0] === "string";
      },
      "list?": (...args: LispValue[]): LispValue => {
        if (args.length !== 1) throw new Error("list?: Expected exactly 1 argument");
        return Array.isArray(args[0]);
      },

      // Numeric functions
      max: (...args: LispValue[]): LispValue => {
        if (args.length === 0) throw new Error("max: Expected at least one argument");
        if (!args.every(arg => typeof arg === "number")) throw new Error("max: All arguments must be numbers");
        return Math.max(...(args as number[]));
      },
      min: (...args: LispValue[]): LispValue => {
        if (args.length === 0) throw new Error("min: Expected at least one argument");
        if (!args.every(arg => typeof arg === "number")) throw new Error("min: All arguments must be numbers");
        return Math.min(...(args as number[]));
      },
      abs: (...args: LispValue[]): LispValue => {
        if (args.length !== 1) throw new Error("abs: Expected exactly 1 argument");
        const x = args[0];
        if (typeof x !== "number") throw new Error("abs: Argument must be a number");
        return Math.abs(x);
      },
      sqrt: (...args: LispValue[]): LispValue => {
        if (args.length !== 1) throw new Error("sqrt: Expected exactly 1 argument");
        const x = args[0];
        if (typeof x !== "number") throw new Error("sqrt: Argument must be a number");
        if (x < 0) throw new Error("sqrt: Cannot take square root of negative number");
        return Math.sqrt(x);
      },

      // Logic function
      not: (...args: LispValue[]): LispValue => {
        if (args.length !== 1) throw new Error("not: Expected exactly 1 argument");
        return !args[0];
      },

      // I/O functions – these update the outputBuffer
      print: (...args: LispValue[]): LispValue => {
        const output = args.map(formatLispValue).join(" ");
        outputBuffer.push(output);
        return args[args.length - 1];
      },
      prin1: (...args: LispValue[]): LispValue => {
        if (args.length !== 1) throw new Error("prin1: Expected exactly 1 argument");
        const output = formatLispValue(args[0]);
        outputBuffer.push(output);
        return args[0];
      },
      format: (...args: LispValue[]): LispValue => {
        if (args.length < 2) throw new Error("format: Expected at least 2 arguments");
        const [stream, formatStr, ...otherArgs] = args;
        if (typeof formatStr !== "string") throw new Error("format: Format string must be a string");
        let result = formatStr;
        let argIndex = 0;
        result = result.replace(/%[sd]/g, () => formatLispValue(otherArgs[argIndex++]));
        if (stream === "t") {
          outputBuffer.push(result);
          return result;
        } else {
          return null;
        }
      },
      "read-line": (...args: LispValue[]): LispValue => {
        if (args.length !== 0) throw new Error("read-line: Expected 0 arguments");
        if (currentInputProvider) {
          return currentInputProvider();
        }
        throw new Error("read-line: No input provider configured for the interpreter.");
      },

      // Exit functions
      exit: (): LispValue => {
        outputBuffer.push("Exiting Lisp interpreter");
        return "exit";
      },
      bye: (): LispValue => {
        outputBuffer.push("Exiting Lisp interpreter");
        return "exit";
      },

      // Constants
      nil: [],  // Represents an empty list
      t: true,  // Represents truth
    };

    Object.assign(globalEnv, env);
    return env;
  }

  // Format Lisp values for output
  function formatLispValue(value: LispValue): string {
    if (value === undefined || value === null) {
      return "NIL"
    } else if (Array.isArray(value)) {
      if (value.length === 0) {
        return "NIL"
      }
      return "(" + value.map(formatLispValue).join(" ") + ")"
    } else if (typeof value === "function") {
      return "#<FUNCTION>"
    } else if (typeof value === "string") {
      return value
    } else {
      return String(value)
    }
  }

  // Evaluate an expression in an environment
  function evaluate(exp: LispValue, env: Record<string, LispValue>): LispValue {
    // Self-evaluating expressions
    if (typeof exp === "number" || typeof exp === "boolean" || (typeof exp === "string" && exp.startsWith('"'))) {
      return exp
    }

    // Symbol lookup
    if (typeof exp === "string") {
      if (exp in env) {
        return env[exp]
      }
      throw new Error(`Unknown symbol: ${exp}`)
    }

    // List processing
    if (Array.isArray(exp)) {
      if (exp.length === 0) {
        return []
      }

      const [op, ...args] = exp

      // Special forms
      if (op === "quote") {
        if (args.length !== 1) {
          throw new Error("quote: Expected 1 argument")
        }
        return args[0]
      }

      if (op === "defun") {
        if (args.length < 3) {
          throw new Error("defun: Expected at least 3 arguments")
        }
        const [name, params, ...body] = args
        if (typeof name !== "string") {
          throw new Error("defun: Function name must be a symbol")
        }
        if (!Array.isArray(params)) {
          throw new Error("defun: Parameter list must be a list")
        }

        const fn: LispFunction = (...fnArgs: LispValue[]): LispValue => {
          const localEnv: Record<string, LispValue> = { ...env };
          (params as string[]).forEach((param: string, i: number) => {
            if (typeof param !== "string") {
              throw new Error("defun: Parameters must be symbols")
            }
            localEnv[param] = i < fnArgs.length ? fnArgs[i] : null;
          }); // <-- Semicolon added here

          // Evaluate all expressions in the body, return the last one
          let result: LispValue = null;
          for (const expr of body) {
            result = evaluate(expr, localEnv);
          }
          return result !== undefined ? result : null;
        };

        env[name] = fn
        globalEnv[name] = fn // Store in global environment
        return name
      }

      if (op === "setq") {
        if (args.length % 2 !== 0) {
          throw new Error("setq: Expected even number of arguments")
        }

        let lastValue: LispValue = null
        for (let i = 0; i < args.length; i += 2) {
          const symbol = args[i]
          const value = evaluate(args[i + 1], env)

          if (typeof symbol !== "string") {
            throw new Error("setq: Variable name must be a symbol")
          }

          env[symbol] = value
          globalEnv[symbol] = value // Store in global environment
          lastValue = value
        }

        return lastValue
      }

      if (op === "setf") {
        if (args.length % 2 !== 0) {
          throw new Error("setf: Expected even number of arguments")
        }

        let lastValue: LispValue = null
        for (let i = 0; i < args.length; i += 2) {
          const place = args[i]
          const value = evaluate(args[i + 1], env)

          if (Array.isArray(place)) {
            // Handle (setf (car x) value) etc.
            const [accessor, ...accessorArgs] = place
            const evaluatedArgs = accessorArgs.map((arg) => evaluate(arg, env))

            if (accessor === "car") {
              const list = evaluatedArgs[0]
              if (!Array.isArray(list) || list.length === 0) {
                throw new Error("setf: Cannot set car of empty list")
              }
              list[0] = value
            } else if (accessor === "nth") {
              const [index, list] = evaluatedArgs
              if (!Array.isArray(list)) {
                throw new Error("setf: Cannot set nth of non-list")
              }
              if (typeof index !== "number" || index < 0 || index >= list.length) {
                throw new Error("setf: Index out of bounds")
              }
              list[index] = value
            } else {
              throw new Error(`setf: Unsupported place: ${accessor}`)
            }
          } else if (typeof place === "string") {
            env[place] = value
            globalEnv[place] = value // Store in global environment
          } else {
            throw new Error("setf: Invalid place")
          }

          lastValue = value
        }

        return lastValue
      }

      if (op === "if") {
        if (args.length < 2 || args.length > 3) {
          throw new Error("if: Expected 2 or 3 arguments")
        }
        const [condition, thenExp, elseExp = null] = args
        const conditionResult = evaluate(condition, env)
        return evaluate(conditionResult ? thenExp : elseExp, env)
      }

      if (op === "cond") {
        for (const clause of args) {
          if (!Array.isArray(clause)) {
            throw new Error("cond: Each clause must be a list")
          }

          if (clause.length === 0) {
            throw new Error("cond: Empty clause")
          }

          const [test, ...body] = clause
          const testResult = evaluate(test, env)

          if (testResult) {
            if (body.length === 0) {
              return testResult
            }

            let result: LispValue = null
            for (const expr of body) {
              result = evaluate(expr, env)
            }
            return result !== undefined ? result : null
          }
        }

        return null
      }

      if (op === "case") {
        if (args.length < 1) {
          throw new Error("case: Expected at least 1 argument")
        }

        const keyForm = evaluate(args[0], env)

        for (let i = 1; i < args.length; i++) {
          const clause = args[i]

          if (!Array.isArray(clause)) {
            throw new Error("case: Each clause must be a list")
          }

          if (clause.length === 0) {
            throw new Error("case: Empty clause")
          }

          const [keys, ...body] = clause

          if (keys === "otherwise" || keys === "t" || (Array.isArray(keys) && keys.some((key) => key === keyForm))) {
            let result: LispValue = null
            for (const expr of body) {
              result = evaluate(expr, env)
            }
            return result !== undefined ? result : null
          }
        }

        return null
      }

      if (op === "lambda") {
        if (args.length < 2) {
          throw new Error("lambda: Expected at least 2 arguments")
        }
        const [params, ...body] = args
        if (!Array.isArray(params)) {
          throw new Error("lambda: First argument must be a list of parameters")
        }
        return (...lambdaArgs: LispValue[]): LispValue => {
          const localEnv = { ...env }
          params.forEach((param, i) => {
            if (typeof param !== "string") {
              throw new Error("lambda: Parameters must be symbols");
            }
            localEnv[param] = i < lambdaArgs.length ? lambdaArgs[i] : null;
          });

          // Evaluate all expressions in the body, return the last one
          let result: LispValue = null
          for (const expr of body) {
            result = evaluate(expr, localEnv)
          }
          return result !== undefined ? result : null
        }
      }

      if (op === "let") {
        if (args.length < 1) {
          throw new Error("let: Expected at least 1 argument")
        }
        const [bindings, ...body] = args
        if (!Array.isArray(bindings)) {
          throw new Error("let: First argument must be a list of bindings")
        }

        const localEnv = { ...env }
        for (const binding of bindings) {
          if (!Array.isArray(binding) || binding.length !== 2) {
            throw new Error("let: Binding must be a list of [symbol, value]")
          }
          const [symbol, valueExp] = binding
          if (typeof symbol !== "string") {
            throw new Error("let: Binding symbol must be a string")
          }
          localEnv[symbol] = evaluate(valueExp, localEnv)
        }

        let result
        for (const expr of body) {
          result = evaluate(expr, localEnv)
        }
        return result !== undefined ? result : null
      }

      if (op === "begin" || op === "progn") {
        let result
        for (const expr of args) {
          result = evaluate(expr, env)
        }
        return result !== undefined ? result : null
      }

      if (op === "do") {
        if (args.length < 2) {
          throw new Error("do: Expected at least 2 arguments")
        }

        const [varSpecs, endTest, ...body] = args

        if (!Array.isArray(varSpecs)) {
          throw new Error("do: First argument must be a list of variable specifications")
        }

        if (!Array.isArray(endTest)) {
          throw new Error("do: Second argument must be an end test list")
        }

        // Initialize variables
        const localEnv = { ...env }
        const varNames: string[] = []
        const stepForms: LispValue[] = []

        for (const spec of varSpecs) {
          if (!Array.isArray(spec)) {
            throw new Error("do: Variable specification must be a list")
          }

          const [name, init, step] = spec
          if (typeof name !== "string") {
            throw new Error("do: Variable name must be a symbol")
          }

          localEnv[name] = evaluate(init, env)
          varNames.push(name)
          stepForms.push(step || name)
        }

        // Loop until end test is true
        while (true) {
          if (evaluate(endTest[0], localEnv)) {
            // Return result forms
            let result
            for (let i = 1; i < endTest.length; i++) {
              result = evaluate(endTest[i], localEnv)
            }
            return result !== undefined ? result : null
          }

          // Execute body
          for (const expr of body) {
            evaluate(expr, localEnv)
          }

          // Update variables
          const newValues = stepForms.map((form) => evaluate(form, localEnv))
          varNames.forEach((name, i) => {
            localEnv[name] = newValues[i]
          })
        }
      }

      if (op === "dolist") {
        if (args.length < 1) {
          throw new Error("dolist: Expected at least 1 argument")
        }

        const [spec, ...body] = args

        if (!Array.isArray(spec) || spec.length < 2) {
          throw new Error("dolist: First argument must be a list with at least 2 elements")
        }

        const [varName, listForm, resultForm] = spec
        if (typeof varName !== "string") {
          throw new Error("dolist: Variable name must be a symbol")
        }

        const list = evaluate(listForm, env)
        if (!Array.isArray(list)) {
          throw new Error("dolist: Second element must evaluate to a list")
        }

        const localEnv = { ...env }

        for (const item of list) {
          localEnv[varName] = item

          for (const expr of body) {
            evaluate(expr, localEnv)
          }
        }

        // Set variable to nil and return result
        localEnv[varName] = []
        return resultForm ? evaluate(resultForm, localEnv) : []
      }

      if (op === "dotimes") {
        if (args.length < 1) {
          throw new Error("dotimes: Expected at least 1 argument")
        }

        const [spec, ...body] = args

        if (!Array.isArray(spec) || spec.length < 2) {
          throw new Error("dotimes: First argument must be a list with at least 2 elements")
        }

        const [varName, countForm, resultForm] = spec
        if (typeof varName !== "string") {
          throw new Error("dotimes: Variable name must be a symbol")
        }

        const count = evaluate(countForm, env)
        if (typeof count !== "number" || count < 0) {
          throw new Error("dotimes: Count must be a non-negative number")
        }

        const localEnv = { ...env }

        for (let i = 0; i < count; i++) {
          localEnv[varName] = i

          for (const expr of body) {
            evaluate(expr, localEnv)
          }
        }

        // Set variable to nil and return result
        localEnv[varName] = count
        return resultForm ? evaluate(resultForm, localEnv) : []
      }

      if (op === "eval") {
        if (args.length !== 1) {
          throw new Error("eval: Expected 1 argument")
        }

        const form = evaluate(args[0], env)
        return evaluate(form, env)
      }

      // Handle logical operators with short-circuit evaluation
      if (op === "and") {
        let result = true
        for (const arg of args) {
          result = !!evaluate(arg, env)
          if (!result) return false
        }
        return result
      }

      if (op === "or") {
        let result = false
        for (const arg of args) {
          result = !!evaluate(arg, env)
          if (result) return result
        }
        return false
      }

      // Function application
      const procedure = evaluate(op, env)
      const evaluatedArgs = args.map((arg) => evaluate(arg, env))

      if (typeof procedure === "function") {
        try {
          return procedure(...evaluatedArgs)
        } catch (error) {
          throw new Error(`Error in procedure ${op}: ${(error as Error).message}`)
        }
      }

      throw new Error(`Not a procedure: ${op}`)
    }

    throw new Error(`Cannot evaluate: ${exp}`)
  }

  try {
    const tokens: string[] = tokenize(program)
    if (tokens.length === 0) return ""

    // Clear output buffer
    outputBuffer = []

    const env: Record<string, LispValue> = createEnvironment(inputProvider)
    const currentTokens = [...tokens]

    // Evaluate all expressions
    while (currentTokens.length > 0) {
      const parsed: LispValue = parse(currentTokens)
      evaluate(parsed, env)
    }

    // Return only the output buffer content
    return outputBuffer.join("\n")
  } catch (error) {
    throw error
  }
}
