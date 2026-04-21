import prisma from "@repo/db/client";
import { Card } from "@repo/ui/card";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "../../lib/auth";

async function getDashboardData(userId: number) {
  const [
    balance,
    successfulTopups,
    incomingP2P,
    outgoingP2P,
    recentTransactions
  ] = await Promise.all([
    prisma.balance.findUnique({
      where: { userId }
    }),
    prisma.onRampTransaction.aggregate({
      where: { userId, status: "Success" },
      _sum: { amount: true },
      _count: { id: true }
    }),
    prisma.p2pTransfer.aggregate({
      where: { toUserId: userId },
      _sum: { amount: true },
      _count: { id: true }
    }),
    prisma.p2pTransfer.aggregate({
      where: { fromUserId: userId },
      _sum: { amount: true },
      _count: { id: true }
    }),
    prisma.onRampTransaction.findMany({
      where: { userId },
      orderBy: { startTime: "desc" },
      take: 5
    })
  ]);

  return {
    balance: {
      amount: balance?.amount || 0,
      locked: balance?.locked || 0
    },
    stats: {
      topupAmount: successfulTopups._sum.amount || 0,
      topupCount: successfulTopups._count.id || 0,
      receivedAmount: incomingP2P._sum.amount || 0,
      receivedCount: incomingP2P._count.id || 0,
      sentAmount: outgoingP2P._sum.amount || 0,
      sentCount: outgoingP2P._count.id || 0
    },
    recentTransactions
  };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  const userId = Number(session.user.id);
  const data = await getDashboardData(userId);

  return (
    <div className="w-screen">
      <div className="text-4xl text-[#6a51a6] pt-8 mb-8 font-bold">
        Dashboard
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        <Card title="Wallet Snapshot">
          <div className="flex justify-between border-b border-slate-300 pb-2">
            <div>Available Balance</div>
            <div>{data.balance.amount / 100} INR</div>
          </div>
          <div className="flex justify-between border-b border-slate-300 py-2">
            <div>Locked Balance</div>
            <div>{data.balance.locked / 100} INR</div>
          </div>
          <div className="flex justify-between py-2 font-semibold">
            <div>Total Balance</div>
            <div>{(data.balance.amount + data.balance.locked) / 100} INR</div>
          </div>
        </Card>

        <Card title="Activity Overview">
          <div className="flex justify-between border-b border-slate-300 pb-2">
            <div>Successful Top-ups</div>
            <div>
              {data.stats.topupCount} ({data.stats.topupAmount / 100} INR)
            </div>
          </div>
          <div className="flex justify-between border-b border-slate-300 py-2">
            <div>P2P Received</div>
            <div>
              {data.stats.receivedCount} ({data.stats.receivedAmount / 100} INR)
            </div>
          </div>
          <div className="flex justify-between py-2">
            <div>P2P Sent</div>
            <div>
              {data.stats.sentCount} ({data.stats.sentAmount / 100} INR)
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 pt-0">
        <Card title="Quick Actions">
          <div className="flex flex-col gap-2">
            <Link className="text-[#6a51a6] font-semibold" href="/transfer">
              Add Money
            </Link>
            <Link className="text-[#6a51a6] font-semibold" href="/p2p">
              Send to Contact
            </Link>
            <Link className="text-[#6a51a6] font-semibold" href="/transactions">
              View All Transactions
            </Link>
          </div>
        </Card>

        <Card title="Latest Top-ups">
          {!data.recentTransactions.length ? (
            <div className="text-slate-500">No transactions yet</div>
          ) : (
            <div className="space-y-3">
              {data.recentTransactions.map((txn) => (
                <div key={txn.id} className="flex justify-between border-b border-slate-200 pb-2">
                  <div>
                    <div className="text-sm">Via {txn.provider}</div>
                    <div className="text-xs text-slate-500">{txn.startTime.toLocaleString()}</div>
                  </div>
                  <div className={`text-sm font-semibold ${txn.status === "Success" ? "text-green-600" : txn.status === "Failed" ? "text-red-600" : "text-slate-600"}`}>
                    {txn.status === "Success" ? "+" : ""} Rs {txn.amount / 100}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

