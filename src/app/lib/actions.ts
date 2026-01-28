'use server'

import { signIn } from '@/auth'
import { AuthError } from 'next-auth'
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from 'next/navigation'

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        await signIn('credentials', {
            username: formData.get('username'),
            password: formData.get('password'),
            redirect: false,
        })
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Invalid credentials.'
                default:
                    return 'Something went wrong.'
            }
        }
        throw error
    }
    redirect('/')
}

// Category Actions
export async function createCategory(name: string) {
    // Get the current max order
    const maxOrderResult = await prisma.category.aggregate({
        _max: { order: true }
    })
    const newOrder = (maxOrderResult._max.order ?? -1) + 1

    await prisma.category.create({
        data: { name, order: newOrder },
    })
    revalidatePath('/')
}

export async function reorderCategories(orderedIds: string[]) {
    // Update each category with its new order
    await prisma.$transaction(
        orderedIds.map((id, index) =>
            prisma.category.update({
                where: { id },
                data: { order: index }
            })
        )
    )
    revalidatePath('/')
}

export async function deleteCategory(id: string) {
    await prisma.category.delete({
        where: { id },
    })
    revalidatePath('/')
}

export async function updateCategoryName(id: string, name: string) {
    await prisma.category.update({
        where: { id },
        data: { name },
    })
    revalidatePath('/')
}

// Todo Actions
export async function createTodo(text: string, categoryId: string) {
    // Get the current max order for this category
    const maxOrderResult = await prisma.todoItem.aggregate({
        where: { categoryId },
        _max: { order: true }
    })
    const newOrder = (maxOrderResult._max.order ?? -1) + 1

    await prisma.todoItem.create({
        data: { text, categoryId, order: newOrder },
    })
    revalidatePath('/')
}

export async function reorderTodos(categoryId: string, orderedIds: string[]) {
    // Update each todo with its new order
    await prisma.$transaction(
        orderedIds.map((id, index) =>
            prisma.todoItem.update({
                where: { id },
                data: { order: index }
            })
        )
    )
    revalidatePath('/')
}

export async function toggleTodo(id: string, completed: boolean) {
    await prisma.todoItem.update({
        where: { id },
        data: { completed },
    })
    revalidatePath('/')
}

export async function deleteTodo(id: string) {
    await prisma.todoItem.delete({
        where: { id },
    })
    revalidatePath('/')
}

export async function updateTodoText(id: string, text: string) {
    await prisma.todoItem.update({
        where: { id },
        data: { text },
    })
    revalidatePath('/')
}
