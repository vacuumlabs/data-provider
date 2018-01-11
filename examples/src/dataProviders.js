import {postData, messageData} from './actions'
import {failingGetDataWithResponse, getData, getDataWithCount} from './getData'

const updatePost = () => (ref, data, dispatch) => {
  dispatch(postData(data, ref))
}

export const postProvider = (needed = true) => ({
  ref: 'post-provider',
  getData: [getDataWithCount, {title: 'Msg Title', body: 'Msg body'}],
  onData: [updatePost],
  needed
})

const updateMessage = () => (ref, data, dispatch) => {
  dispatch(messageData(data, ref))
}

export const messageProvider = () => ({
  ref: 'message',
  getData: [getData, {body: 'Hello world'}],
  onData: [updateMessage],
  needed: true
})

export const pollingProvider = () => ({
  ref: 'polling',
  getData: [getDataWithCount, {body: 'This message refreshes every 4 seconds'}, 2000],
  onData: [updateMessage],
  needed: true,
  polling: 2000
})

export const failingResponseHandlerProvider = () => ({
  ref: 'resp',
  getData: [failingGetDataWithResponse, {body: 'Hello world'}, 2000],
  onData: [updateMessage],
  needed: true
})

export const refetchProvider = () => ({
  ref: 'refetch',
  getData: [getDataWithCount, {body: 'Hello world'}, 2000],
  onData: [updateMessage],
  needed: true
})
