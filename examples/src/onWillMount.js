import React from 'react'
import {dataProvidersConfig} from 'data-provider'
import {resetGetDataCounter} from './getData'
import {compose} from 'redux'

export const onWillMount = (willMount) =>
  (BaseComponent) => class OnWillMount extends React.Component {
    componentWillMount = () => (willMount(this.props))

    render = () => (<BaseComponent {...this.props} />)
  }

export const defaultOnMount = (...additionalFns) => compose(
  onWillMount(() => {
    resetGetDataCounter()
    dataProvidersConfig({responseHandler: (r) => r})
    for (let fn of additionalFns) {
      if (typeof fn === 'function') {
        fn()
      }
    }
  })
)
