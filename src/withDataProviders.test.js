/* global test, expect */
/* eslint-disable no-console */
import React from 'react'
import ReactDOM from 'react-dom'
import {withDataProviders} from './withDataProviders'
import {compose, createStore} from 'redux'
import {connect, Provider} from 'react-redux'
import PropTypes from 'prop-types'

test('test withDataProviders state change', () => {
  const div = document.createElement('div')
  ReactDOM.render(<App />, div)

  let renderedMessage = div.querySelector('div.message')
  expect(renderedMessage).toBeNull()
  return new Promise((resolve) => setTimeout(resolve, 0.2 * 1000))
    .then(() => {
      renderedMessage = div.querySelector('div.message')
      expect(renderedMessage).not.toBeNull()
    })

})

// TODO cleanup

const store = createStore((state, action) => (
  action.type === 'msg' ? {content: action.payload} : state
), {content: ''})

const getData = (data) => (
  new Promise((resolve) => setTimeout(resolve, 0.1 * 1000, data))
)

const updateMessage = () => (ref, data, dispatch) => {
  dispatch({type: 'msg', payload: data.data})
}

const messageProvider = (needed = true) => ({
  ref: 'message',
  getData: [getData, {data: 'Hello'}],
  onData: [updateMessage],
  needed,
  // initialData: null
})

const Message = ({content}) => (
  <div className="message">
    <p>{content}</p>
  </div>
)
const MessageContainer = compose(
  connect((state) => ({content: state.content})),
  withDataProviders(() => [messageProvider(true)]),
)(Message)

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

export const App = () => (
  <Provider store={store}>
    <DispatchProvider dispatch={store.dispatch}>
      <MessageContainer />
    </DispatchProvider>
  </Provider>
)
