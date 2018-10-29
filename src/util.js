export function assert(assertion, message) {
  if (!assertion) {
    throw new Error(message)
  }
}

export class IdGenerator {
  constructor() {
    this.counter = 0
  }

  next() {
    this.counter += 1
    return `#${this.counter}`
  }
}

export function call(listOrFunction) {
  if (listOrFunction instanceof Function) {
    return listOrFunction()
  } else {
    let fn = listOrFunction[0]
    let args = listOrFunction.slice(1)
    return fn(...args)
  }
}

export const defaultOnAbort = [() => () => undefined]
export function emptyDispatch() {
  // do nothing
}
