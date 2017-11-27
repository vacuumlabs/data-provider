import React from 'react'
import {createStore} from 'redux'
import {Provider} from 'react-redux'
import PropTypes from 'prop-types'

const GET_DATA_DELAY = 0.1 * 1000

export function delayPromise() {
  return new Promise((resolve) => setTimeout(resolve, 2 * GET_DATA_DELAY))
}

export const getData = (data) => (
  new Promise((resolve) => setTimeout(resolve, GET_DATA_DELAY, data))
)

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

  return ({children}) => (
    <Provider store={store}>
      <DispatchProvider dispatch={store.dispatch}>
        {children}
      </DispatchProvider>
    </Provider>
  )
}
