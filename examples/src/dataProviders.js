import {postData, messageData, articleData} from './actions'
import {failingGetDataWithResponse, getData, getDataWithCount} from './getData'

const updatePost = (exampleId) => (ref, data, dispatch) => {
  dispatch(postData(data, ref, exampleId))
}

export const postProvider = (needed = true, exampleId) => ({
  ref: 'post-provider',
  getData: [getDataWithCount, {title: 'Msg Title', body: 'Msg body'}, exampleId],
  onData: [updatePost, exampleId],
  needed
})

const updateMessage = (exampleId) => (ref, data, dispatch) => {
  dispatch(messageData(data, ref, exampleId))
}

export const messageProvider = (exampleId) => ({
  ref: 'message',
  getData: [getData, {body: 'Hello world'}],
  onData: [updateMessage, exampleId],
  needed: true
})

export const pollingProvider = (exampleId, opts) => ({
  ref: 'polling',
  getData: [getDataWithCount, {body: 'This message refreshes every 4 seconds'}, exampleId, 2000],
  onData: [updateMessage, exampleId],
  needed: true,
  polling: 2000,
  ...opts
})

export const failingResponseHandlerProvider = (exampleId) => ({
  ref: 'resp',
  getData: [failingGetDataWithResponse, {body: 'Hello world'}, exampleId, 2000],
  onData: [updateMessage, exampleId],
  needed: true
})

export const refetchProvider = (exampleId) => ({
  ref: 'refetch',
  getData: [getDataWithCount, {body: 'Hello world'}, exampleId, 2000],
  onData: [updateMessage, exampleId],
  needed: true
})

const updateArticleBody = (exampleId, articleId) => (ref, data, dispatch) => {
  dispatch(articleData(data, ref, exampleId, articleId))
}

export const articleProvider = (articleId, exampleId) => ({
  ref: ['articleId', articleId],
  getData: [getData, {body: `Article #${articleId}`}, 2000],
  onData: [updateArticleBody, exampleId, articleId],
  needed: true,
  keepAliveFor: 30 * 1000
})
