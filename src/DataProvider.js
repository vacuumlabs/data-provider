import lo from 'lodash'
import {cfg} from './config'

export const RETRY = Symbol('RETRY')
export const ABORT = Symbol('ABORT')

export default class DataProvider {
  constructor({id, ref, rawOnData, onData, initialData, responseHandler}) {
    this.id = id
    this.ref = ref
    this.rawOnData = rawOnData
    this.onData = onData
    this.userConfigs = {}
    this.loaded = false
    this.fetching = false
    this.responseHandler = responseHandler

    if (initialData !== undefined) {
      this.loaded = true
      this.onData(initialData)
    }
  }

  updateUser(userId, {polling=Infinity, needed=true, rawGetData, getData}) {
    let needFetch = false

    if (rawGetData != null && !lo.isEqual(rawGetData, this.rawGetData)) {
      needFetch = true
      this.rawGetData = rawGetData
      this.getData = getData
      this.loaded = false
    }

    let oldPolling = this.polling()
    this.userConfigs[userId] = {polling, needed}

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
    delete this.userConfigs[userId]
  }

  polling() {
    return lo.min([...lo.values(this.userConfigs).map(({polling}) => polling), Infinity])
  }

  needed() {
    return lo.reduce(lo.values(this.userConfigs).map(({needed}) => needed), (v1, v2) => v1 || v2, false)
  }

  canceled() {
    return lo.isEmpty(this.userConfigs)
  }

  scheduleNextFetch() {
    if (this.polling() === Infinity) {
      return
    }

    this.timer = setTimeout(() => {
      this.fetch()
    }, this.polling())
  }

  getDataWithRetry() {
    // TODO-TK: Why so low-levelish? Whats wrong about async-await syntax?
    return new Promise((resolve, reject) => {
      let lastTimeout
      let timedGetData = async (retries) => {
        if (retries < 0) {
          reject()
          return
        }
        lastTimeout = setTimeout(timedGetData, cfg.fetchTimeout, retries - 1)
        // TODO-TK you should probably also handle the cases when getData throws..?
        let data = await this.getData()
        clearTimeout(lastTimeout)
        // TODO-TK: this may be called multiple times. Not sure if this is allowed, but I'd like not
        // to do this
        resolve(data)
      }
      timedGetData(cfg.maxTimeoutRetries)
    })
  }

  /**
   * Fetch calls this.getData() to retrieve data and passes it through resolveHandler and then to this.onData().
   * If there already is a fetch in-progress and another fetch() is called concurrently,
   * it will not trigger another getData call, but it will return immediately - UNLESS
   * force parameter is set to true
   */
  async fetch(force = false) {
    if (this.canceled() || (!force && this.fetching)) {
      return null
    }
    this.fetching = true
    if (this.timer) {
      clearTimeout(this.timer)
    }

    let data
    try {
      const rawResponse = await this.getDataWithRetry()
      const response = await this.responseHandler(rawResponse)
      // TODO-TK is there any valid business reason for responseHandler to return RETRY? It seems to
      // me that retrying is already take care of by getDataWithRetry
      if (response === RETRY) {
        return await this.fetch(true)
      } else if (response === ABORT) {
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

    // TODO-TK why?
    return Promise.resolve()
  }
}
