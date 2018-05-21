import React from 'react'
import {LoadingComponent} from './LoadingComponent'
import {ErrorComponent} from './ErrorComponent'
import {ABORT} from './DataProvider'

export const cfg = {
  responseHandler: defaultResponseHandler,
  loadingComponent: <LoadingComponent />,
  errorComponent: <ErrorComponent />,
  fetchTimeout: 30 * 1000,
  maxTimeoutRetries: 5
}

function defaultResponseHandler(response) {
  if (!(typeof Response !== 'undefined' && response instanceof Response)) {
    return response
  }
  if (!response.ok) {
    return ABORT
  }
  let contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    return response.json()
  }
  return response.text()
}

/**
 * Provides a way to set global configuration options for Data Providers
 */
export function dataProvidersConfig(options) {
  options = Object(options)

  Object.keys(cfg).forEach((key) => changeCfgOption(options, key))
}

// if supplied options contain given field, override its value in global cfg
function changeCfgOption(options, key) {
  if (expectKey(options, key, typeof cfg[key])) {
    cfg[key] = options[key]
  }
}

// check whether options contain given key and that it is the same type as in cfg
function expectKey(options, key, type) {
  if (key in options) {
    if (typeof options[key] === type) {
      return true
    }
    // eslint-disable-next-line no-console
    console.warn(`Ignoring options key '${key}' - ` +
      `expected type '${type}', received '${typeof options[key]}'`)
  }
  return false
}
