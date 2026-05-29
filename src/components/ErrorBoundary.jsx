import React from 'react';

const isChunkLoadError = (error) => {
    const message = error?.message || error?.toString?.() || '';
    return message.includes('Failed to fetch dynamically imported module')
        || message.includes('Importing a module script failed')
        || message.includes('Loading chunk')
        || message.includes('ChunkLoadError');
};

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Uncaught error:', error, errorInfo);
        this.setState({ errorInfo });
    }

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (!this.state.hasError) {
            return this.props.children;
        }

        const chunkError = isChunkLoadError(this.state.error);

        return (
            <div className="flex min-h-screen items-center justify-center bg-bg px-6 py-12 text-text">
                <div className="glass w-full max-w-2xl rounded-3xl border border-white/10 p-8 md:p-10">
                    <div className="mb-4 inline-flex rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-xs font-bold uppercase tracking-[0.3em] text-primary">
                        VitaZone
                    </div>

                    <h1 className="mb-4 text-3xl font-bold md:text-4xl">
                        {chunkError ? 'Strona została zaktualizowana' : 'Wystąpił nieoczekiwany problem'}
                    </h1>

                    <p className="mb-6 max-w-xl text-base leading-7 text-gray-300">
                        {chunkError
                            ? 'Wygląda na to, że ta karta korzysta jeszcze ze starszej wersji plików. Odśwież stronę, aby wczytać najnowszą wersję VitaZone.'
                            : 'Coś poszło nie tak podczas ładowania strony. Odśwież widok i spróbuj ponownie.'}
                    </p>

                    <div className="flex flex-wrap gap-4">
                        <button
                            type="button"
                            onClick={this.handleReload}
                            className="rounded-xl bg-primary px-6 py-3 font-bold text-black transition-colors hover:bg-white"
                        >
                            Odśwież stronę
                        </button>
                    </div>

                    {!chunkError && this.state.error && (
                        <details className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-gray-400">
                            <summary className="cursor-pointer font-semibold text-white">Szczegóły techniczne</summary>
                            <p className="mt-4 whitespace-pre-wrap break-words">
                                {this.state.error.toString()}
                            </p>
                            {this.state.errorInfo?.componentStack && (
                                <pre className="mt-4 overflow-x-auto whitespace-pre-wrap text-xs text-gray-500">
                                    {this.state.errorInfo.componentStack}
                                </pre>
                            )}
                        </details>
                    )}
                </div>
            </div>
        );
    }
}

export default ErrorBoundary;
