import {messageData} from './actions'
import Promise from 'bluebird'

// this simple function returns a Promise with given data,
// with a timed delay - to simulate some real API call
async function getData(data) {
  // randomly trigger error
  if (Math.random() < 0.15) {
    throw new Error('oops, some error occurred')
  }
  data = {...data, body: `${data.body}, getData() called ${++getData.counter} times`}
  return await Promise.delay(4 * 1000).then(() => data)
}
getData.counter = 0

const updateMessage = () => (ref, data, dispatch) => {
  dispatch(messageData(data, ref))
}

export const messageProvider = (needed = true) => ({
  ref: 'message',
  getData: [getData, {title: 'Msg Title', body: 'Msg body'}],
  onData: [updateMessage],
  needed
})
