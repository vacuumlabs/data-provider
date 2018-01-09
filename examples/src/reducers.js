import {TOGGLE_POST, POST_DATA, MESSAGE_DATA, RESET_STATE} from './actions'

export const initialData = () => ({title: '...', body: '...', showPost: false})

export const reducer = (state, action) => {
  switch (action.type) {
    case MESSAGE_DATA: {
      const {body} = action.data
      return {...state, body}
    }
    case POST_DATA: {
      const {title, body} = action.data
      return {...state, title, body}
    }
    case TOGGLE_POST:
      return {...state, showPost: !state.showPost}
    case RESET_STATE:
      return {...initialData()}
    default:
      return state
  }
}
