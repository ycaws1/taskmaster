'use client';

import { createCategory } from '@/app/lib/actions';
import { CategoryCard } from './CategoryCard';
import { Plus, LogOut, LayoutGrid, List } from 'lucide-react';
import { useState } from 'react';
import { signOut } from 'next-auth/react';

interface DashboardProps {
    categories: any[];
    user: any;
}

export function Dashboard({ categories, user }: DashboardProps) {
    const [newCategoryName, setNewCategoryName] = useState('');
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;

        await createCategory(newCategoryName);
        setNewCategoryName('');
        setShowAddCategory(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 text-zinc-900 dark:from-zinc-950 dark:to-black dark:text-zinc-50">
            {/* Header */}
            <header className="sticky top-0 z-10 border-b border-zinc-200/50 bg-white/70 px-6 py-4 backdrop-blur-xl dark:border-zinc-800/50 dark:bg-black/70">
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
            <main className="mx-auto max-w-7xl p-6">
                <div className="mb-8 flex items-center justify-between">
                    <h2 className="text-2xl font-bold tracking-tight">Your Categories</h2>
                    <button
                        onClick={() => setShowAddCategory(!showAddCategory)}
                        className="flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-500/30 transition-all hover:bg-indigo-700 hover:shadow-indigo-500/40 active:scale-95"
                    >
                        <Plus className="h-4 w-4" />
                        New Category
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
                        ? 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'
                        : 'flex flex-col gap-6'
                    }
        `}>
                    {categories.map((category) => (
                        <div key={category.id} className={`${viewMode === 'grid' ? 'h-[400px]' : 'h-auto'}`}>
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
