/* global test, expect, beforeEach, afterEach */
import React from 'react'
import ReactDOM from 'react-dom'
import ReactTestUtils from 'react-dom/test-utils'
import {withDataProviders, withRefetch} from '../src/withDataProviders'
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
  expectTextContent(renderedMessage).toBe('Hello')
})

test('withDataProviders (needed=true) renders custom error when it fails (ABORT on response.ABORT)', async () => {
  dataProvidersConfig({responseHandler: (response) => ({abort: ABORT}), errorComponent: <div>Failed</div>})
  const {root} = renderMessageContainerApp({needed: true})

  await safeDelay(GET_DATA_DELAY)

  let renderedMessage = root.querySelector('div div')
  expect(renderedMessage.textContent).toBe('Failed')
})

test('custom error component in dp setting', async () => {
  dataProvidersConfig({responseHandler: (response) => ABORT})
  const {root} = renderMessageContainerApp({needed: true, errorComponent: <div>Failed</div>})

  await safeDelay(GET_DATA_DELAY)

  let renderedMessage = root.querySelector('div div')
  expect(renderedMessage.textContent).toBe('Failed')
})

test('onAbort fires on error, works with connected error component', async () => {
  const ErrorMessageContainer = compose(
    connect((state) => ({content: state.content})),
  )(Message)
  dataProvidersConfig({responseHandler: (response) => ({abort: ABORT}), errorComponent: <ErrorMessageContainer />})
  const {root} = renderMessageContainerApp({needed: true, onAbort: [updateMessageStaticData, 'Error Data']})

  await safeDelay(GET_DATA_DELAY)

  let renderedMessage = root.querySelector('div.message')
  expect(renderedMessage.textContent).toBe('Error Data')
})

test('withDataProviders (needed=false) renders initial state of child component', async () => {
  const {root} = renderMessageContainerApp({needed: false, initialData: {data: 'init'}})

  let renderedMessage = root.querySelector('div.message p')
  expectTextContent(renderedMessage).toBe('init')

  await safeDelay(GET_DATA_DELAY)
  renderedMessage = root.querySelector('div.message p')
  expectTextContent(renderedMessage).toBe('Hello')
})

test(
  'nested withDataProviders with eager prefetching - child component is rendered ' +
  'after data is fetched and getData was called only once',
  async () => {
    const getData = [getDataWithCount, {data: ''}, GET_DATA_DELAY]
    const MessageContainer = messageContainer({needed: true, getData, initialData: {show: false}})
    const ParentContainer = ({show}) => (show ? <MessageContainer /> : null)
    const Container = compose(
      connect((state) => ({show: state.show})),
      withDataProviders(() => [messageProvider({needed: false, getData})])
    )(ParentContainer)
    const {root, store} = renderApp(<Container />)

    await safeDelay(GET_DATA_DELAY)
    store.dispatch({type: 'toggle-show', reducer: (state) => ({...state, show: !state.show})})

    let renderedMessage = root.querySelector('div.message')
    expectTextContent(renderedMessage).toBe('1')
  }
)

test(
  'nested withDataProviders with eager prefetching - child component is rendered immediately, but ' +
  'getData is called only once',
  async () => {
    const getData = [getDataWithCount, {data: ''}, GET_DATA_DELAY]
    const MessageContainer = messageContainer({needed: true, getData})
    const Container = compose(withDataProviders(() => [messageProvider({needed: false, getData})]))(
      MessageContainer
    )
    const {root} = renderApp(<Container />)

    await safeDelay(GET_DATA_DELAY)

    let renderedMessage = root.querySelector('div.message')
    expectTextContent(renderedMessage).toBe('1')
  }
)

