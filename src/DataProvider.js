import {cfg} from './config'
import {Promise} from 'bluebird'
import {dataProviderExpired, getUsersForDp, getPolling, getCanceled} from './storage'
import {scheduleFetch} from './fetchScheduler'

const RETRY = Symbol('RETRY')
export const ABORT = Symbol('ABORT')

export default class DataProvider {
  constructor({
    id,
    ref,
    rawGetData,
    getData,
    rawOnData,
    onData,
    rawOnAbort,
    onAbort,
    initialData,
    responseHandler,
    keepAliveFor = 0
  }) {
    this.id = id
    this.ref = ref
    this.rawGetData = rawGetData
    this.getData = getData
    this.rawOnData = rawOnData
    this.onData = onData
    this.rawOnAbort = rawOnAbort
    this.onAbort = onAbort
    this.responseHandler = responseHandler
    this.keepAliveFor = keepAliveFor
    this.loaded = false // keeps track of whether the data has already been fetched
    this.error = false // if we couldn't get any data upon mount or refetch
    this.fetchingCount = 0 // indicates a number of fetches in-progress
    this.expireTimeout = null // for DPs with keepAlive, it contains timeoutID
    this.hasExpired = false // for DPs with keepAlive, indicates an expired DP
    this.lastFetchId = -1 // ID of a last successful fetch, helps prevent unnecessary scheduled fetches

    if (initialData !== undefined) {
      this.loaded = true
      this.onData(initialData)
      this.refreshComponents()
    }
  }

  refreshComponents() {
    getUsersForDp(this.id).forEach(({refreshFn}) => {refreshFn && refreshFn()})
  }

  updateUser(isFirst, needed, oldDpPolling) {
    let needFetch = isFirst
    clearTimeout(this.expireTimeout)
    this.expireTimeout = null

    if (getPolling(this.id) < oldDpPolling) {
      needFetch = true
    }

    if (!this.loaded && !this.timer) {
      needFetch = true
    }

    if (needFetch) {
      this.fetch(false, needed)
    }
  }

  suspend() {
    this.expireTimeout = setTimeout(() => {
      this.hasExpired = true
      dataProviderExpired(this.id)
    }, this.keepAliveFor)
  }

  suspended() {
    return this.expireTimeout != null
  }

  expired() {
    return this.hasExpired
  }

  scheduleNextFetch() {
    if (getPolling(this.id) === Infinity) {
      return
    }

    this.timer = setTimeout(() => {
      this.fetch(false, false)
    }, getPolling(this.id))
  }

  async getDataWithRetry(retries, previous = []) {
    if (retries < 0) {
      throw new Error(`DataProvider (ref=${this.ref}) has timed out.`)
    }
    let timeout = Promise.delay(cfg.fetchTimeout).then(() => RETRY)
    let getDataCalls = [this.getData(), ...previous]
    let data = await Promise.race([timeout, ...getDataCalls])
    return data === RETRY ? this.getDataWithRetry(retries - 1, getDataCalls) : data
  }

  fetch(force, needed) {
    scheduleFetch(force, needed, this.doFetch.bind(this))
  }

  fetching() {
    return this.fetchingCount > 0
  }

  /**
   * Fetch calls this.getData() to retrieve data and passes it through resolveHandler and then to this.onData().
   * If there already is a fetch in-progress and another fetch() is called concurrently (e.g. nested DP),
   * it will not trigger another getData call, but it will return immediately - UNLESS
   * force parameter is set to true (e.g. useful when data change and refetch() is called)
   */
  async doFetch(fetchId, force = false) {
    const newerFetchAlreadyFinished = this.lastFetchId > fetchId
    if (getCanceled(this.id) || (!force && this.fetching()) || newerFetchAlreadyFinished) {
      return
    }
    this.fetchingCount++
    if (this.timer) {
      clearTimeout(this.timer)
    }

    let data
    let errorData
    try {
      const rawResponse = await this.getDataWithRetry(cfg.maxTimeoutRetries)
      const response = await this.responseHandler(rawResponse)
      if (response === ABORT || (response && response.abort === ABORT)) {
        data = null
        errorData = response && response.data
      } else {
        data = response
      }
    } finally {
      this.fetchingCount--
    }

    if (!getCanceled(this.id)) {
      if (data) {
        this.loaded = true
        this.error = false
        this.lastFetchId = fetchId
        this.onData(data)
        this.refreshComponents()
        // so far force is used only in refetch
      } else if (force || !this.loaded) {
        this.loaded = false
        this.error = true
        this.onAbort(errorData)
        this.refreshComponents()
      }
    }
    this.scheduleNextFetch()
  }
}
