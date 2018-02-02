import {call} from './util'

export class FetchManager {
  constructor() {
    this.neededFetchesInProgress = 0
    this.fetchIdSeq = 0
    this.notNeededQueue = []
  }

  runNotNeeded() {
    for (let fn of this.notNeededQueue) {
      call(fn)
    }
    this.notNeededQueue = []
  }

  scheduleFetch(force, needed, fn) {
    const fetchId = this.fetchIdSeq++
    const fnArgs = [fn, fetchId, force]
    if (needed) {
      this.runNeededFetch(fnArgs)
    } else {
      // defer processing of not-needed in case there are more needed fetches in stack
      setTimeout(this.scheduleNotNeededFetch.bind(this), 0, fnArgs)
    }
  }

  async runNeededFetch(fnArgs) {
    this.neededFetchesInProgress++
    try {
      await call(fnArgs)
    } finally {
      if (--this.neededFetchesInProgress === 0) {
        this.runNotNeeded()
      }
    }
  }

  // call this using setTimeout(..., 0) ?
  scheduleNotNeededFetch(fnArgs) {
    if (this.neededFetchesInProgress > 0) {
      this.notNeededQueue.push(fnArgs)
    } else {
      call(fnArgs)
    }
  }
}
