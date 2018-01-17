import React from 'react'
import {withDataProviders} from 'data-provider'
import {connect} from 'react-redux'
import {compose} from 'redux'
import {postProvider} from './dataProviders'
import {togglePost} from './actions'
import {defaultOnMount} from './onWillMount'

const EXAMPLE_ID = 'exampleNP'

const Post = ({title, body}) => (
  <div className="message">
    <h3>{title}</h3>
    <p>{body}</p>
  </div>
)

// PostContainer uses a data-provider with needed === true
// - order of connect / withDataProviders is important here, since when data is fetched
// and dispatched by parent DP, this connect component needs to react to state change - it wouldn't be able to,
// if it was "under" this DP, because it didn't exist yet
const PostContainer = compose(
  connect((state) => (state[EXAMPLE_ID])),
  withDataProviders(() => [postProvider(true, EXAMPLE_ID)]),
)(Post)

const ToggleablePostContainer = ({showPost}) => (
  <div className="box-container">
    {showPost
      ? <PostContainer />
      : <span>Message data is being pre-loaded and will finish in 4 seconds<br />
            Click the Show button to show the message</span>}
  </div>
)

const connectShowPostFromState = (state) => ({showPost: state[EXAMPLE_ID] ? state[EXAMPLE_ID].showPost : false})

// ParentPostContainer uses a data-provider with needed === false
const ParentPostContainer = compose(
  withDataProviders(() => [postProvider(false, EXAMPLE_ID)]),
  connect(connectShowPostFromState)
)(ToggleablePostContainer)

const NestedProvidersContainer = ({showPost, togglePost}) => (
  <div>
    <button onClick={() => togglePost(EXAMPLE_ID)}>{showPost ? 'Hide' : 'Show'}</button>
    <ParentPostContainer />
  </div>
)

export const NestedProvidersExample = compose(
  connect(
    connectShowPostFromState,
    {togglePost}
  ),
  defaultOnMount()
)(NestedProvidersContainer)
