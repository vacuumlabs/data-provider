import React from 'react'
import {withDataProviders} from 'data-provider'
import {connect} from 'react-redux'
import {compose} from 'redux'
import {articleProvider} from './dataProviders'
import {defaultOnMount} from './onWillMount'
import {changeArticleId} from './actions'

const EXAMPLE_ID = 'exampleArticle'

const Message = ({body}) => (
  <div className="message">
    <h3>{body}</h3>
  </div>
)

const MessageContainer = compose(
  withDataProviders(({articleId}) => [articleProvider(articleId, EXAMPLE_ID)]),
  connect((state, {articleId}) => (state[EXAMPLE_ID] && state[EXAMPLE_ID][articleId]))
)(Message)

const ArticleControls = ({articleId = '0', changeArticleId}) => (
  <div className="box-container">
    <p>
      <label htmlFor="aId">Change Article Id:</label>
      <input id="aId" type="number" value={articleId} onChange={(evt) => changeArticleId(evt.target.value)} />
    </p>
    <MessageContainer articleId={articleId} />
  </div>
)
export const ArticleExample = compose(
  connect(
    (state) => ({articleId: state[EXAMPLE_ID] && state[EXAMPLE_ID].articleId}),
    (dispatch) => ({changeArticleId: (id) => dispatch(changeArticleId(EXAMPLE_ID, id))})
  ),
  defaultOnMount()
)(ArticleControls)
