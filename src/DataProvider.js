import lo from 'lodash'
import {cfg} from './config'
import {Promise} from 'bluebird'

const RETRY = Symbol('RETRY')
export const ABORT = Symbol('ABORT')

export default class DataProvider {
  constructor({id, ref, rawOnData, onData, initialData, responseHandler, keepAliveFor = false}) {
    this.id = id
    this.ref = ref
    this.rawOnData = rawOnData
    this.onData = onData
    this.userConfigs = new Map()
    this.loaded = false
    this.fetching = false
    this.responseHandler = responseHandler
    this.keepAliveFor = keepAliveFor
    this.expiresAt = null

    if (initialData !== undefined) {
      this.loaded = true
      this.onData(initialData)
    }
  }

  updateUser(userId, {polling=Infinity, needed=true, rawGetData, getData}) {
    let needFetch = false
    this.expiresAt = null

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

  disableUser(userId) {
    this.userConfigs.get(userId).enabled = false
    const allUsersDisabled = [...this.userConfigs.values()].every((v) => !v.enabled)
    if (this.keepAliveFor && allUsersDisabled) {
      this.expiresAt = new Date().getTime() + this.keepAliveFor
    }
  }

  polling() {
    return [...this.userConfigs.values()].reduce((prev, {polling}) => Math.min(polling, prev), Infinity)
  }

  needed() {
    return [...this.userConfigs.values()].reduce((prev, {needed}) => prev || needed, false)
  }

  isExpired() {
    return this.expiresAt && this.expiresAt < new Date().getTime()
  }

  canceled() {
    return this.keepAliveFor <= 0 && lo.isEmpty(this.userConfigs)
      || this.isExpired()
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
    }
    this.scheduleNextFetch()
  }
}
