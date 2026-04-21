import prisma from "@repo/db/client";
import { AddMoney } from "../../../components/AddMoneyCard";
import { BalanceCard } from "../../../components/BalanceCard";
import { OnRampTransactions } from "../../../components/OnRampTransaction";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { redirect } from "next/navigation";

async function getBalance(userId: number) {
    const [existingBalance, successfulOnRampAggregate, incomingP2P, outgoingP2P] = await Promise.all([
        prisma.balance.findUnique({
            where: {
                userId
            }
        }),
        prisma.onRampTransaction.aggregate({
            where: {
                userId,
                status: "Success"
            },
            _sum: {
                amount: true
            }
        }),
        prisma.p2pTransfer.aggregate({
            where: {
                toUserId: userId
            },
            _sum: {
                amount: true
            }
        }),
        prisma.p2pTransfer.aggregate({
            where: {
                fromUserId: userId
            },
            _sum: {
                amount: true
            }
        })
    ]);

    const computedAmount =
        (successfulOnRampAggregate._sum.amount || 0) +
        (incomingP2P._sum.amount || 0) -
        (outgoingP2P._sum.amount || 0);

    if (!existingBalance) {
        await prisma.balance.create({
            data: {
                userId,
                amount: computedAmount,
                locked: 0
            }
        });

        return {
            amount: computedAmount,
            locked: 0
        };
    }

    if (existingBalance.amount !== computedAmount) {
        const updated = await prisma.balance.update({
            where: {
                userId
            },
            data: {
                amount: computedAmount
            }
        });

        return {
            amount: updated.amount,
            locked: updated.locked
        };
    }

    return {
        amount: existingBalance.amount,
        locked: existingBalance.locked
    };
}

async function getOnRampTransactions(userId: number) {
    const txns = await prisma.onRampTransaction.findMany({
        where: {
            userId
        },
        orderBy: {
            startTime: "desc"
        }
    });
    return txns.map(t => ({
        time: t.startTime,
        amount: t.amount,
        status: t.status,
        provider: t.provider
    }))
}

export default async function TransferPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        redirect("/api/auth/signin");
    }
    const userId = Number(session.user.id);
    const balance = await getBalance(userId);
    const transactions = await getOnRampTransactions(userId);

    return <div className="w-screen">
        <div className="text-4xl text-[#6a51a6] pt-8 mb-8 font-bold">
            Transfer
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 p-4">
            <div>
                <AddMoney />
            </div>
            <div>
                <BalanceCard amount={balance.amount} locked={balance.locked} />
                <div className="pt-4">
                    <OnRampTransactions transactions={transactions} />
                </div>
            </div>
        </div>
    </div>
}
