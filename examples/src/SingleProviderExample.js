import React from 'react'
import {withDataProviders} from 'data-provider'
import {connect} from 'react-redux'
import {compose} from 'redux'
import {messageProvider} from './dataProviders'
import {defaultOnMount} from './onWillMount'

const EXAMPLE_ID = 'exampleSP'

const Message = ({body}) => (
  <div className="message">
    <h3>{body}</h3>
  </div>
)

const MessageContainer = compose(
  withDataProviders(() => [messageProvider(EXAMPLE_ID)]),
  connect((state) => (state[EXAMPLE_ID]))
)(Message)

const SingleDataProviderContainer = () => (
  <div className="box-container">
    <MessageContainer />
  </div>
)
export const SingleDataProviderExample = defaultOnMount()(SingleDataProviderContainer)
