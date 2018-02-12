import PropTypes from 'prop-types'
import React from 'react'
import lo from 'lodash'
import {assert, call, IdGenerator} from './util'
import {cfg} from './config'
import {
  addDataProvider, addUserConfig, findDpWithRef, getAllUserConfigs, getDataProvider, getDPsForUser,
  refetch, removeDpUser
} from './storage'

const idg = new IdGenerator()

export function withRefetch() {
  return (Component) => {
    return class ComponentWithRefetch extends React.Component {
      render() {
        return (
          <Component
            refetch={(dpRef) => {
              // Make sure context is updated (shouldComponentUpdate of some
              // parent component might prevent it from being updated)
              this.forceUpdate()
              refetch(dpRef)
            }}
            {...this.props}
          />)
      }
    }
  }
}

export function withDataProviders(getConfig) {
  return (Component) => {
    return class ComponentWithDataProviders extends React.Component {

      static contextTypes = {
        dispatch: PropTypes.func.isRequired,
      }

      componentWillMount() {
        this.id = idg.next()
        this.loadingComponent = cfg.loadingComponent
        this.handleUpdate(this.props)
      }

      componentWillReceiveProps(nextProps) {
        if (!lo.isEqual(this.props, nextProps)) {
          this.handleUpdate(nextProps)
        }
      }

      componentWillUnmount() {
        for (let {id: dpId} of getDPsForUser(this.id)) {
          removeDpUser(dpId, this.id)
        }
      }

      handleUpdate(props) {
        let newDataProviders = {}
        let oldDataProviders = getDPsForUser(this.id)

        for (let dpConfig of getConfig(props)) {
          let {
            ref,
            getData: rawGetData,
            onData: rawOnData,
            initialData,
            polling,
            needed,
            loadingComponent,
            responseHandler = cfg.responseHandler,
            keepAliveFor = 0
          } = dpConfig
          assert(Number.isInteger(keepAliveFor) && keepAliveFor >= 0,
            'Parameter keepAliveFor must be a positive Integer or 0')

          this.loadingComponent = loadingComponent === undefined ? this.loadingComponent : loadingComponent

          let dpId = findDpWithRef(ref)

          if (dpId == null) {
            assert(rawOnData != null && rawGetData != null,
              'Parameters onData, getData have to be provided, if data' +
              `provider was not defined yet. See DP ${ref}`
            )

            dpId = idg.next()
            addDataProvider({
              id: dpId,
              ref,
              rawGetData,
              getData: () => call(rawGetData),
              rawOnData,
              onData: (data) => call(rawOnData)(ref, data, this.context.dispatch),
              initialData,
              responseHandler,
              keepAliveFor
            })
          }

          let dp = getDataProvider(dpId)

          // Changing onData for existing data provider is not currently
          // supported
          assert(
            rawOnData == null || lo.isEqual(rawOnData, dp.rawOnData),
            `Provided onData for DP ${ref}\n${rawOnData}\n` +
            `is not equal to previous onData\n${dp.rawOnData}`
          )

          // Changing getData for existing data provider is not currently supported
          assert(
            rawGetData == null || lo.isEqual(rawGetData, dp.rawGetData),
            `Provided getData for DP ${ref}\n${rawGetData}\n` +
            `is not equal to previous getData\n${dp.rawGetData}`
          )

          addUserConfig(this.id, dpId, {
            needed,
            polling,
            refreshFn: this.forceUpdate.bind(this)
          })
          newDataProviders[dpId] = dp.ref
        }

        // this is used when handleUpdate is called for existing component, but with new props,
        // so its data providers could've changed
        for (let {id: dpId} of oldDataProviders) {
          if (!lo.has(newDataProviders, dpId)) {
            removeDpUser(dpId, this.id)
          }
        }
      }

      render() {
        let show = lo.entries(getAllUserConfigs(this.id)).every(([dpId, {needed}]) => {
          return !needed || getDataProvider(dpId).loaded
        })
        return show ? <Component {...this.props} /> : this.loadingComponent
      }
    }
  }
}
