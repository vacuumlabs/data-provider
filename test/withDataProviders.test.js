/* global test, expect, beforeEach, describe */
/* eslint-disable no-console */
import React from 'react'
import ReactDOM from 'react-dom'
import {withDataProviders} from '../src/withDataProviders'
import {compose} from 'redux'
import {connect} from 'react-redux'
import {newTestApp, getData, getDataWithCount, GET_DATA_DELAY} from './common'
import {Promise} from 'bluebird'

beforeEach(() => {
  getDataWithCount.counter = 0
})

test('withDataProviders (needed=true) renders child component when the data is fetched', async () => {
  const {root} = renderMessageContainerApp({needed: true})

  let renderedMessage = root.querySelector('div.message p')
  expect(renderedMessage).toBeNull()

  await Promise.delay(GET_DATA_DELAY)
  renderedMessage = root.querySelector('div.message p')
  expect(renderedMessage).not.toBeNull()
  expect(renderedMessage.textContent).toBe('Hello')
})

test('withDataProviders (needed=false) renders initial state of child component', async () => {
  const {root} = renderMessageContainerApp({needed: false, initialData: {data: 'init'}})

  let renderedMessage = root.querySelector('div.message p')
  expect(renderedMessage).not.toBeNull()
  expect(renderedMessage.textContent).toBe('init')

  await Promise.delay(GET_DATA_DELAY)
  renderedMessage = root.querySelector('div.message p')
  expect(renderedMessage).not.toBeNull()
  expect(renderedMessage.textContent).toBe('Hello')
})

describe('nested withDataProviders with eager prefetching', () => {
  const getData = [getDataWithCount, {data: ''}, GET_DATA_DELAY]
  const MessageContainer = messageContainer({needed: true, getData, initialData: {show: false}})
  const ParentContainer = ({show}) => (
    <div className="container">
      {show ? <MessageContainer /> : null}
    </div>
  )
  const Container = compose(
    connect((state) => ({show: state.show})),
    withDataProviders(() => [messageProvider({needed: false, getData})]),
  )(ParentContainer)
  const {root, store} = renderApp(<Container />)

  test('child Message component is not initially rendered', () => {
    expect(root.querySelector('div.container div.message')).toBeNull()
  })

  test('child component is rendered after data is fetched and getData was called only once', async () => {
    await Promise.delay(GET_DATA_DELAY)
    store.dispatch({type: 'toggle-show', reducer: (state) => ({...state, show: !state.show})})
    await Promise.delay(GET_DATA_DELAY)

    let renderedMessage = root.querySelector('div.container div.message')
    expect(renderedMessage).not.toBeNull()
    expect(renderedMessage.textContent).toBe('1')
  })
})

test('withDataProviders polling', async () => {
  const POLLING_DELAY = 0.2 * 1000
  const {root} = renderMessageContainerApp({
    polling: POLLING_DELAY,
    initialData: {data: 'init'},
    getData: [getDataWithCount, {data: 'count:'}, 0]
  })

  let renderedMessage = root.querySelector('div.message p')
  expect(renderedMessage).not.toBeNull()
  expect(renderedMessage.textContent).toBe('init')

  await Promise.delay(POLLING_DELAY)
  renderedMessage = root.querySelector('div.message p')
  expect(renderedMessage).not.toBeNull()
  const firstMessage = renderedMessage.textContent
  expect(firstMessage).toMatch(/^count:\d+$/)

  await Promise.delay(POLLING_DELAY)
  renderedMessage = root.querySelector('div.message p')
  expect(renderedMessage).not.toBeNull()
  expect(renderedMessage.textContent).toMatch(/^count:\d+$/)
  expect(renderedMessage.textContent).not.toEqual(firstMessage)
})

// common functions, components

function renderMessageContainerApp(dpSettings) {
  const MessageContainer = messageContainer(dpSettings)
  return renderApp(<MessageContainer />)
}

function renderApp(content) {
  const {app: App, store} = newTestApp()
  const root = document.createElement('div')
  ReactDOM.render(<App>{content}</App>, root)
  return {root, store}
}

function updateMessageAction(data) {
  return {
    type: 'msg',
    payload: data,
    reducer: (state, action) => ({...state, content: action.payload})
  }
}

function updateMessage() {
  return (ref, data, dispatch) => {
    dispatch(updateMessageAction(data.data))
  }
}

function messageProvider(dpSettings) {
  return {
    ref: 'message',
    getData: [getData, {data: 'Hello'}],
    onData: [updateMessage],
    needed: false,
    ...dpSettings
  }
}

function Message({content}) {
  return (
    <div className="message">
      <p>{content}</p>
    </div>
  )
}

function messageContainer(dpSettings) {
  return compose(
    connect((state) => ({content: state.content})),
    withDataProviders(() => [messageProvider(dpSettings)]),
  )(Message)
}
