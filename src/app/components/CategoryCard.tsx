'use client';

import { createTodo, deleteCategory, reorderTodos, updateCategoryName } from '@/app/lib/actions';
import { TodoItem } from './TodoItem';
import { Plus, Trash2, ChevronDown, ChevronRight, Shuffle, GripVertical, Pencil } from 'lucide-react';
import { useState, useRef, useCallback, useEffect } from 'react';

interface TodoItemType {
    id: string;
    text: string;
    completed: boolean;
    order: number;
}

interface CategoryCardProps {
    category: {
        id: string;
        name: string;
        items: TodoItemType[];
    };
}

export function CategoryCard({ category }: CategoryCardProps) {
    const [newTodo, setNewTodo] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isSpinning, setIsSpinning] = useState(false);

    // Category name editing state
    const [isEditingName, setIsEditingName] = useState(false);
    const [categoryName, setCategoryName] = useState(category.name);
    const nameInputRef = useRef<HTMLInputElement>(null);

    // Focus input when editing starts
    useEffect(() => {
        if (isEditingName && nameInputRef.current) {
            nameInputRef.current.focus();
            nameInputRef.current.select();
        }
    }, [isEditingName]);

    // Sync category name with props
    useEffect(() => {
        setCategoryName(category.name);
    }, [category.name]);

    const handleNameUpdate = async () => {
        setIsEditingName(false);
        const trimmedName = categoryName.trim();
        if (trimmedName && trimmedName !== category.name) {
            await updateCategoryName(category.id, trimmedName);
        } else {
            setCategoryName(category.name); // Reset if empty or unchanged
        }
    };

    // Drag and drop state for items
    const [items, setItems] = useState(category.items);
    const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
    const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);
    const dragCounter = useRef(0);

    // Sync items with props when category changes
    const itemsKey = category.items.map(i => i.id).join(',');
    const [prevItemsKey, setPrevItemsKey] = useState(itemsKey);
    if (itemsKey !== prevItemsKey) {
        setPrevItemsKey(itemsKey);
        setItems(category.items);
    }

    const handleAddTodo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTodo.trim()) return;

        setIsAdding(true);
        await createTodo(newTodo, category.id);
        setNewTodo('');
        setIsAdding(false);
    };

    const handleRandomPick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const uncompletedItems = items.filter(item => !item.completed);
        if (uncompletedItems.length === 0) return;

        setIsSpinning(true);
        setSelectedId(null);

        // Animate through random items
        let count = 0;
        const maxCount = 10;
        const interval = setInterval(() => {
            const randomIndex = Math.floor(Math.random() * uncompletedItems.length);
            setSelectedId(uncompletedItems[randomIndex].id);
            count++;

            if (count >= maxCount) {
                clearInterval(interval);
                setIsSpinning(false);
                // Keep the final selection
                const finalIndex = Math.floor(Math.random() * uncompletedItems.length);
                setSelectedId(uncompletedItems[finalIndex].id);

                // Clear selection after 3 seconds
                setTimeout(() => {
                    setSelectedId(null);
                }, 3000);
            }
        }, 100);
    };

    // Drag handlers for items
    const handleDragStart = useCallback((e: React.DragEvent, itemId: string) => {
        e.stopPropagation(); // Prevent category drag
        setDraggedItemId(itemId);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', itemId);
        e.dataTransfer.setData('application/x-todo-item', 'true');

        const target = e.currentTarget as HTMLElement;
        setTimeout(() => {
            target.style.opacity = '0.5';
        }, 0);
    }, []);

    const handleDragEnd = useCallback((e: React.DragEvent) => {
        const target = e.currentTarget as HTMLElement;
        target.style.opacity = '1';
        setDraggedItemId(null);
        setDragOverItemId(null);
        dragCounter.current = 0;
    }, []);

    const handleDragEnter = useCallback((e: React.DragEvent, itemId: string) => {
        e.preventDefault();
        e.stopPropagation();
        // Only handle if this is a todo item drag
        if (!e.dataTransfer.types.includes('application/x-todo-item')) return;

        dragCounter.current++;
        if (itemId !== draggedItemId) {
            setDragOverItemId(itemId);
        }
    }, [draggedItemId]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current--;
        if (dragCounter.current === 0) {
            setDragOverItemId(null);
        }
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current = 0;

        // Only handle if this is a todo item drag
        if (!e.dataTransfer.types.includes('application/x-todo-item')) return;

        const sourceId = e.dataTransfer.getData('text/plain');
        if (sourceId === targetId) {
            setDraggedItemId(null);
            setDragOverItemId(null);
            return;
        }

        // Find indices
        const sourceIndex = items.findIndex(i => i.id === sourceId);
        const targetIndex = items.findIndex(i => i.id === targetId);

        if (sourceIndex === -1 || targetIndex === -1) return;

        // Create new order (optimistic update)
        const newItems = [...items];
        const [removed] = newItems.splice(sourceIndex, 1);
        newItems.splice(targetIndex, 0, removed);

        setItems(newItems);
        setDraggedItemId(null);
        setDragOverItemId(null);

        // Save to server
        await reorderTodos(category.id, newItems.map(i => i.id));
    }, [items, category.id]);

    const completedCount = items.filter(item => item.completed).length;
    const totalCount = items.length;
    const uncompletedCount = totalCount - completedCount;

    return (
        <div className="group flex flex-col rounded-xl border border-zinc-200 bg-zinc-50/50 shadow-sm backdrop-blur-md transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/50 h-full">
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
                    {isEditingName ? (
                        <input
                            ref={nameInputRef}
                            type="text"
                            value={categoryName}
                            onChange={(e) => setCategoryName(e.target.value)}
                            onBlur={handleNameUpdate}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleNameUpdate();
                                if (e.key === 'Escape') {
                                    setCategoryName(category.name);
                                    setIsEditingName(false);
                                }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="text-lg font-bold text-zinc-900 dark:text-zinc-100 bg-transparent border-b-2 border-indigo-500 outline-none w-32 sm:w-auto"
                        />
                    ) : (
                        <h3
                            className="text-lg font-bold text-zinc-900 dark:text-zinc-100 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group/title flex items-center gap-1"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsEditingName(true);
                            }}
                            title="Click to edit"
                        >
                            {categoryName}
                            <Pencil className="h-3 w-3 opacity-0 group-hover/title:opacity-50 transition-opacity" />
                        </h3>
                    )}
                    {/* Item count badge */}
                    <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                        {completedCount}/{totalCount}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    {/* Random picker button */}
                    <button
                        onClick={handleRandomPick}
                        disabled={uncompletedCount === 0 || isSpinning}
                        className={`rounded-lg p-1.5 transition-all disabled:opacity-30 ${isSpinning
                            ? 'animate-spin text-indigo-500'
                            : 'text-zinc-400 hover:bg-indigo-50 hover:text-indigo-500 dark:text-zinc-500 dark:hover:bg-indigo-900/20'
                            }`}
                        title="Pick random task"
                    >
                        <Shuffle className="h-4 w-4" />
                    </button>
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
            </div>

            {/* Content - Collapsible on mobile, always visible on desktop */}
            <div className={`
                flex-1 flex flex-col overflow-hidden transition-all duration-200
                ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}
                sm:max-h-none sm:opacity-100
            `}>
                <div className="flex-1 space-y-2 overflow-y-auto px-4 pb-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-700">
                    {items.length === 0 ? (
                        <div className="py-4 text-center text-sm text-zinc-400 italic">No tasks yet</div>
                    ) : (
                        items.map((todo) => (
                            <div
                                key={todo.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, todo.id)}
                                onDragEnd={handleDragEnd}
                                onDragEnter={(e) => handleDragEnter(e, todo.id)}
                                onDragLeave={handleDragLeave}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, todo.id)}
                                className={`
                                    relative transition-all
                                    ${draggedItemId === todo.id ? 'opacity-50' : ''}
                                    ${dragOverItemId === todo.id ? 'ring-2 ring-indigo-500 ring-offset-1 rounded-lg' : ''}
                                `}
                            >
                                <div className="flex items-center gap-1">
                                    {/* Drag handle */}
                                    <div className="cursor-grab active:cursor-grabbing text-zinc-300 hover:text-zinc-500 dark:text-zinc-600 dark:hover:text-zinc-400 flex-shrink-0">
                                        <GripVertical className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1">
                                        <TodoItem
                                            todo={todo}
                                            isHighlighted={selectedId === todo.id}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))
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
