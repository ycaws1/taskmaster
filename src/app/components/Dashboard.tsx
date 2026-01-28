'use client';

import { createCategory, reorderCategories } from '@/app/lib/actions';
import { CategoryCard } from './CategoryCard';
import { Plus, LogOut, LayoutGrid, List, GripVertical } from 'lucide-react';
import { useState, useRef, useCallback } from 'react';
import { signOut } from 'next-auth/react';

interface Category {
    id: string;
    name: string;
    order: number;
    items: {
        id: string;
        text: string;
        completed: boolean;
    }[];
}

interface DashboardProps {
    categories: Category[];
    user: any;
}

export function Dashboard({ categories: initialCategories, user }: DashboardProps) {
    const [newCategoryName, setNewCategoryName] = useState('');
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [categories, setCategories] = useState(initialCategories);
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);
    const dragCounter = useRef(0);

    // Sync with server-side categories when they change
    const categoriesKey = initialCategories.map(c => c.id).join(',');
    const [prevCategoriesKey, setPrevCategoriesKey] = useState(categoriesKey);
    if (categoriesKey !== prevCategoriesKey) {
        setPrevCategoriesKey(categoriesKey);
        setCategories(initialCategories);
    }

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;

        await createCategory(newCategoryName);
        setNewCategoryName('');
        setShowAddCategory(false);
    };

    const handleDragStart = useCallback((e: React.DragEvent, categoryId: string) => {
        setDraggedId(categoryId);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', categoryId);

        // Add a slight delay for the drag image
        const target = e.currentTarget as HTMLElement;
        setTimeout(() => {
            target.style.opacity = '0.5';
        }, 0);
    }, []);

    const handleDragEnd = useCallback((e: React.DragEvent) => {
        const target = e.currentTarget as HTMLElement;
        target.style.opacity = '1';
        setDraggedId(null);
        setDragOverId(null);
        dragCounter.current = 0;
    }, []);

    const handleDragEnter = useCallback((e: React.DragEvent, categoryId: string) => {
        e.preventDefault();
        dragCounter.current++;
        if (categoryId !== draggedId) {
            setDragOverId(categoryId);
        }
    }, [draggedId]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        dragCounter.current--;
        if (dragCounter.current === 0) {
            setDragOverId(null);
        }
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        dragCounter.current = 0;

        const sourceId = e.dataTransfer.getData('text/plain');
        if (sourceId === targetId) {
            setDraggedId(null);
            setDragOverId(null);
            return;
        }

        // Find indices
        const sourceIndex = categories.findIndex(c => c.id === sourceId);
        const targetIndex = categories.findIndex(c => c.id === targetId);

        if (sourceIndex === -1 || targetIndex === -1) return;

        // Create new order (optimistic update)
        const newCategories = [...categories];
        const [removed] = newCategories.splice(sourceIndex, 1);
        newCategories.splice(targetIndex, 0, removed);

        setCategories(newCategories);
        setDraggedId(null);
        setDragOverId(null);

        // Save to server
        await reorderCategories(newCategories.map(c => c.id));
    }, [categories]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 text-zinc-900 dark:from-zinc-950 dark:to-black dark:text-zinc-50">
            {/* Header */}
            <header className="sticky top-0 z-10 border-b border-zinc-200/50 bg-white/70 px-4 py-3 backdrop-blur-xl dark:border-zinc-800/50 dark:bg-black/70 sm:px-6 sm:py-4">
                <div className="mx-auto flex max-w-7xl items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/30">
                            <span className="text-xl font-bold">T</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold leading-none">TaskMaster</h1>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">Collaborative Workspace</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800 sm:flex">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`rounded-md p-1.5 transition-all ${viewMode === 'grid'
                                    ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white'
                                    : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400'
                                    }`}
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`rounded-md p-1.5 transition-all ${viewMode === 'list'
                                    ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white'
                                    : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400'
                                    }`}
                            >
                                <List className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="h-8 w-[1px] bg-zinc-200 dark:bg-zinc-800" />

                        <div className="flex items-center gap-2">
                            <span className="hidden text-sm font-medium sm:inline-block">
                                {user?.name || user?.email}
                            </span>
                            <button
                                onClick={() => signOut()}
                                className="flex items-center gap-2 rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                            >
                                <LogOut className="h-4 w-4" />
                                <span className="hidden sm:inline">Sign Out</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="mx-auto max-w-7xl p-4 sm:p-6">
                <div className="mb-6 flex items-center justify-between sm:mb-8">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Categories</h2>
                        <span className="rounded-md bg-zinc-200/70 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                            Drag to reorder
                        </span>
                    </div>
                    <button
                        onClick={() => setShowAddCategory(!showAddCategory)}
                        className="flex items-center gap-1.5 rounded-full bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-500/30 transition-all hover:bg-indigo-700 hover:shadow-indigo-500/40 active:scale-95 sm:gap-2 sm:px-4"
                    >
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">New Category</span>
                        <span className="sm:hidden">Add</span>
                    </button>
                </div>

                {/* Add Category Form */}
                {showAddCategory && (
                    <div className="mb-8 animate-in fade-in slide-in-from-top-4">
                        <form onSubmit={handleCreateCategory} className="flex gap-2">
                            <input
                                autoFocus
                                type="text"
                                placeholder="Category Name"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                className="w-full max-w-md rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                            />
                            <button
                                type="submit"
                                className="rounded-xl bg-zinc-900 px-6 py-3 font-medium text-white transition-all hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                            >
                                Create
                            </button>
                        </form>
                    </div>
                )}

                {/* Categories Grid/List */}
                <div className={`
                    ${viewMode === 'grid'
                        ? 'grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3'
                        : 'flex flex-col gap-4 sm:gap-6'
                    }
                `}>
                    {categories.map((category) => (
                        <div
                            key={category.id}
                            className={`
                                relative
                                ${viewMode === 'grid' ? 'h-auto sm:h-[400px]' : 'h-auto'}
                                ${draggedId === category.id ? 'opacity-50' : ''}
                                ${dragOverId === category.id ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-xl transition-all' : ''}
                            `}
                            draggable
                            onDragStart={(e) => handleDragStart(e, category.id)}
                            onDragEnd={handleDragEnd}
                            onDragEnter={(e) => handleDragEnter(e, category.id)}
                            onDragLeave={handleDragLeave}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, category.id)}
                        >
                            {/* Drag Handle Indicator */}
                            <div className="absolute -left-1 top-1/2 -translate-y-1/2 -translate-x-full opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing hidden sm:flex items-center justify-center z-10 pr-2">
                                <GripVertical className="h-5 w-5 text-zinc-400" />
                            </div>
                            <CategoryCard category={category} />
                        </div>
                    ))}

                    {categories.length === 0 && !showAddCategory && (
                        <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 py-20 text-center dark:border-zinc-700">
                            <div className="mb-4 rounded-full bg-zinc-100 p-4 dark:bg-zinc-800">
                                <LayoutGrid className="h-8 w-8 text-zinc-400" />
                            </div>
                            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">No categories yet</h3>
                            <p className="text-zinc-500">Create your first category to get started</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
