import ReactDOM from 'react-dom'
import React from 'react'
import './index.css'
import PropTypes from 'prop-types'
import {App} from "./App"
import {Provider} from 'react-redux'
import configureStore from './configureStore'

const store = configureStore()

// ComponentWithDataProviders requires dispatch in context
class DispatchProvider extends React.Component {
    static childContextTypes = {
        dispatch: PropTypes.func,
    }

    getChildContext() {
        return {dispatch: this.props.dispatch}
    }

    render() {
        return (<div> {this.props.children} </div>)
    }
}

ReactDOM.render(
    <Provider store={store}>
        <DispatchProvider dispatch={store.dispatch}>
            <App />
        </DispatchProvider>
    </Provider>,
    document.getElementById('root'))
