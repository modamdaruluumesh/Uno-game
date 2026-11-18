import React from 'react';
import {RotateCcw} from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  {children: React.ReactNode},
  ErrorBoundaryState
> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = {hasError: false, message: ''};
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'An unexpected error occurred.',
    };
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-dvh w-full flex items-center justify-center bg-[#082518] text-white p-6">
          <div className="max-w-md w-full bg-stone-950 border border-white/15 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
            <h1
              className="text-xl font-bold"
              style={{fontFamily: 'var(--font-display)'}}
            >
              Something Went Wrong
            </h1>
            <p className="text-xs text-stone-400 break-words">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-sm font-bold cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reload Table</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
