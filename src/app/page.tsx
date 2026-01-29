import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Dashboard } from "./components/Dashboard";
import { Category, TodoItem } from "@prisma/client";
import { Suspense } from "react";
import Loading from "./loading";

async function DashboardData({ user }: { user: any }) {
  const categories = await prisma.category.findMany({
    include: {
      items: {
        orderBy: { order: 'asc' }
      }
    },
    orderBy: { order: 'asc' }
  });

  const serializedCategories = categories.map((cat: Category & { items: TodoItem[] }) => ({
    id: cat.id,
    name: cat.name,
    order: (cat as any).order ?? 0,
    createdAt: cat.createdAt.toISOString(),
    updatedAt: cat.updatedAt.toISOString(),
    items: cat.items.map((item: TodoItem) => ({
      id: item.id,
      text: item.text,
      completed: item.completed,
      order: (item as any).order ?? 0,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }))
  }));

  return <Dashboard categories={serializedCategories} user={user} />;
}

export default async function Home() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <main>
      <Suspense fallback={<Loading />}>
        <DashboardData user={session.user} />
      </Suspense>
    </main>
  );
}
