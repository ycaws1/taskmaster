'use client';

import { toggleTodo, deleteTodo, updateTodoText } from '@/app/lib/actions';
import { Trash2, CheckCircle, Circle, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface TodoItemProps {
    todo: {
        id: string;
        text: string;
        completed: boolean;
    };
    isHighlighted?: boolean;
    onDelete?: (id: string) => void;
}

export function TodoItem({ todo, isHighlighted = false, onDelete }: TodoItemProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(todo.text);
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

    const handleUpdate = async () => {
        setIsEditing(false);
        if (text !== todo.text) {
            setIsUpdating(true);
            await updateTodoText(todo.id, text);
            setIsUpdating(false);
        }
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
                    onClick={() => toggleTodo(todo.id, !todo.completed)}
                    className={`flex-shrink-0 transition-colors ${todo.completed ? 'text-green-500' : 'text-zinc-400 hover:text-zinc-600'
                        }`}
                >
                    {todo.completed ? (
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
                    <div className="flex items-center gap-2">
                        <span
                            onClick={() => setIsEditing(true)}
                            className={`cursor-pointer text-sm transition-all ${isHighlighted
                                ? 'text-indigo-900 font-semibold dark:text-indigo-100'
                                : todo.completed
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
                )}
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
    );
}
