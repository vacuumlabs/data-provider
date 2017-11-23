import {TOGGLE_MESSAGE, MESSAGE_DATA} from './actions'

export const reducer = (state, action) => {
  switch (action.type) {
    case MESSAGE_DATA: {
      const {title, body} = action.data
      return {...state, title, body}
    }
    case TOGGLE_MESSAGE:
      return {...state, showMessage: !state.showMessage}
    default:
      return state
  }
}
