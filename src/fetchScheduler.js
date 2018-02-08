import {call} from './util'

let neededFetchesInProgress = 0
let fetchIdSeq = 0
let notNeededQueue = []

// schedules execution of the fetch based on "needed" flag (needed has priority over !needed)
export function scheduleFetch(force, needed, fn) {
  const fetchId = fetchIdSeq++
  const fnArgs = [fn, fetchId, force]
  if (needed) {
    runNeededFetch(fnArgs)
  } else {
    // defer processing of not-needed in case there are more needed fetches in stack
    setTimeout(scheduleNotNeededFetch, 0, fnArgs)
  }
}

function runNotNeeded() {
  for (let fn of notNeededQueue) {
    call(fn)
  }
  notNeededQueue = []
}

async function runNeededFetch(fnArgs) {
  neededFetchesInProgress++
  try {
    await call(fnArgs)
  } finally {
    if (--neededFetchesInProgress === 0) {
      runNotNeeded()
    }
  }
}

function scheduleNotNeededFetch(fnArgs) {
  if (neededFetchesInProgress > 0) {
    notNeededQueue.push(fnArgs)
  } else {
    call(fnArgs)
  }
}
