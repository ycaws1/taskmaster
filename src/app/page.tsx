import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Dashboard } from "./components/Dashboard";
import { Category, TodoItem } from "@prisma/client";

export default async function Home() {
  const session = await auth();
  if (!session) redirect("/login");

  const categories = await prisma.category.findMany({
    include: {
      items: {
        orderBy: { createdAt: 'desc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const serializedCategories = categories.map((cat: Category & { items: TodoItem[] }) => ({
    ...cat,
    createdAt: cat.createdAt.toISOString(),
    updatedAt: cat.updatedAt.toISOString(),
    items: cat.items.map((item: TodoItem) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }))
  }));

  return (
    <main>
      <Dashboard categories={serializedCategories} user={session.user} />
    </main>
  );
}
