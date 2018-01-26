import React from 'react'
import {LoadingIcon} from './LoadingIcon'

export const cfg = {
  responseHandler: defaultResponseHandler,
  loadingIcon: <LoadingIcon />,
  fetchTimeout: 30 * 1000,
  maxTimeoutRetries: 5
}

function defaultResponseHandler(response) {
  // TODO-TK wouldn't it be nice defaultly JSON.parse JSON content, at least when content-type indicates so?
  return response
}

/**
 * Provides a way to set global configuration options for Data Providers
 * // TODO-TK What is this? Is it supposed to be somehow parsed or what? Unless it actually brings
 * // some information, please remove it.
 * @param options
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
