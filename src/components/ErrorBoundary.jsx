import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("Uncaught Error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: 24, textAlign: 'center', fontFamily: 'sans-serif' }}>
                    <h1 style={{ color: '#e53e3e' }}>Something went wrong.</h1>
                    <details style={{ whiteSpace: 'pre-wrap', marginTop: 16, textAlign: 'left', background: '#f7fafc', padding: 12 }}>
                        {this.state.error && this.state.error.toString()}
                        <br />
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </details>
                    <button
                        onClick={() => window.location.reload()}
                        style={{ marginTop: 20, padding: '10px 20px', background: '#3182ce', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                    >
                        Reload Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
