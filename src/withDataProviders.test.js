/* global test, expect */
/* eslint-disable no-console */
import React from 'react'
import ReactDOM from 'react-dom'
import {withDataProviders} from './withDataProviders'
import {compose} from 'redux'
import {connect} from 'react-redux'
import {newTestApp, getData, delayPromise} from './commonTests'

test('test withDataProviders (needed=true) state change', () => {
  const root = renderMessageContainer(true)

  let renderedMessage = root.querySelector('div.message')
  expect(renderedMessage).toBeNull()
  return delayPromise().then(() => {
    renderedMessage = root.querySelector('div.message')
    expect(renderedMessage).not.toBeNull()
    expect(renderedMessage.textContent).toBe('Hello')
  })
})

test('test withDataProviders (needed=false) state change', () => {
  const root = renderMessageContainer(false)

  let renderedMessage = root.querySelector('div.message')
  expect(renderedMessage).not.toBeNull()
  expect(renderedMessage.textContent).toBe('')
  return delayPromise().then(() => {
    renderedMessage = root.querySelector('div.message')
    expect(renderedMessage).not.toBeNull()
    expect(renderedMessage.textContent).toBe('Hello')
  })
})

// common functions, components

function renderMessageContainer({needed}) {
  const App = newTestApp()
  const root = document.createElement('div')
  const MessageContainer = messageContainer(false)
  ReactDOM.render(<App><MessageContainer /></App>, root)
  return root
}

const updateMessageAction = (data) => ({
  type: 'msg',
  payload: data,
  reducer: (state, action) => ({...state, content: action.payload})
})

const updateMessage = () => (ref, data, dispatch) => {
  dispatch(updateMessageAction(data.data))
}

const messageProvider = (needed = true) => ({
  ref: 'message',
  getData: [getData, {data: 'Hello'}],
  onData: [updateMessage],
  needed
})

const Message = ({content}) => (
  <div className="message">
    <p>{content}</p>
  </div>
)

function messageContainer(needed) {
  return compose(
    connect((state) => ({content: state.content})),
    withDataProviders(() => [messageProvider(needed)]),
  )(Message)
}
