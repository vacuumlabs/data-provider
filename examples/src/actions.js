export const TOGGLE_POST = 'toggle-post'
export const POST_DATA = 'post-data'
export const MESSAGE_DATA = 'message-data'
export const RESET_STATE = 'reset-state'

export const togglePost = () => ({
  type: TOGGLE_POST
})

export const postData = (data, ref) => ({
  type: POST_DATA,
  data: {...data},
  description: `DataProvider ref=${ref}`
})

export const messageData = (data, ref) => ({
  type: MESSAGE_DATA,
  data: {...data},
  description: `DataProvider ref=${ref}`
})

export const resetState = () => ({
  type: RESET_STATE
})
