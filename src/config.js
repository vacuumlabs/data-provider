const hasEnvVariables = typeof process !== 'undefined' && typeof process.env !== 'undefined'

function env(key) {
  return hasEnvVariables ? process.env[key] : undefined
}

export const cfg = {
  env: env('NODE_ENV') || 'development'
}

/**
 * Provides a way to set global configuration options for Data Providers
 * @param options
 */
export function dataProvidersConfig(options) {
  options = Object(options)

  if ('env' in options && typeof options.env === 'string') {
    cfg.env = options.env
  }
}
