import React from 'react'
import {withDataProviders} from 'data-provider'
import {connect} from 'react-redux'
import {compose} from 'redux'
import {pollingProvider} from './dataProviders'
import {defaultOnMount} from './onWillMount'

const Message = ({body}) => (
  <div className="message">
    <h3>{body}</h3>
  </div>
)

const MessageContainer = compose(
  withDataProviders(() => [pollingProvider()]),
  connect((state) => ({body: state.body}))
)(Message)

const PollingContainer = () => (
  <div className="box-container">
    <MessageContainer />
  </div>
)

export const PollingExample = defaultOnMount()(PollingContainer)
