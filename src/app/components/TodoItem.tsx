'use client';

import { toggleTodo, deleteTodo, updateTodoText, updateTodoNotification } from '@/app/lib/actions';
import { Trash2, CheckCircle, Circle, Loader2, Bell, X, Calendar } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface TodoItemProps {
    todo: {
        id: string;
        text: string;
        completed: boolean;
        notificationAt?: string | null;
    };
    isHighlighted?: boolean;
    onDelete?: (id: string) => void;
    onToggle?: (id: string, completed: boolean) => void;
}

function NotificationTime({ date }: { date: string }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return <span>{new Date(date).toLocaleString(undefined, { month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' })}</span>;
}

export function TodoItem({ todo, isHighlighted = false, onDelete, onToggle }: TodoItemProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(todo.text);
    const [completed, setCompleted] = useState(todo.completed);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    // Sync text with props when todo changes from server
    useEffect(() => {
        setText(todo.text);
    }, [todo.text]);

    // Sync completed status with props when todo changes from server
    useEffect(() => {
        setCompleted(todo.completed);
    }, [todo.completed]);

    const [notificationAt, setNotificationAt] = useState(todo.notificationAt);
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        setNotificationAt(todo.notificationAt);
    }, [todo.notificationAt]);

    // Check expiry every minute
    useEffect(() => {
        const checkExpiry = () => {
            if (notificationAt) {
                setIsExpired(new Date(notificationAt) < new Date());
            } else {
                setIsExpired(false);
            }
        };

        checkExpiry(); // Check immediately
        const interval = setInterval(checkExpiry, 1000); // Check every second
        return () => clearInterval(interval);
    }, [notificationAt]);

    const handleUpdate = async () => {
        setIsEditing(false);
        if (text !== todo.text) {
            setIsUpdating(true);
            await updateTodoText(todo.id, text);
            setIsUpdating(false);
        }
    };

    const handleNotificationUpdate = async (date: string) => {
        setIsUpdating(true);
        // Optimistically update local state
        const notificationDate = date ? new Date(date) : null;
        setNotificationAt(notificationDate ? notificationDate.toISOString() : null);

        await updateTodoNotification(todo.id, notificationDate);
        setIsUpdating(false);
    };

    const handleToggle = async () => {
        // Optimistically update UI
        const newCompleted = !completed;
        setCompleted(newCompleted);
        // Notify parent for count update
        onToggle?.(todo.id, newCompleted);
        // Update server in background
        await toggleTodo(todo.id, newCompleted);
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        await deleteTodo(todo.id);
        onDelete?.(todo.id);
        // Note: setIsDeleting(false) not needed as component will unmount
    };

    return (
        <div className={`group flex items-center justify-between gap-3 rounded-lg p-3 shadow-sm backdrop-blur-sm transition-all ${isHighlighted
            ? 'bg-indigo-100 ring-2 ring-indigo-500 scale-[1.02] dark:bg-indigo-900/50'
            : 'bg-white/50 hover:bg-white/80 dark:bg-zinc-800/50 dark:hover:bg-zinc-800/80'
            }`}>
            <div className="flex flex-1 items-center gap-3">
                <button
                    onClick={handleToggle}
                    className={`flex-shrink-0 transition-colors ${completed ? 'text-green-500' : 'text-zinc-400 hover:text-zinc-600'
                        }`}
                >
                    {completed ? (
                        <CheckCircle className="h-5 w-5" />
                    ) : (
                        <Circle className="h-5 w-5" />
                    )}
                </button>

                {isEditing ? (
                    <input
                        ref={inputRef}
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onBlur={handleUpdate}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUpdate();
                        }}
                        className="w-full bg-transparent text-sm text-zinc-900 focus:outline-none dark:text-zinc-100"
                    />
                ) : (
                    <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                            <span
                                onClick={() => setIsEditing(true)}
                                className={`cursor-pointer text-sm transition-all ${isHighlighted
                                    ? 'text-indigo-900 font-semibold dark:text-indigo-100'
                                    : completed
                                        ? 'text-zinc-400 line-through'
                                        : 'text-zinc-900 dark:text-zinc-100'
                                    }`}
                            >
                                {text}
                            </span>
                            {isUpdating && (
                                <Loader2 className="h-3 w-3 animate-spin text-indigo-500" />
                            )}
                        </div>
                        {/* Notification Indicator */}
                        {notificationAt && (
                            <div className={`flex items-center gap-1 text-[10px] font-medium ${isExpired ? 'text-zinc-400 line-through' : 'text-indigo-500'
                                }`}>
                                <Calendar className="h-3 w-3" />
                                <NotificationTime date={notificationAt} />
                                <button
                                    onClick={() => handleNotificationUpdate('')}
                                    className="ml-1 text-zinc-400 hover:text-red-500 no-underline"
                                >
                                    <X className="h-2.5 w-2.5" />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="flex items-center gap-1">
                {/* Notification Dropdown/Picker */}
                <div className="relative group/notif">
                    <button className="rounded-lg p-1.5 text-zinc-400 transition-all hover:bg-indigo-50 hover:text-indigo-500 sm:opacity-0 sm:group-hover:opacity-100 dark:hover:bg-indigo-900/20">
                        <Bell className={`h-4 w-4 ${notificationAt ? 'fill-indigo-500 text-indigo-500' : ''}`} />
                    </button>
                    <input
                        type="datetime-local"
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        value={notificationAt ? new Date(notificationAt).toISOString().slice(0, 16) : ''}
                        onChange={(e) => handleNotificationUpdate(e.target.value)}
                    />
                </div>

                <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="rounded-lg p-1.5 text-red-500 transition-all hover:bg-red-50 hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100 dark:hover:bg-red-900/20 disabled:opacity-50"
                >
                    {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Trash2 className="h-4 w-4" />
                    )}
                </button>
            </div>
        </div>
    );
}
