import lo from 'lodash'
import DataProvider from './DataProvider'

const dataProviders = {}
const userConfigs = {}

// queries

export function getDataProvider(dpId) {
  return dataProviders[dpId]
}

// returns config for given userId and dpId
export function getUserConfigForDp(dpId, userId) {
  return userConfigs[userId][dpId]
}

// returns all user configs for given dpId
export function getUsersForDp(dpId) {
  let r = []
  for (let userId of lo.keys(userConfigs)) {
    if (lo.has(userConfigs[userId], dpId)) {
      r.push(userConfigs[userId][dpId])
    }
  }
  return r
}

// returns all configs for given userId (dpId:cfg pairs)
export function getAllUserConfigs(userId) {
  return userConfigs[userId]
}

// returns all data providers for given userId
export function getDPsForUser(userId) {
  let r = []
  for (let dpId of lo.keys(userConfigs[userId])) {
    r.push(dataProviders[dpId])
  }
  return r
}

// finds a data provider with a given ref
export function findDpWithRef(ref) {
  return lo.findKey(dataProviders, (dp) => lo.isEqual(dp.ref, ref))
}

// modifications

// adds new Data Provider
export function addDataProvider(config) {
  dataProviders[config.id] = new DataProvider(config)
}

// adds new config for given userId - dpId
export function addUserConfig(userId, dpId, {needed = true, polling = Infinity, refreshFn}) {
  const dp = dataProviders[dpId]
  const oldPolling = dp.polling()
  const path = `${userId}.${dpId}`
  const isFirst = lo.isEmpty(getUsersForDp(dpId))

  lo.set(userConfigs, path, {needed, polling, enabled: true, refreshFn})
  removeDisabledUserConfigs(dpId)
  dataProviders[dpId].updateUser(isFirst, oldPolling)
}

// based on Data Provider settings, it either removes or disables user config with given userId
export function removeDpUser(dpId, userId) {
  let dp = dataProviders[dpId]
  if (dp.keepAliveFor) {
    disableUser(dp, userId)
  } else {
    removeUser(dpId, userId)
    removeDpIfNotUsed(dpId)
  }
}

// removes all user configs and data provider itself, when it expires
export function dataProviderExpired(dpId) {
  for (let userId of lo.keys(userConfigs)) {
    if (lo.has(userConfigs[userId], dpId)) {
      removeUser(dpId, userId)
    }
  }
  removeDpIfNotUsed(dpId)
}

// triggers fetch() on a Data Provider with given ref
export function refetch(dpRef) {
  for (let dp of lo.values(dataProviders)) {
    if (lo.isEqual(dp.ref, dpRef)) {
      return dp.fetch(true)
    }
  }
  throw new Error(`No data provider ref=${dpRef}`)
}

// internal

function disableUser(dp, userId) {
  const userCfg = userConfigs[userId][dp.id]
  if (!userCfg.enabled) {
    return // already disabled
  }
  userCfg.enabled = false
  userCfg.refreshFn = null
  const allUsersDisabled = lo.every(getUsersForDp(dp.id), (cfg) => !cfg.enabled)
  if (allUsersDisabled) {
    dp.suspend()
  }
}

function removeUser(dpId, userId) {
  delete userConfigs[userId][dpId]
  if (lo.isEmpty(userConfigs[userId])) {
    delete userConfigs[userId]
  }
}

function removeDpIfNotUsed(dpId) {
  if (lo.isEmpty(getUsersForDp(dpId))) {
    delete dataProviders[dpId]
  }
}

function removeDisabledUserConfigs(dpId) {
  for (let userId of lo.keys(userConfigs)) {
    if (lo.has(userConfigs[userId], dpId) && !userConfigs[userId][dpId].enabled) {
      removeUser(dpId, userId)
    }
  }
}
