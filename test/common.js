import React from 'react'
import {createStore} from 'redux'
import {Provider} from 'react-redux'
import PropTypes from 'prop-types'
import {Promise} from 'bluebird'

export const GET_DATA_DELAY = 0.1 * 1000

export const getData = (data, msDelay = GET_DATA_DELAY) => (
  Promise.delay(msDelay).then(() => data)
)

export function getDataWithCount({data}, msDelay) {
  return getData({data: data + ++getDataWithCount.counter}, msDelay)
}
getDataWithCount.counter = 0

class DispatchProvider extends React.Component {
  static childContextTypes = {
    dispatch: PropTypes.func,
  }

  getChildContext() {
    return {dispatch: this.props.dispatch}
  }

  render() {
    return (<div>{this.props.children}</div>)
  }
}

export const newTestApp = () => {
  const store = createStore((state, action) => (
    typeof action.reducer === 'function' ? action.reducer(state, action) : state
  ), {content: ''})

  return {
    app: ({children}) => (
      <Provider store={store}>
        <DispatchProvider dispatch={store.dispatch}>
          {children}
        </DispatchProvider>
      </Provider>
    ),
    store
  }
}
