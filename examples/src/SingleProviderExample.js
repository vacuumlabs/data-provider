import React from 'react'
import {withDataProviders} from 'data-provider'
import {connect} from 'react-redux'
import {compose} from 'redux'
import {messageProvider} from './dataProviders'
import {defaultOnMount} from './onWillMount'

const Message = ({body}) => (
  <div className="message">
    <h3>{body}</h3>
  </div>
)

const MessageContainer = compose(
  withDataProviders(() => [messageProvider()]),
  connect((state) => ({body: state.body}))
)(Message)

const SingleDataProviderContainer = () => (
  <div className="box-container">
    <MessageContainer />
  </div>
)
export const SingleDataProviderExample = defaultOnMount()(SingleDataProviderContainer)
