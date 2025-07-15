"use server"

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import prisma from "@repo/db/client";

export async function createOnRampTransaction(
    amount: number,
    provider: string,
    
) {
     const session = await getServerSession(authOptions);
    const token = Math.random().toString()
     const userId = session.user?.id;
     if (!session?.user || !session.user?.id) {
        return {
            message : "user not authenticated"
        }
     }

     await prisma.onRampTransaction.create({
        data: {
            userId : Number(userId),
            amount : amount,
            status : "Processing",
            startTime: new Date(),
            provider,
            token 
        }
    }) 

    return {
        message: "Transaction created successfully",
        token
    }
}