import lo from 'lodash'
import {cfg} from './config'
import {Promise} from 'bluebird'

const RETRY = Symbol('RETRY')
export const ABORT = Symbol('ABORT')

// TODO-TK I think we shouldn't encapsulate state as much as we do it now. Basically, what we need
// to remember about the system is:
// - all dataProviders
// - all users
// - links between configs and poviders (think how to store them as easily as possible).
// Then we need a few query functions so we can access the data quikly.

export default class DataProvider {
  constructor({id, ref, rawOnData, onData, initialData, responseHandler, keepAliveFor = false, componentRefresh}) {
    this.id = id
    this.ref = ref
    this.rawOnData = rawOnData
    this.onData = onData
    // TODO-TK I don't get this. One DP can be used with many components, so which one gets
    // refreshed when this is called? Am I missing something?
    this.componentRefreshFn = componentRefresh
    // TODO-TK Why Map? Simple object should probably be enough?
    this.userConfigs = new Map()
    this.loaded = false
    this.fetching = false
    this.responseHandler = responseHandler
    this.keepAliveFor = keepAliveFor
    this.expireTimeout = null // will contain timeoutID
    this.hasExpired = false

    if (initialData !== undefined) {
      this.loaded = true
      this.onData(initialData)
      this.refreshComponent()
    }
  }

  refreshComponent() {
    this.componentRefreshFn && this.componentRefreshFn()
  }

  // TODO-TK remove setter
  setComponentRefresh(componentRefresh) {
    this.componentRefreshFn = componentRefresh
  }

  updateUser(userId, {polling=Infinity, needed=true, rawGetData, getData}) {
    let needFetch = false
    clearTimeout(this.expireTimeout)
    this.expireTimeout = null

    if (rawGetData != null && !lo.isEqual(rawGetData, this.rawGetData)) {
      needFetch = true
      this.rawGetData = rawGetData
      this.getData = getData
      this.loaded = false
    }

    let oldPolling = this.polling()
    for (let [uId, cfg] of this.userConfigs.entries()) {
      if (cfg.polling === polling && cfg.needed === needed && !cfg.enabled) {
        this.userConfigs.delete(uId)
      }
    }
    this.userConfigs.set(userId, {polling, needed, enabled: true})

    if (this.polling() < oldPolling) {
      needFetch = true
    }

    if (!this.loaded && !this.timer) {
      needFetch = true
    }

    if (needFetch) {
      this.fetch()
    }
  }

  removeUser(userId) {
    this.userConfigs.delete(userId)
  }

  disableUser(userId, onExpire) {
    this.userConfigs.get(userId).enabled = false
    const allUsersDisabled = [...this.userConfigs.values()].every((v) => !v.enabled)
    if (this.keepAliveFor && allUsersDisabled) {
      this.setComponentRefresh(null)
      this.expireTimeout = setTimeout(() => {
        this.hasExpired = true
        onExpire(this)
      }, this.keepAliveFor)
    }
  }

  suspended() {
    return this.expireTimeout != null
  }

  polling() {
    // TODO-TK I'd prefer using lodash.reduce (which works on any iterables) instead of copying the
    // whole array, just so you can use native .reduce. If you don't like to type much feel free to
    // import lodash as _. Also, I've noticed, this pattern is used also on other places, it'd be
    // good to clean it as well.
    return [...this.userConfigs.values()].reduce((prev, {polling}) => Math.min(polling, prev), Infinity)
  }

  needed() {
    return [...this.userConfigs.values()].reduce((prev, {needed}) => prev || needed, false)
  }

  expired() {
    return this.hasExpired
  }

  canceled() {
    return this.keepAliveFor <= 0 && lo.isEmpty(this.userConfigs)
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

  // TODO-TK why does it work as described? The last part seems to be quite arbitrary - why does
  // force result in concurrent fetches?
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
      this.refreshComponent()
    }
    this.scheduleNextFetch()
  }
}
