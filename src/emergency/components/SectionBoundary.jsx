import { Component } from 'react';

/**
 * Keeps one broken section from blanking the whole page. Without a boundary React unmounts
 * everything on an uncaught error, so a map that fails to load would also take the medical
 * info and the call buttons with it.
 */
export default class SectionBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error('A section of the emergency page failed', error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      this.props.fallback ?? (
        <div className="em-inline-notice" role="alert">
          <p>This part of the page couldn’t be shown. Everything else still works.</p>
        </div>
      )
    );
  }
}
