// this is used to fix following warning when running tests:
// Warning: React depends on requestAnimationFrame. Make sure that you load a polyfill in older browsers.
global.requestAnimationFrame = (callback) => {
  setTimeout(callback, 0)
}
