import React from 'react'
import {withDataProviders} from 'data-provider'
import {connect} from 'react-redux'
import {compose} from 'redux'
import {messageProvider} from './dataProviders'

const Message = ({title, body}) => (
    <div className='message'>
        <h3>{title}</h3>
        <p>{body}</p>
    </div>
)

// MessageContainer uses a data-provider with needed === true
const MessageContainer = compose(
    connect((state) => ({title: state.title, body: state.body})),
    withDataProviders(() => [messageProvider(true)]),
)(Message)

const ToggleableMessageContainer = ({showMessage}) => (
    <div className='message-container'>
        {showMessage ? <MessageContainer/> : <span>Click the Show button to show the message</span>}
    </div>
)

// ParentMessageContainer uses a data-provider with needed === false
const ParentMessageContainer = compose(
    withDataProviders(() => [messageProvider(false)]),
    connect((state) => ({showMessage: state.showMessage}))
)(ToggleableMessageContainer)

const AppContainer = ({showMessage, togglePost}) => (
    <div className="App">
        <button onClick={togglePost}>{showMessage ? 'Hide' : 'Show'}</button>
        <ParentMessageContainer/>
    </div>
)

export const App = connect(
    ({showMessage}) => ({showMessage: showMessage}),
    (dispatch) => ({togglePost: () => dispatch({type: 'toggle-post'})})
)(AppContainer)
