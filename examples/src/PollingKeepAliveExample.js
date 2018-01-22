import React from 'react'
import {withDataProviders} from 'data-provider'
import {connect} from 'react-redux'
import {compose} from 'redux'
import {pollingProvider} from './dataProviders'
import {defaultOnMount} from './onWillMount'

const EXAMPLE_ID = 'examplePollingKeepAlive'

const Message = ({body}) => (
  <div className="message">
    <h3>{body}</h3>
  </div>
)

const MessageContainer = compose(
  withDataProviders(() => [pollingProvider(EXAMPLE_ID, {ref: 'pollingKA', keepAliveFor: 30 * 1000})]),
  connect((state) => (state[EXAMPLE_ID]))
)(Message)

const PollingContainer = () => (
  <div className="box-container">
    <p>This example uses a polling Data Provider with 30 seconds keep alive option, which means that it will
      retain the data and keep polling for 30 seconds even if you switch to other examples.</p>
    <MessageContainer />
  </div>
)

export const PollingKeepAliveExample = defaultOnMount()(PollingContainer)
