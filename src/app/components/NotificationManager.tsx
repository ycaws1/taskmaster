'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, BellOff } from 'lucide-react';
import { subscribeUser } from '@/app/lib/actions';

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function NotificationManager() {
    const [isSupported, setIsSupported] = useState(false);
    const [subscription, setSubscription] = useState<PushSubscription | null>(null);
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [error, setError] = useState<string>('');
    const [status, setStatus] = useState<string>('');
    const router = useRouter();

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            setPermission(Notification.permission);
            registerServiceWorker();
        }
    }, []);

    // Poll for notifications logic removed. Python backend handles this.
    // We can just rely on the service worker to receive push messages.

    // ... (rest of the component)

    async function registerServiceWorker() {
        setStatus('Initializing SW...');
        try {
            const swUrl = process.env.NODE_ENV === 'development' ? '/push-sw.js' : '/sw.js';
            console.log('Registering service worker:', swUrl);

            const reg = await navigator.serviceWorker.register(swUrl);
            console.log('Service Worker registered with scope:', reg.scope);

            // Wait for service worker to be ready with a timeout
            const readyPromise = navigator.serviceWorker.ready;
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Service Worker ready timeout')), 10000)
            );

            setStatus('Waiting for SW ready...');
            const registration = await Promise.race([readyPromise, timeoutPromise]) as ServiceWorkerRegistration;

            const sub = await registration.pushManager.getSubscription();
            if (sub) {
                setSubscription(sub);
                await subscribeToPush(sub);
            } else if (Notification.permission === 'granted') {
                await subscribeToPush();
            }
        } catch (error) {
            console.error('Error checking subscription:', error);
            setError('SW Setup Failed: ' + (error instanceof Error ? error.message : String(error)));
            setStatus('Failed.');
        }
    }

    async function subscribeToPush(existingSub?: PushSubscription) {
        setError('');
        setStatus('Starting...');
        try {
            setStatus('Connecting to SW...');
            const registration = await Promise.race([
                navigator.serviceWorker.ready,
                new Promise((_, reject) => setTimeout(() => reject(new Error('SW ready timeout')), 10000))
            ]) as ServiceWorkerRegistration;
            let sub = existingSub;

            if (!sub) {
                setStatus('Checking VAPID key...');
                const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
                if (!vapidPublicKey) {
                    throw new Error('No VAPID public key found');
                }

                setStatus('Subscribing with PushManager...');
                sub = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
                });
            }

            setStatus('Updating state...');
            setSubscription(sub);
            setPermission('granted');

            setStatus('Sending to server...');
            const subJson = sub.toJSON();
            await subscribeUser(subJson);

            setStatus('Done!');
            console.log('Subscribed successfully!');
        } catch (error: any) {
            console.error('Failed to subscribe:', error);
            setStatus('Failed.');
            setError(error.message || String(error));
            if (Notification.permission === 'denied') {
                setPermission('denied');
            }
        }
    }

    if (!isSupported) return null;

    if (permission === 'granted' && subscription) {
        return (
            <div className="fixed bottom-4 left-4 z-50">
                <button
                    onClick={async () => {
                        console.log("Test button clicked");
                        try {
                            const payload = { subscription: subscription.toJSON() };
                            console.log("Sending payload:", payload);

                            const res = await fetch('/api/notifications/test', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(payload),
                            });

                            const data = await res.json();
                            console.log("Server response:", res.status, data);

                            if (!res.ok) throw new Error(data.error || 'Failed to send');
                            console.log('Server said: Sent! Check your notification center.');
                        } catch (e: any) {
                            console.error('Test failed', e);
                        }
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 shadow-md hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400"
                    title="Test Notification"
                >
                    <Bell className="h-4 w-4" />
                </button>
            </div>
        );
    }

    if (permission === 'granted' && !subscription) {
        return (
            <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-800 shadow-lg ring-1 ring-red-200 dark:bg-red-900/20 dark:text-red-300 dark:ring-red-800">
                <div className="flex items-center gap-2">
                    <span>Connection failed.</span>
                    <button
                        onClick={() => subscribeToPush()}
                        className="font-semibold underline hover:text-red-600 dark:hover:text-red-200"
                    >
                        Retry
                    </button>
                </div>
                {status && <div className="text-[10px] opacity-75">{status}</div>}
                {error && <div className="font-mono text-[10px] opacity-75 break-all max-w-[250px]">{error}</div>}
            </div>
        );
    }


    // Don't show banner if already granted (even if subscription is missing/failed) or denied
    if (permission !== 'default') return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4">
            <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-xl ring-1 ring-zinc-200 dark:bg-zinc-800 dark:ring-zinc-700">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                    <Bell className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        Enable Notifications
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-[200px]">
                        Get alerted when your tasks are due.
                    </p>
                </div>
                <button
                    onClick={async () => {
                        const perm = await Notification.requestPermission();
                        setPermission(perm);
                        if (perm === 'granted') {
                            await subscribeToPush();
                        }
                    }}
                    className="ml-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500"
                >
                    Allow
                </button>

                <button
                    onClick={() => setIsSupported(false)} // Dismiss for session
                    className="ml-2 rounded-lg p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                    <div className="sr-only">Dismiss</div>
                    <BellOff className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
