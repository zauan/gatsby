import React from "react"
import { LocationContext } from "@reach/router"
import PropTypes from "prop-types"
import { SessionStorage } from "./session-storage"

export const ScrollContext = React.createContext<SessionStorage>(
  new SessionStorage()
)
ScrollContext.displayName = `GatsbyScrollContext`

type ShouldUpdateScrollFn = (
  prevRouterProps: LocationContext | undefined,
  routerProps: LocationContext
) => boolean
type ShouldUpdateScroll = undefined | ShouldUpdateScrollFn

export class ScrollHandler extends React.Component<
  LocationContext & { shouldUpdateScroll: ShouldUpdateScroll }
> {
  static propTypes = {
    shouldUpdateScroll: PropTypes.func,
    children: PropTypes.element.isRequired,
    location: PropTypes.object.isRequired,
  }

  _stateStorage: SessionStorage = new SessionStorage()

  scrollListener = (): void => {
    const { key } = this.props.location

    if (key) {
      this._stateStorage.save(this.props.location, key, window.scrollY)
    }
  }

  componentDidMount(): void {
    window.addEventListener(`scroll`, this.scrollListener)

    const scrollPosition = this._stateStorage.read(
      this.props.location,
      this.props.location.key
    )
    if (scrollPosition) {
      this.windowScroll(scrollPosition, undefined)
    } else if (this.props.location.hash) {
      this.scrollToHash(decodeURI(this.props.location.hash), undefined)
    }
  }

  componentWillUnmount(): void {
    window.removeEventListener(`scroll`, this.scrollListener)
  }

  componentDidUpdate(prevProps: LocationContext): void {
    const { hash, key } = this.props.location
    let scrollPosition

    if (key) {
      scrollPosition = this._stateStorage.read(this.props.location, key)
    }

    if (scrollPosition) {
      this.windowScroll(scrollPosition, prevProps)
    } else if (hash) {
      this.scrollToHash(decodeURI(hash), prevProps)
    }
  }

  windowScroll = (
    position: number,
    prevProps: LocationContext | undefined
  ): void => {
    if (this.shouldUpdateScroll(prevProps, this.props)) {
      window.scroll(0, position)
    }
  }

  scrollToHash = (
    hash: string,
    prevProps: LocationContext | undefined
  ): void => {
    const node = document.querySelector(hash)

    if (node && this.shouldUpdateScroll(prevProps, this.props)) {
      node.scrollIntoView()
    }
  }

  shouldUpdateScroll = (
    prevRouterProps: LocationContext | undefined,
    routerProps: LocationContext
  ): boolean => {
    const { shouldUpdateScroll } = this.props
    if (!shouldUpdateScroll) {
      return true
    }

    // Hack to allow accessing this._stateStorage.
    return shouldUpdateScroll.call(this, prevRouterProps, routerProps)
  }

  render(): React.ReactNode {
    return (
      <ScrollContext.Provider value={this._stateStorage}>
        {this.props.children}
      </ScrollContext.Provider>
    )
  }
}
