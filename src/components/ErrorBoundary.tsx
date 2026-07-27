"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', backgroundColor: '#ffcccc', color: 'black', zIndex: 9999, position: 'relative', width: '100%' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>React Error:</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px', marginTop: '10px' }}>{this.state.error?.toString()}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '10px', marginTop: '10px' }}>{this.state.error?.stack}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}
