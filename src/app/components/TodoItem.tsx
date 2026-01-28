'use client';

import { toggleTodo, deleteTodo, updateTodoText } from '@/app/lib/actions';
import { Trash2, CheckCircle, Circle } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface TodoItemProps {
    todo: {
        id: string;
        text: string;
        completed: boolean;
    };
    isHighlighted?: boolean;
}

export function TodoItem({ todo, isHighlighted = false }: TodoItemProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(todo.text);
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
            await updateTodoText(todo.id, text);
        }
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
                )}
            </div>

            <button
                onClick={() => deleteTodo(todo.id)}
                className="rounded-lg p-1.5 text-red-500 transition-all hover:bg-red-50 hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100 dark:hover:bg-red-900/20"
            >
                <Trash2 className="h-4 w-4" />
            </button>
        </div>
    );
}
