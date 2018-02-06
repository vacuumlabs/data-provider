/* global test, expect, beforeEach, afterEach */
import React from 'react'
import ReactDOM from 'react-dom'
import {withDataProviders} from '../src/withDataProviders'
import {dataProvidersConfig, cfg} from '../src/config'
import {ABORT} from '../src/DataProvider'
import {compose} from 'redux'
import {connect} from 'react-redux'
import {newTestApp, getData, getDataWithCount, safeDelay, GET_DATA_DELAY} from './common'

const origCfg = {...cfg}

beforeEach(() => {
  getDataWithCount.counter = 0
  dataProvidersConfig(origCfg)
})

let lastRoot = null
afterEach(() => {
  if (lastRoot) {
    ReactDOM.unmountComponentAtNode(lastRoot)
    lastRoot = null
  }
})

test('withDataProviders (needed=true) renders child component when the data is fetched', async () => {
  const {root} = renderMessageContainerApp({needed: true})

  let renderedMessage = root.querySelector('div.message p')
  expect(renderedMessage).toBeNull()

  await safeDelay(GET_DATA_DELAY)

  renderedMessage = root.querySelector('div.message p')
  expect(renderedMessage).not.toBeNull()
  expect(renderedMessage.textContent).toBe('Hello')
})

test('withDataProviders (needed=false) renders initial state of child component', async () => {
  const {root} = renderMessageContainerApp({needed: false, initialData: {data: 'init'}})

  let renderedMessage = root.querySelector('div.message p')
  expect(renderedMessage).not.toBeNull()
  expect(renderedMessage.textContent).toBe('init')

  await safeDelay(GET_DATA_DELAY)
  renderedMessage = root.querySelector('div.message p')
  expect(renderedMessage).not.toBeNull()
  expect(renderedMessage.textContent).toBe('Hello')
})

test('nested withDataProviders with eager prefetching - child component is rendered ' +
  'after data is fetched and getData was called only once', async () => {
  const getData = [getDataWithCount, {data: ''}, GET_DATA_DELAY]
  const MessageContainer = messageContainer({needed: true, getData, initialData: {show: false}})
  const ParentContainer = ({show}) => show ? <MessageContainer /> : null
  const Container = compose(
    connect((state) => ({show: state.show})),
    withDataProviders(() => [messageProvider({needed: false, getData})]),
  )(ParentContainer)
  const {root, store} = renderApp(<Container />)

  await safeDelay(GET_DATA_DELAY)
  store.dispatch({type: 'toggle-show', reducer: (state) => ({...state, show: !state.show})})

  let renderedMessage = root.querySelector('div.message')
  expect(renderedMessage).not.toBeNull()
  expect(renderedMessage.textContent).toBe('1')
})

test('nested withDataProviders with eager prefetching - child component is rendered immediately, but ' +
  'getData is called only once', async () => {
  const getData = [getDataWithCount, {data: ''}, GET_DATA_DELAY]
  const MessageContainer = messageContainer({needed: true, getData})
  const Container = compose(
    withDataProviders(() => [messageProvider({needed: false, getData})]),
  )(MessageContainer)
  const {root} = renderApp(<Container />)

  await safeDelay(GET_DATA_DELAY)

  let renderedMessage = root.querySelector('div.message')
  expect(renderedMessage).not.toBeNull()
  expect(renderedMessage.textContent).toBe('1')
})

test('withDataProviders polling', async () => {
  const POLLING_DELAY = 0.2 * 1000
  const {root} = renderMessageContainerApp({
    polling: POLLING_DELAY,
    initialData: {data: 'init'},
    getData: [getDataWithCount, {data: 'count:'}, 0]
  })
  const countRegexp = /^count:(\d+)$/

  let renderedMessage = root.querySelector('div.message p')
  expect(renderedMessage).not.toBeNull()
  expect(renderedMessage.textContent).toBe('init')

  await safeDelay(POLLING_DELAY)
  renderedMessage = root.querySelector('div.message p')
  expect(renderedMessage).not.toBeNull()
  expect(renderedMessage.textContent).toMatch(countRegexp)
  const firstCount = parseInt(countRegexp.exec(renderedMessage.textContent)[1], 10)

  await safeDelay(POLLING_DELAY)
  renderedMessage = root.querySelector('div.message p')
  expect(renderedMessage).not.toBeNull()
  expect(renderedMessage.textContent).toMatch(countRegexp)
  const secondCount = parseInt(countRegexp.exec(renderedMessage.textContent)[1], 10)
  expect(secondCount).toBe(firstCount + 1)
})

test('DataProvider aborts after receiving ABORT from responseHandler', async () => {
  let failCount = 0
  dataProvidersConfig({responseHandler: (response) => (failCount++ < 1 ? ABORT : response)})
  const {root} = renderMessageContainerApp({
    getData: [getDataWithCount, {data: 'count:'}, GET_DATA_DELAY]
  })

  await safeDelay(GET_DATA_DELAY * 2)

  let renderedMessage = root.querySelector('div.message p')
  expect(renderedMessage).not.toBeNull()
  expect(renderedMessage.textContent).toBe('')
})

test('DataProvider retries on getData timeout and accepts first returned getData result', async () => {
  const TIMEOUT = 100
  dataProvidersConfig({fetchTimeout: TIMEOUT})
  // 3rd getData call returns the result first, therefore we'll expect the message to contain 'count:3'
  const progressiveDelays = [TIMEOUT * 5, TIMEOUT * 4, TIMEOUT * 1.5, TIMEOUT * 2]
  const timeoutingGetData = (data) => getDataWithCount(data, progressiveDelays[getDataWithCount.counter])
  const {root} = renderMessageContainerApp({
    getData: [timeoutingGetData, {data: 'count:'}]
  })

  await safeDelay(TIMEOUT * 5)
  let renderedMessage = root.querySelector('div.message p')
  expect(renderedMessage).not.toBeNull()
  expect(renderedMessage.textContent).toBe('count:3')
  expect(getDataWithCount.counter).toBe(4)
})

// common functions, components

function renderMessageContainerApp(dpSettings) {
  const MessageContainer = messageContainer(dpSettings)
  return renderApp(<MessageContainer />)
}

function renderApp(content) {
  const {app: App, store} = newTestApp()
  const root = document.createElement('div')
  lastRoot = root
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
