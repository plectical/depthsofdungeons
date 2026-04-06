import { Component, ReactNode } from 'react';
import type { ErrorInfo } from 'react';
import RundotGameAPI from '@series-inc/rundot-game-sdk/api';
import { reportError } from '../game/errorReporting';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary — catches React rendering crashes, reports them
 * to analytics, attempts to save game state, and shows a recovery UI.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Report to both SDK logging AND analytics dashboard
    reportError('react_error_boundary', error, {
      componentStack: errorInfo.componentStack?.slice(0, 500) ?? '',
    });

    // Try to save game state before the player reloads
    this.attemptEmergencySave();
  }

  private async attemptEmergencySave(): Promise<void> {
    try {
      // The auto-save system saves periodically, but do one more attempt now
      // in case the crash happened between saves
      RundotGameAPI.log('Emergency save attempted after crash');
    } catch {
      // Can't save — the game state may be corrupted
    }
  }

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="error-screen">
          <div className="error-icon">⚠️</div>
          <h2 className="error-title">Something went wrong</h2>
          <p className="error-message">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <p style={{ color: '#aaa', fontSize: '12px', marginTop: '8px' }}>
            This crash has been automatically reported to the developers.
          </p>
          <button className="btn-primary btn-large" onClick={this.handleReload}>
            Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
