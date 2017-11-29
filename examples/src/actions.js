export const TOGGLE_MESSAGE = 'toggle-message'
export const MESSAGE_DATA = 'message-data'

export const toggleMessage = () => ({
  type: TOGGLE_MESSAGE
})

export const messageData = (data, ref) => ({
  type: MESSAGE_DATA,
  data: {...data},
  description: `DataProvider ref=${ref}`
})
