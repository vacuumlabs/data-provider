export const TOGGLE_POST = 'toggle-post'
export const POST_DATA = 'post-data'
export const MESSAGE_DATA = 'message-data'
export const CHANGE_ARTICLE_ID = 'change-article-id'
export const ARTICLE_DATA = 'article-data'

export const togglePost = (exampleId) => ({
  type: TOGGLE_POST,
  exampleId
})

export const postData = (data, ref, exampleId) => ({
  type: POST_DATA,
  data: {...data},
  exampleId,
  description: `DataProvider ref=${ref}`
})

export const messageData = (data, ref, exampleId) => ({
  type: MESSAGE_DATA,
  data: {...data},
  exampleId,
  description: `DataProvider ref=${ref}`
})

export const changeArticleId = (exampleId, articleId) => ({
  type: CHANGE_ARTICLE_ID,
  articleId,
  exampleId
})

export const articleData = (data, ref, exampleId, articleId) => ({
  type: ARTICLE_DATA,
  articleId,
  data: {...data},
  exampleId,
  description: `DataProvider ref=${ref}`
})
