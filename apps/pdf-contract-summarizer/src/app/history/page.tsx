import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import HistoryList from "@/components/HistoryList";

export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const summaries = await prisma.summary.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      filename: true,
      mode: true,
      outputText: true,
      createdAt: true,
    },
  });

  const serialized = summaries.map((s) => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
  }));

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-white">History</h1>
          <p className="text-slate-400 text-sm mt-1">
            {summaries.length} summar{summaries.length !== 1 ? "ies" : "y"} total
          </p>
        </div>
        <HistoryList summaries={serialized} />
      </main>
    </div>
  );
}
