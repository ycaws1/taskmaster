"use client";

import { useActionState } from "react";
import { authenticate } from "@/app/lib/actions";

export default function LoginPage() {
    const [errorMessage, formAction, isPending] = useActionState(authenticate, undefined);

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-zinc-900">
            <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-md dark:bg-zinc-800">
                <h1 className="mb-6 text-center text-2xl font-bold text-gray-900 dark:text-white">
                    Todo App Login
                </h1>
                <form action={formAction} className="space-y-4">
                    <div>
                        <label
                            htmlFor="username" // Use username instead of email/password based on auth.ts
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            Username
                        </label>
                        <input
                            type="text"
                            name="username"
                            id="username"
                            required
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            Password
                        </label>
                        <input
                            type="password"
                            name="password"
                            id="password"
                            required
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input
                                id="remember_me"
                                name="remember_me"
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700"
                            />
                            <label
                                htmlFor="remember_me"
                                className="ml-2 block text-sm text-gray-900 dark:text-gray-300"
                            >
                                Remember me
                            </label>
                        </div>
                    </div>
                    {errorMessage && (
                        <div className="text-red-500 text-sm">{errorMessage}</div>
                    )}
                    <button
                        type="submit"
                        aria-disabled={isPending}
                        className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-zinc-800"
                    >
                        {isPending ? 'Signing in...' : 'Sign in'}
                    </button>
                </form>
            </div>
        </div>
    );
}
