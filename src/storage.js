import lo from 'lodash'
import DataProvider from './DataProvider'

const dataProviders = {}
const userConfigs = {}
const keepAlivePollingMap = {}

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

// returns polling value for given dpId
export function getPolling(dpId) {
  return keepAliveDp(dpId) ?
    keepAlivePolling(dpId) :
    lo.reduce(getUsersForDp(dpId), (prev, {polling}) => Math.min(polling, prev), Infinity)
}

// returns canceled status for given dpId
export function getCanceled(dpId) {
  const dp = dataProviders[dpId]
  return !dp || (!keepAliveDp(dpId) && lo.isEmpty(getUsersForDp(dpId))) || dp.expired()
}

// modifications

// adds new Data Provider
export function addDataProvider(config) {
  dataProviders[config.id] = new DataProvider(config)
}

// adds new config for given userId - dpId
export function addUserConfig(userId, dpId, {needed = true, polling = Infinity, refreshFn}) {
  const oldPolling = getPolling(dpId)
  const isFirst = lo.isEmpty(getUsersForDp(dpId)) && !dataProviders[dpId].suspended()

  lo.set(userConfigs, [userId, dpId], {needed, polling, refreshFn})
  if (keepAliveDp(dpId)) {
    keepAlivePollingMap[dpId] = Math.min(polling, keepAlivePolling(dpId))
  }
  dataProviders[dpId].updateUser(isFirst, needed, oldPolling)
}

// based on Data Provider settings, it either removes or disables user config with given userId
export function removeDpUser(dpId, userId) {
  removeUser(dpId, userId)
  if (lo.isEmpty(getUsersForDp(dpId))) {
    if (keepAliveDp(dpId)) {
      dataProviders[dpId].suspend()
    } else {
      removeDataProvider(dpId)
    }
  }
}

// removes the data provider from repository, when it expires
export function dataProviderExpired(dpId) {
  removeDataProvider(dpId)
}

// triggers fetch() on a Data Provider with given ref
export function refetch(dpRef) {
  for (let dp of lo.values(dataProviders)) {
    if (lo.isEqual(dp.ref, dpRef)) {
      return dp.fetch(true, true)
    }
  }
  throw new Error(`No data provider ref=${dpRef}`)
}

// internal

function removeUser(dpId, userId) {
  delete userConfigs[userId][dpId]
  if (lo.isEmpty(userConfigs[userId])) {
    delete userConfigs[userId]
  }
}

function removeDataProvider(dpId) {
  delete dataProviders[dpId]
  delete keepAlivePollingMap[dpId]
}

function keepAlivePolling(dpId) {
  return keepAlivePollingMap[dpId] || Infinity
}

function keepAliveDp(dpId) {
  return dataProviders[dpId] && dataProviders[dpId].keepAliveFor > 0
}
