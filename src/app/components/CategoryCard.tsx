'use client';

import { createTodo, deleteCategory } from '@/app/lib/actions';
import { TodoItem } from './TodoItem';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
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
    const [isExpanded, setIsExpanded] = useState(false);

    const handleAddTodo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTodo.trim()) return;

        setIsAdding(true);
        await createTodo(newTodo, category.id);
        setNewTodo('');
        setIsAdding(false);
    };

    const completedCount = category.items.filter(item => item.completed).length;
    const totalCount = category.items.length;

    return (
        <div className="group flex flex-col rounded-xl border border-zinc-200 bg-zinc-50/50 shadow-sm backdrop-blur-md transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/50">
            {/* Header - Always visible, clickable on mobile */}
            <div
                className="flex items-center justify-between p-4 cursor-pointer sm:cursor-default"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    {/* Expand/Collapse icon - mobile only */}
                    <span className="sm:hidden text-zinc-400">
                        {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <ChevronRight className="h-4 w-4" />
                        )}
                    </span>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{category.name}</h3>
                    {/* Item count badge */}
                    <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                        {completedCount}/{totalCount}
                    </span>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        deleteCategory(category.id);
                    }}
                    className="rounded-lg p-1.5 text-zinc-400 transition-all hover:bg-red-50 hover:text-red-500 sm:opacity-0 sm:group-hover:opacity-100 dark:text-zinc-500 dark:hover:bg-red-900/20"
                    title="Delete Category"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>

            {/* Content - Collapsible on mobile, always visible on desktop */}
            <div className={`
                flex-1 flex flex-col overflow-hidden transition-all duration-200
                ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}
                sm:max-h-none sm:opacity-100
            `}>
                <div className="flex-1 space-y-2 overflow-y-auto px-4 pb-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-700">
                    {category.items.length === 0 ? (
                        <div className="py-4 text-center text-sm text-zinc-400 italic">No tasks yet</div>
                    ) : (
                        category.items.map((todo) => <TodoItem key={todo.id} todo={todo} />)
                    )}
                </div>

                <form onSubmit={handleAddTodo} className="p-4 pt-2">
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
        </div>
    );
}