test('withDataProviders polling', async () => {
  const POLLING_DELAY = 0.2 * 1000
  const {root} = renderMessageContainerApp({
    polling: POLLING_DELAY,
    initialData: {data: 'init'},
    getData: [getDataWithCount, {data: 'count:'}, 0]
  })
  const countRegexp = /^count:(\d+)$/

  let renderedMessage = root.querySelector('div.message p')
  expectTextContent(renderedMessage).toBe('init')

  await safeDelay(POLLING_DELAY)
  renderedMessage = root.querySelector('div.message p')
  expectTextContent(renderedMessage).toMatch(countRegexp)
  const firstCount = parseInt(countRegexp.exec(renderedMessage.textContent)[1], 10)

  await safeDelay(POLLING_DELAY)
  renderedMessage = root.querySelector('div.message p')
  expectTextContent(renderedMessage).toMatch(countRegexp)
  const secondCount = parseInt(countRegexp.exec(renderedMessage.textContent)[1], 10)
  expect(secondCount).toBe(firstCount + 1)
})

test('withDataProviders should show loading when (injectLoading=true) and (needed=false)', () => {
  const {root} = renderMessageContainerApp({needed: false, injectLoading: true})

  let renderedMessage = root.querySelector('div.message span.loading')
  expect(renderedMessage).not.toBeNull()
})

test('withDataProviders should not show loading when injectLoading is not set', () => {
  const {root} = renderMessageContainerApp({needed: false})

  let renderedMessage = root.querySelector('div.message span.loading')
  expect(renderedMessage).toBeNull()
})

test('withDataProviders should not show loading when injectLoading is set but (needed=true)', () => {
  const {root} = renderMessageContainerApp({needed: true, injectLoading: true})

  let renderedMessage = root.querySelector('div.message span.loading')
  expect(renderedMessage).toBeNull()
})

test('DataProvider aborts after receiving ABORT from responseHandler', async () => {
  let failCount = 0
  dataProvidersConfig({responseHandler: (response) => (failCount++ < 1 ? ABORT : response)})
  const {root} = renderMessageContainerApp({
    getData: [getDataWithCount, {data: 'count:'}, GET_DATA_DELAY]
  })

  await safeDelay(GET_DATA_DELAY * 2)

  let renderedMessage = root.querySelector('div.message p')
  expectTextContent(renderedMessage).toBe('')
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
  expectTextContent(renderedMessage).toBe('count:3')
  expect(getDataWithCount.counter).toBe(4)
})

test('component with keep-alive retains data after unmounting / mounting', async () => {
  const getData = [getDataWithCount, {data: ''}, GET_DATA_DELAY]
  const MessageContainer = compose(
    withDataProviders(() => [messageProvider({ref: 'keepAlive', getData, keepAliveFor: 2 * GET_DATA_DELAY})]),
    connect((state) => ({content: state.content})),
  )(Message)
  const ShowContainer = ({show}) => (
    <div className="show">
      {show ? <MessageContainer /> : null}
      show: {show ? 'true' : 'false'}
    </div>
  )
  const Container = connect((state) => ({show: state.show}))(ShowContainer)
  const {root, store} = renderApp(<Container />)
  const toggleShowAction = {type: 'toggle-show', reducer: (state) => ({...state, show: !state.show})}
  store.dispatch(toggleShowAction)

  // let the component load its data
  await safeDelay(GET_DATA_DELAY)

  // unmount the component
  store.dispatch(toggleShowAction)
  await safeDelay(GET_DATA_DELAY)

  // and mount it again
  store.dispatch(toggleShowAction)
  await safeDelay(GET_DATA_DELAY) // 0 delay would be enough, but let's ensure getData wasn't called more than once

  let renderedMessage = root.querySelector('div.message')
  expectTextContent(renderedMessage).toBe('1')

  // now unmount it again and wait until keepAlive times out
  store.dispatch(toggleShowAction)
  await safeDelay(2 * GET_DATA_DELAY)

  // ...and mount it again
  store.dispatch(toggleShowAction)
  await safeDelay(GET_DATA_DELAY)

  renderedMessage = root.querySelector('div.message')
  expectTextContent(renderedMessage).toBe('2')
})

