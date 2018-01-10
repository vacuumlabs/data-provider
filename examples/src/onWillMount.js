import React from 'react'
import {dataProvidersConfig} from 'data-provider'
import {resetGetDataCounter} from './getData'
import {connect} from 'react-redux'
import {compose} from 'redux'
import {resetState} from './actions'

export const onWillMount = (willMount) =>
  (BaseComponent) => class OnWillMount extends React.Component {
    componentWillMount = () => (willMount(this.props))

    render = () => (<BaseComponent {...this.props} />)
  }

export const defaultOnMount = (...additionalFns) => compose(
  connect(null, (dispatch) => ({resetState: () => dispatch(resetState())})),
  onWillMount((props) => {
    resetGetDataCounter()
    dataProvidersConfig({responseHandler: (r) => r})
    props.resetState()
    for (let fn of additionalFns) {
      if (typeof fn === 'function') {
        fn()
      }
    }
  })
)
