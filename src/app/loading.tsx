'use client';

export default function Loading() {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900 transition-colors duration-500">
            {/* Glossy Background Effect */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[25%] -left-[25%] w-[150%] h-[150%] bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.08)_0%,transparent_70%)] dark:bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.15)_0%,transparent_70%)] animate-pulse" />
            </div>

            {/* Top progress bar with neon effect */}
            <div className="fixed top-0 left-0 right-0 h-1 bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.8)] animate-loading-bar"
                    style={{
                        width: '40%',
                    }}
                />
            </div>

            {/* Center loading indicator */}
            <div className="relative z-10 flex flex-col items-center gap-8">
                {/* Logo with improved animation */}
                <div className="relative group">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-2xl shadow-indigo-500/40 animate-bounce">
                        <span className="text-4xl font-bold tracking-tighter">T</span>
                    </div>
                    {/* Pulsing Outer Ring */}
                    <div className="absolute -inset-4 rounded-3xl border-2 border-indigo-400/20 animate-ping" style={{ animationDuration: '3s' }} />
                    <div className="absolute -inset-2 rounded-2xl border-2 border-indigo-400/40 animate-pulse" />
                </div>

                {/* Loading text and dots */}
                <div className="flex flex-col items-center gap-4">
                    <div className="flex flex-col items-center gap-1">
                        <h2 className="text-xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100">
                            TaskMaster
                        </h2>
                        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 animate-pulse">
                            Securely loading your workspace...
                        </p>
                    </div>

                    {/* Modern Dot Loader */}
                    <div className="flex gap-2.5">
                        {[0, 150, 300].map((delay) => (
                            <div
                                key={delay}
                                className="h-2.5 w-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.4)] animate-bounce"
                                style={{ animationDelay: `${delay}ms` }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer message */}
            <div className="fixed bottom-10 left-0 right-0 text-center">
                <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-zinc-400 dark:text-zinc-600">
                    Preparing Environment
                </span>
            </div>
        </div>
    );
}
