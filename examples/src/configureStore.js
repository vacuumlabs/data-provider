import {applyMiddleware, createStore} from 'redux'
import {createLogger} from 'redux-logger'
import {initialData, reducer} from './reducers'

export default function configureStore() {
  return createStore(reducer, initialData(), applyMiddleware(createLogger()))
}
