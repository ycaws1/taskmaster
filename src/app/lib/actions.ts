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
    await prisma.category.create({
        data: { name },
    })
    revalidatePath('/')
}

export async function deleteCategory(id: string) {
    await prisma.category.delete({
        where: { id },
    })
    revalidatePath('/')
}

// Todo Actions
export async function createTodo(text: string, categoryId: string) {
    await prisma.todoItem.create({
        data: { text, categoryId },
    })
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
