import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('StreamBox error:', error, info)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-ink px-4 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-brand/10">
            <svg className="h-10 w-10 text-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-white">Something went wrong</h1>
          <p className="mt-2 max-w-md text-sm text-mist">
            An unexpected error occurred while loading this page. Try reloading — your watchlist and history are safe.
          </p>
          <div className="mt-6 flex gap-3">
            <button
              onClick={this.handleReset}
              className="rounded-full bg-white px-6 py-3 text-sm font-bold text-black transition hover:bg-cream"
            >
              Try again
            </button>
            <a
              href="/"
              className="rounded-full border border-white/30 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Go home
            </a>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
