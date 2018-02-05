import React from 'react'
import {createStore} from 'redux'
import {Provider} from 'react-redux'
import {Promise} from 'bluebird'

export const GET_DATA_DELAY = 0.1 * 1000

export function safeDelay(ms) {
  return Promise.delay(ms + 25)
}

export const getData = (data, msDelay = GET_DATA_DELAY) => (
  Promise.delay(msDelay).then(() => data)
)

export function getDataWithCount({data}, msDelay) {
  return getData({data: data + ++getDataWithCount.counter}, msDelay)
}
getDataWithCount.counter = 0

export const newTestApp = (initialState = {}) => {
  const store = createStore((state, action) => (
    typeof action.reducer === 'function' ? action.reducer(state, action) : state
  ), {content: '', ...initialState})

  return {
    app: ({children}) => (
      <Provider store={store}>
        {children}
      </Provider>
    ),
    store
  }
}
