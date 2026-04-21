"use client"
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import { Center } from "@repo/ui/center";
import { TextInput } from "@repo/ui/textinput";
import { useState } from "react";
import { p2pTransfer } from "../app/lib/actions/p2ptransfer";
import { Toast } from "./Toast";

export function SendCard() {
    const [number, setNumber] = useState("");
    const [amount, setAmount] = useState("");
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    return <div className="h-[90vh]">
        {toast ? <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} /> : null}
        <Center>
            <Card title="Send">
                <div className="min-w-72 pt-2">
                    <TextInput placeholder={"Number"} label="Number" onChange={(value) => {
                        setNumber(value)
                    }} />
                    <TextInput placeholder={"Amount"} label="Amount" onChange={(value) => {
                        setAmount(value)
                    }} />
                    <div className="pt-4 flex justify-center">
                        <Button onClick={async () => {
                            if (!number.trim()) {
                                setToast({ message: "Enter recipient number", type: "error" });
                                return;
                            }
                            const amountInPaise = Number(amount) * 100;
                            if (!Number.isFinite(amountInPaise) || amountInPaise <= 0) {
                                setToast({ message: "Enter a valid amount", type: "error" });
                                return;
                            }

                            try {
                                const result = await p2pTransfer(number, amountInPaise);
                                if (result?.message) {
                                    setToast({ message: result.message, type: "error" });
                                    return;
                                }

                                setToast({ message: "Transfer successful", type: "success" });
                                setAmount("");
                                setNumber("");
                            } catch (error: any) {
                                setToast({ message: error?.message || "Transfer failed", type: "error" });
                            }
                        }}>Send</Button>
                    </div>
                </div>
            </Card>
        </Center>
    </div>
}
