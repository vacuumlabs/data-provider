import React from 'react'
import {withDataProviders} from 'data-provider'
import {connect} from 'react-redux'
import {compose} from 'redux'
import {messageProvider} from './dataProviders'
import {toggleMessage} from './actions'

const Message = ({title, body}) => (
  <div className="message">
    <h3>{title}</h3>
    <p>{body}</p>
  </div>
)

// MessageContainer uses a data-provider with needed === true
// - order of connect / withDataProviders is important here, since when data is fetched
// and dispatched by parent DP, this connect component needs to react to state change - it wouldn't be able to,
// if it was "under" this DP, because it didn't exist yet
const MessageContainer = compose(
  connect((state) => ({title: state.title, body: state.body})),
  withDataProviders(() => [messageProvider(true)]),
)(Message)

const ToggleableMessageContainer = ({showMessage}) => (
  <div className="message-container">
    {showMessage
      ? <MessageContainer />
      : <span>Message data is being pre-loaded and will finish in 4 seconds<br />
            Click the Show button to show the message</span>}
  </div>
)

// ParentMessageContainer uses a data-provider with needed === false
const ParentMessageContainer = compose(
  withDataProviders(() => [messageProvider(false)]),
  connect((state) => ({showMessage: state.showMessage}))
)(ToggleableMessageContainer)

const NestedProvidersContainer = ({showMessage, toggleMessage}) => (
  <div className="App">
    <button onClick={toggleMessage}>{showMessage ? 'Hide' : 'Show'}</button>
    <ParentMessageContainer />
  </div>
)

export const NestedProviders = connect(
  ({showMessage}) => ({showMessage}),
  {toggleMessage}
)(NestedProvidersContainer)
