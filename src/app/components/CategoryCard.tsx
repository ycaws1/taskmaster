'use client';

import { createTodo, deleteCategory } from '@/app/lib/actions';
import { TodoItem } from './TodoItem';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface CategoryCardProps {
    category: {
        id: string;
        name: string;
        items: {
            id: string;
            text: string;
            completed: boolean;
        }[];
    };
}

export function CategoryCard({ category }: CategoryCardProps) {
    const [newTodo, setNewTodo] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const handleAddTodo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTodo.trim()) return;

        setIsAdding(true);
        await createTodo(newTodo, category.id);
        setNewTodo('');
        setIsAdding(false);
    };

    return (
        <div className="group flex h-full min-w-[300px] flex-col rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 shadow-sm backdrop-blur-md transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/50">
            <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{category.name}</h3>
                <button
                    onClick={() => deleteCategory(category.id)}
                    className="text-zinc-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100 dark:text-zinc-500"
                    title="Delete Category"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>

            <div className="mb-4 flex-1 space-y-2 overflow-y-auto pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-700">
                {category.items.length === 0 ? (
                    <div className="py-8 text-center text-sm text-zinc-400 italic">No tasks yet</div>
                ) : (
                    category.items.map((todo) => <TodoItem key={todo.id} todo={todo} />)
                )}
            </div>

            <form onSubmit={handleAddTodo} className="mt-auto">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Add a new task..."
                        value={newTodo}
                        onChange={(e) => setNewTodo(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 pr-10 text-sm shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    />
                    <button
                        type="submit"
                        disabled={isAdding || !newTodo.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-indigo-500 hover:bg-indigo-50 disabled:opacity-50 dark:hover:bg-indigo-900/20"
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                </div>
            </form>
        </div>
    );
}
