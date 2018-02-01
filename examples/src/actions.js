export const TOGGLE_POST = 'toggle-post'
export const POST_DATA = 'post-data'
export const MESSAGE_DATA = 'message-data'

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
