'use client';

export default function Loading() {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black">
            {/* Top progress bar */}
            <div className="fixed top-0 left-0 right-0 h-1 bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 animate-loading-bar"
                    style={{
                        width: '40%',
                    }}
                />
            </div>

            {/* Center loading indicator */}
            <div className="flex flex-col items-center gap-6">
                {/* Logo */}
                <div className="relative">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-2xl shadow-indigo-500/40 animate-pulse">
                        <span className="text-3xl font-bold">T</span>
                    </div>
                    {/* Animated ring */}
                    <div className="absolute -inset-2 rounded-2xl border-2 border-indigo-400/30 animate-ping" />
                </div>

                {/* Loading text */}
                <div className="flex flex-col items-center gap-2">
                    <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
                        TaskMaster
                    </h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 animate-pulse">
                        Loading your workspace...
                    </p>
                </div>

                {/* Animated dots */}
                <div className="flex gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            </div>
        </div>
    );
}
