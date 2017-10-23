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
