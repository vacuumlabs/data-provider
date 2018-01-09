import Promise from 'bluebird'

const GET_DATA_DELAY = 4 * 1000

// this simple function returns a Promise with given data,
// with a timed delay - to simulate some real API call
export function getData(data, msDelay = GET_DATA_DELAY) {
  return Promise.delay(msDelay).then(() => data)
}

export function getDataWithCount(data, msDelay) {
  data = {...data, body: `${data.body}, getData() called ${++getDataWithCount.counter} times`}
  return getData(data, msDelay)
}
getDataWithCount.counter = 0

export function resetGetDataCounter() {
  getDataWithCount.counter = 0
}
