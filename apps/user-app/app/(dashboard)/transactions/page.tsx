import prisma from "@repo/db/client";
import { Card } from "@repo/ui/card";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../../lib/auth";

type TransactionItem = {
  id: string;
  time: Date;
  description: string;
  amount: number;
  direction: "credit" | "debit";
  status?: string;
};

async function getTransactions(userId: number): Promise<TransactionItem[]> {
  const [onRampTransactions, p2pTransactions] = await Promise.all([
    prisma.onRampTransaction.findMany({
      where: { userId },
      orderBy: { startTime: "desc" },
    }),
    prisma.p2pTransfer.findMany({
      where: {
        OR: [{ fromUserId: userId }, { toUserId: userId }],
      },
      include: {
        fromUser: {
          select: {
            number: true,
          },
        },
        toUser: {
          select: {
            number: true,
          },
        },
      },
      orderBy: { timestamp: "desc" },
    }),
  ]);

  const onRampItems: TransactionItem[] = onRampTransactions.map((txn) => ({
    id: `onramp-${txn.id}`,
    time: txn.startTime,
    description: `Wallet top-up via ${txn.provider}`,
    amount: txn.amount,
    direction: "credit",
    status: txn.status,
  }));

  const p2pItems: TransactionItem[] = p2pTransactions.map((txn) => {
    const incoming = txn.toUserId === userId;
    return {
      id: `p2p-${txn.id}`,
      time: txn.timestamp,
      description: incoming
        ? `Received from ${txn.fromUser.number}`
        : `Sent to ${txn.toUser.number}`,
      amount: txn.amount,
      direction: incoming ? "credit" : "debit",
    };
  });

  return [...onRampItems, ...p2pItems].sort(
    (a, b) => b.time.getTime() - a.time.getTime()
  );
}

export default async function TransactionsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  const transactions = await getTransactions(Number(session.user.id));

  return (
    <div className="w-screen">
      <div className="text-4xl text-[#6a51a6] pt-8 mb-8 font-bold">
        Transactions
      </div>

      <div className="p-4 max-w-3xl">
        <Card title="All Transactions">
          {!transactions.length ? (
            <div className="text-center pb-8 pt-8 text-slate-500">
              No transactions yet
            </div>
          ) : (
            <div className="pt-2">
              {transactions.map((txn) => (
                <div
                  key={txn.id}
                  className="flex justify-between items-start border-b border-slate-200 py-3"
                >
                  <div>
                    <div className="text-sm">{txn.description}</div>
                    <div className="text-slate-600 text-xs">
                      {txn.time.toLocaleString()}
                    </div>
                    {txn.status ? (
                      <div className="text-xs text-slate-500 pt-1">
                        Status: {txn.status}
                      </div>
                    ) : null}
                  </div>
                  <div
                    className={`text-sm font-semibold ${
                      txn.direction === "credit"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {txn.direction === "credit" ? "+" : "-"} Rs {txn.amount / 100}
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
