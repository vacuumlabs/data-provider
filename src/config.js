const hasEnvVariables = typeof process !== 'undefined' && typeof process.env !== 'undefined'

function env(key) {
  return hasEnvVariables ? process.env[key] : undefined
}

export const cfg = {
  ignoreGetDataErrors: env('NODE_ENV') === 'production'
}

/**
 * Provides a way to set global configuration options for Data Providers
 * @param options
 */
export function dataProvidersConfig(options) {
  options = Object(options)

  if ('ignoreGetDataErrors' in options && typeof options.ignoreGetDataErrors === 'boolean') {
    cfg.ignoreGetDataErrors = options.ignoreGetDataErrors
  }
}
