import express from "express";
import db from "@repo/db/client";
const app = express();

app.use(express.json())

app.post("/hdfcWebhook", async (req, res) => {
    //TODO: Add zod validation here?
    //TODO: HDFC bank should ideally send us a secret so we know this is sent by them
    const paymentInformation: {
        token: string;
        userId: string;
        amount: string
    } = {
        token: req.body.token,
        userId: req.body.user_identifier,
        amount: req.body.amount
    };

    try {
        const result = await db.$transaction(async (tx) => {
            const transaction = await tx.onRampTransaction.findUnique({
                where: {
                    token: paymentInformation.token
                }
            });

            if (!transaction) {
                return { ok: false as const, reason: "Transaction not found" };
            }

            const marked = await tx.onRampTransaction.updateMany({
                where: {
                    token: paymentInformation.token,
                    status: "Processing"
                },
                data: {
                    status: "Success"
                }
            });

            if (marked.count === 0) {
                return { ok: true as const, message: "Already processed" };
            }

            await tx.balance.upsert({
                where: {
                    userId: transaction.userId
                },
                update: {
                    amount: {
                        increment: transaction.amount
                    }
                },
                create: {
                    userId: transaction.userId,
                    amount: transaction.amount,
                    locked: 0
                }
            });

            return { ok: true as const, message: "Captured" };
        });

        if (!result.ok) {
            res.status(404).json({
                message: result.reason
            });
            return;
        }

        res.json({
            message: result.message
        })
    } catch(e) {
        console.error(e);
        res.status(411).json({
            message: "Error while processing webhook"
        })
    }

})

app.listen(3003);
