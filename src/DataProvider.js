import lo from 'lodash'
import {cfg} from './config'
import {Promise} from 'bluebird'
import {dataProviderExpired, getUsersForDp} from './storage'

const RETRY = Symbol('RETRY')
export const ABORT = Symbol('ABORT')

export default class DataProvider {
  constructor({id, ref, rawGetData, getData, rawOnData, onData, initialData, responseHandler, keepAliveFor = 0}) {
    this.id = id
    this.ref = ref
    this.rawGetData = rawGetData
    this.getData = getData
    this.rawOnData = rawOnData
    this.onData = onData
    this.responseHandler = responseHandler
    this.keepAliveFor = keepAliveFor
    this.loaded = false // keeps track of whether the data has already been fetched
    this.fetching = false // indicates a fetch in-progress
    this.expireTimeout = null // for DPs with keepAlive, it contains timeoutID
    this.hasExpired = false // for DPs with keepAlive, indicates an expired DP

    if (initialData !== undefined) {
      this.loaded = true
      this.onData(initialData)
      this.refreshComponents()
    }
  }

  refreshComponents() {
    getUsersForDp(this.id).forEach(({refreshFn}) => {refreshFn && refreshFn()})
  }

  updateUser(isFirst, oldDpPolling) {
    let needFetch = isFirst
    clearTimeout(this.expireTimeout)
    this.expireTimeout = null

    if (this.polling() < oldDpPolling) {
      needFetch = true
    }

    if (!this.loaded && !this.timer) {
      needFetch = true
    }

    if (needFetch) {
      this.fetch()
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

  // TODO(TK) I'd prefer if methods which
  // a) need more than just DataProvider fields to compute
  // b) do not access DataProviders 'private' fields (fetching, expireTimeout)
  // were functions in storage.js . So, instead if `dp.polling()` we'd have `polling(dpId)`. Same for
  // needed, cancelled.

  polling() {
    return lo.reduce(getUsersForDp(this.id), (prev, {polling}) => Math.min(polling, prev), Infinity)
  }

  needed() {
    return lo.some(getUsersForDp(this.id), ({needed}) => needed)
  }

  expired() {
    return this.hasExpired
  }

  canceled() {
    return this.keepAliveFor <= 0 && lo.isEmpty(getUsersForDp(this.id))
      || this.expired()
  }

  scheduleNextFetch() {
    if (this.polling() === Infinity) {
      return
    }

    this.timer = setTimeout(() => {
      this.fetch()
    }, this.polling())
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

  /**
   * Fetch calls this.getData() to retrieve data and passes it through resolveHandler and then to this.onData().
   * If there already is a fetch in-progress and another fetch() is called concurrently (e.g. nested DP),
   * it will not trigger another getData call, but it will return immediately - UNLESS
   * force parameter is set to true (e.g. useful when data change and refetch() is called)
   */
  async fetch(force = false) {
    if (this.canceled() || (!force && this.fetching)) {
      return
    }
    this.fetching = true
    if (this.timer) {
      clearTimeout(this.timer)
    }

    let data
    try {
      const rawResponse = await this.getDataWithRetry(cfg.maxTimeoutRetries)
      const response = await this.responseHandler(rawResponse)
      if (response === ABORT) {
        data = null
      } else {
        data = response
      }
    } finally {
      this.fetching = false
    }

    if (!this.canceled() && data) {
      this.loaded = true
      this.onData(data)
      this.refreshComponents()
    }
    this.scheduleNextFetch()
  }
}
