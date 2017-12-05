import {applyMiddleware, createStore} from 'redux'
import {createLogger} from 'redux-logger'
import {reducer} from './reducers'

const initialData = () => ({title: '...', body: '...', showMessage: false})

export default function configureStore() {
  return createStore(reducer, initialData(), applyMiddleware(createLogger()))
}
