import {TOGGLE_POST, POST_DATA, MESSAGE_DATA, CHANGE_ARTICLE_ID, ARTICLE_DATA} from './actions'
import update from 'immutability-helper'

export const initialData = () => ({})

export const reducer = (state, action) => {
  switch (action.type) {
    case MESSAGE_DATA: {
      const {data: {body}, exampleId} = action
      return newState(state, exampleId, {body: {$set: body}})
    }
    case POST_DATA: {
      const {data: {title, body}, exampleId} = action
      return newState(state, exampleId, {title: {$set: title}, body: {$set: body}})
    }
    case TOGGLE_POST: {
      const {exampleId} = action
      const {showPost = false} = state[exampleId] || {}
      return newState(state, exampleId, {showPost: {$set: !showPost}})
    }
    case CHANGE_ARTICLE_ID: {
      const {articleId, exampleId} = action
      return newState(state, exampleId, {articleId: {$set: articleId}})
    }
    case ARTICLE_DATA: {
      const {articleId, exampleId, data: {body}} = action
      return newArticleState(state, exampleId, articleId, {body: {$set: body}})
    }
    default:
      return state
  }
}

function newState(oldState, exampleId, data) {
  let updates = {[exampleId]: (example) => update(example || {}, data)}
  return update(oldState, updates)
}

function newArticleState(oldState, exampleId, articleId, data) {
  let updates = {[exampleId]: (example) => update(example || {},
    {[articleId]: (article) => update(article || {}, data)})
  }
  return update(oldState, updates)
}
