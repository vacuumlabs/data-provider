import PropTypes from 'prop-types'
import React from 'react'
import lo from 'lodash'
import {assert, IdGenerator} from './util'
import {cfg} from './config'
import {
  addDataProvider, addUserConfig, findDpWithRef, getDataProvider, getDPsForUser, getUserConfigForDp, refetch,
  removeDpUser
} from './storage'

function call(list) {
  let fn = list[0]
  let args = list.slice(1)
  return fn(...args)
}

const idg = new IdGenerator()

// TODO-TK this 'i.e. query providers / users with some properties' should be solved more
// systematically (this is also mentioned elsewhere)
// TODO-TK I've done some thinking and I believe we should change the contract such that ref
// determines how onData and getData looks like. The use-case for the current approach is provider
// with ref 'selectedHouse' (think real estate app) with getData and onData depending on what house
// does the user really interact with. Such DP may have some appeal, but you can as well use ref
// ['selectedHouse', currentHouseUUID] and you are good to go. Not even it'll work just as smooth,
// but it may even steer developer towards better practices - for example, it's a bad idea to have
// object on a constant place with semantics 'house being selected' in your appstate.

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
        this.loadingIcon = cfg.loadingIcon
        this.handleUpdate(this.props)
      }

      componentWillReceiveProps(nextProps) {
        // Make sure context is updated (shouldComponentUpdate of some parent
        // component might prevent it from being updated)
        if (!lo.isEqual(this.props, nextProps)) {
          this.forceUpdate()
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
            loadingIcon,
            responseHandler = cfg.responseHandler,
            keepAliveFor = 0
          } = dpConfig
          assert(Number.isInteger(keepAliveFor) && keepAliveFor >= 0,
            'Parameter keepAliveFor must be a positive Integer or 0')

          this.loadingIcon = loadingIcon === undefined ? this.loadingIcon : loadingIcon

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
              keepAliveFor,
              componentRefresh: this.forceUpdate.bind(this)
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

        this.forceUpdate()
      }

      render() {
        let show = getDPsForUser(this.id).every((dp) => {
          return !getUserConfigForDp(dp.id, this.id).needed || dp.loaded
        })
        return show ? <Component {...this.props} /> : this.loadingIcon
      }
    }
  }
}
