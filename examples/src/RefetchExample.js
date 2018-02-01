import React from 'react'
import {withDataProviders, withRefetch} from 'data-provider'
import {connect} from 'react-redux'
import {compose} from 'redux'
import {refetchProvider} from './dataProviders'
import {defaultOnMount} from './onWillMount'

const EXAMPLE_ID = 'exampleRefetch'

const Message = ({body, refetch}) => (
  <div className="message">
    <h3>{body}</h3>
    <button onClick={() => refetch('refetch')}>Refetch!</button>
  </div>
)

const MessageContainer = compose(
  withRefetch(),
  withDataProviders(() => [refetchProvider(EXAMPLE_ID)]),
  connect((state) => (state[EXAMPLE_ID]))
)(Message)

const RefetchExampleContainer = () => (
  <div className="box-container">
    <MessageContainer />
  </div>
)
export const RefetchExample = defaultOnMount()(RefetchExampleContainer)
