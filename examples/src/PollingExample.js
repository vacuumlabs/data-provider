import React from 'react'
import {withDataProviders} from 'data-provider'
import {connect} from 'react-redux'
import {compose} from 'redux'
import {pollingProvider} from './dataProviders'

const Message = ({body}) => (
  <div className="message">
    <h3>{body}</h3>
  </div>
)

const MessageContainer = compose(
  withDataProviders(() => [pollingProvider()]),
  connect((state) => ({body: state.body}))
)(Message)

export const PollingExample = () => (
  <div className="box-container">
    <MessageContainer />
  </div>
)
