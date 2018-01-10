import React from 'react'
import {withDataProviders, dataProvidersConfig, RETRY, ABORT} from 'data-provider'
import {connect} from 'react-redux'
import {compose} from 'redux'
import {failingResponseHandlerProvider} from './dataProviders'
import {defaultOnMount} from './onWillMount'

const retryOn503ResponseHandler = (response) => {
  console.log(`received response with status: ${response.status}`) //eslint-disable-line no-console
  if (response.ok) {
    console.log('response ok') //eslint-disable-line no-console
    return response.json()
  } else if (response.status === 503) {
    console.log('RETRYing ...') //eslint-disable-line no-console
    return RETRY
  }
  console.log('ABORTing ...') //eslint-disable-line no-console
  return ABORT
}

const Message = ({body}) => (
  <div className="message">
    <h3>{body}</h3>
  </div>
)

const MessageContainer = compose(
  withDataProviders(() => [failingResponseHandlerProvider()]),
  connect((state) => ({body: state.body}))
)(Message)

const ResponseHandlerContainer = () => (
  <div className="box-container">
    <p><code>getData</code> returns status code 503 in this example, which responseHandler handles by
      sending a <code>RETRY</code> response. This repeats 3 times for demonstration purposes, feel free to
      have a look at the console</p>
    <MessageContainer />
  </div>
)

export const ResponseHandlerExample = defaultOnMount(
  () => dataProvidersConfig({responseHandler: retryOn503ResponseHandler})
)(ResponseHandlerContainer)
