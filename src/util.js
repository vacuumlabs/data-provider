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

export function call(list) {
  let fn = list[0]
  let args = list.slice(1)
  return fn(...args)
}
