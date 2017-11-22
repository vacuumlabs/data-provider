import {applyMiddleware, createStore} from 'redux'
import {createLogger} from 'redux-logger'

const reducer = (state, action) => {
    switch (action.type) {
        case 'msg-data':
            const {title, body} = action.data
            return {...state, title: title, body: body}
        case 'toggle-post':
            return {...state, showMessage: !state.showMessage}
        default:
            return state
    }
}

const initialData = () => ({title: '...', body: '...', showMessage: false})

export default function configureStore() {
    return createStore(reducer, initialData(), applyMiddleware(createLogger()))
}