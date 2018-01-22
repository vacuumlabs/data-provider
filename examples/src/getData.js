import Promise from 'bluebird'

const GET_DATA_DELAY = 4 * 1000

// this simple function returns a Promise with given data,
// with a timed delay - to simulate some real API call
export function getData(data, msDelay = GET_DATA_DELAY) {
  return Promise.delay(msDelay).then(() => data)
}

const counters = {}

export function getDataWithCount(data, counterId, msDelay) {
  counters[counterId] = counters[counterId] ? counters[counterId] + 1 : 1
  data = {...data, body: `${data.body}, getData() called ${counters[counterId]} times`}
  return getData(data, msDelay)
}

export function failingGetDataWithResponse(data, counterId, msDelay) {
  return getDataWithCount(data, counterId, msDelay).then((retData) => {
    let json = JSON.stringify(retData)
    return new Response(json, {status: failingGetDataWithResponse.failCount++ < 3 ? 503 : 200})
  })
}
failingGetDataWithResponse.failCount = 0

export function resetGetDataCounter() {
  failingGetDataWithResponse.failCount = 0
}
