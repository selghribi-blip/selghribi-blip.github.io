import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todaySummaries = await prisma.summary.count({
    where: {
      userId: session.user.id,
      createdAt: { gte: todayStart },
    },
  });

  return (
    <div className="min-h-screen">
      <Navbar />
      <DashboardClient
        plan={user?.plan ?? "free"}
        todaySummaries={todaySummaries}
      />
    </div>
  );
}
