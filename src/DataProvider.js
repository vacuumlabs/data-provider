import lo from 'lodash'
import {cfg} from './config'

export default class DataProvider {
  constructor({id, ref, rawOnData, onData, initialData}) {
    this.id = id
    this.ref = ref
    this.rawOnData = rawOnData
    this.onData = onData
    this.userConfigs = {}
    this.loaded = false

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

  fetchWithRetry() {
    return new Promise((resolve, reject) => {
      const getDataWithRetry = async (retries) => {
        try {
          resolve(await this.getData())
        } catch (error) {
          if (retries > 0) {
            setTimeout(() => getDataWithRetry(retries - 1), cfg.retryDelay)
          } else {
            reject(error)
          }
        }
      }
      getDataWithRetry(cfg.maxRetries)
    })
  }

  async fetch() {
    if (this.canceled()) {
      return null
    }
    if (this.timer) {
      clearTimeout(this.timer)
    }

    const data = cfg.retryOnGetDataError
      ? await this.fetchWithRetry()
      : await this.getData()

    if (!this.canceled()) {
      this.loaded = true
      this.onData(data)
    }
    this.scheduleNextFetch()

    return Promise.resolve()
  }
}