test('component with refetch works after unmounting/mounting', async () => {
  const getData = [getDataWithCount, {data: ''}, GET_DATA_DELAY]
  const RefetchContainer = ({refetch, content}) => (
    <div>
      <Message content={content} />
      <button onClick={() => refetch('refetch')} />
    </div>
  )
  const MessageContainer = compose(
    withRefetch(),
    withDataProviders(() => [messageProvider({ref: 'refetch', getData})]),
    connect((state) => ({content: state.content})),
  )(RefetchContainer)
  const ShowContainer = ({show}) => <div>{show ? <MessageContainer /> : null}</div>
  const Container = connect((state) => ({show: state.show}))(ShowContainer)
  const {root, store} = renderApp(<Container />, {show: true})
  const toggleShowAction = {type: 'toggle-show', reducer: (state) => ({...state, show: !state.show})}
  await safeDelay(0)

  // turn off show to unmount MessageContainer
  store.dispatch(toggleShowAction)

  // and turn on show to mount it again
  store.dispatch(toggleShowAction)
  await safeDelay(0)
  ReactTestUtils.Simulate.click(root.querySelector('button'))
  await safeDelay(GET_DATA_DELAY)

  let renderedMessage = root.querySelector('div.message')
  expect(renderedMessage).not.toBeNull()
  expect(renderedMessage.textContent).toBe('3') // 1st init call, 2nd on remount, 3rd on refetch
})

test('failed polling should keep old data', async () => {
  let alreadyHaveData
  dataProvidersConfig({
    responseHandler: (response) => {
      if (alreadyHaveData) {
        return ABORT
      }
      alreadyHaveData = true
      return response
    }
  })
  const {root} = renderMessageContainerApp({
    getData: [getData, {data: 'hello'}],
    polling: 100
  })

  await safeDelay(500)
  let renderedMessage = root.querySelector('div.message p')
  expectTextContent(renderedMessage).toBe('hello')
})

test('failing refetch should delete component data', async () => {
  let alreadyHaveData
  dataProvidersConfig({
    responseHandler: (response) => {
      if (alreadyHaveData) {
        return ABORT
      }
      alreadyHaveData = true
      return response
    }
  })

  const RefetchContainer = ({refetch, content}) => (
    <div>
      <Message content={content} />
      <button onClick={() => refetch('refetch')} />
    </div>
  )
  const MessageContainer = compose(
    withRefetch(),
    withDataProviders(() => [
      {
        ref: 'refetch',
        getData: [getData, {data: 'hello'}],
        onData: [updateMessage],
        needed: true
      }
    ]),
    connect((state) => ({content: state.content}))
  )(RefetchContainer)
  const {root} = renderApp(<MessageContainer />, {show: true})

  await safeDelay(GET_DATA_DELAY)

  let renderedMessage = root.querySelector('div.message')
  expect(renderedMessage.textContent).toBe('hello')
  ReactTestUtils.Simulate.click(root.querySelector('button'))

  await safeDelay(GET_DATA_DELAY)

  renderedMessage = root.querySelector('div div')
  expect(renderedMessage.textContent).toBe('Failed to load data')
})

// common functions, components

function renderMessageContainerApp(dpSettings) {
  const MessageContainer = messageContainer(dpSettings)
  return renderApp(<MessageContainer />)
}

function renderApp(content, initialState) {
  const {app: App, store} = newTestApp(initialState)
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

function updateMessageStaticData(data) {
  return (ref, _, dispatch) => {
    dispatch(updateMessageAction(data))
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

function Message({content, dataProviderLoading}) {
  return (
    <div className="message">
      <p>{content}</p>
      {dataProviderLoading && <span className="loading" />}
    </div>
  )
}

function messageContainer(dpSettings) {
  return compose(
    withDataProviders(() => [messageProvider(dpSettings)]),
    connect((state) => ({content: state.content})),
  )(Message)
}

function expectTextContent(node) {
  expect(node).not.toBeNull()
  return expect(node.textContent)
}
