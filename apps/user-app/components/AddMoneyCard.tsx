"use client"
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import { Center } from "@repo/ui/center";
import { Select } from "@repo/ui/select";
import { useState } from "react";
import { TextInput } from "@repo/ui/textinput";
import { createOnRampTransaction } from "../app/lib/actions/createOnRamptxn";
import { Toast } from "./Toast";

const SUPPORTED_BANKS = [{
    name: "HDFC Bank",
    redirectUrl: "https://netbanking.hdfcbank.com"
}, {
    name: "Axis Bank",
    redirectUrl: "https://www.axisbank.com/"
}];

export const AddMoney = () => {
    const [redirectUrl, setRedirectUrl] = useState(SUPPORTED_BANKS[0]?.redirectUrl);
    const [amount, setAmount] = useState(0);
    const [provider, setProvider] = useState(SUPPORTED_BANKS[0]?.name || "");
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    return <Card title="Add Money">
    {toast ? <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} /> : null}
    <div className="w-full">
        <TextInput label={"Amount"} placeholder={"Amount"} onChange={(value) => {
            const numericValue = parseInt(value) || 0;
            setAmount(numericValue);

        }} />
        <div className="py-4 text-left">
            Bank
        </div>
        <Select onSelect={(value) => {
            
            setRedirectUrl(SUPPORTED_BANKS.find(x => x.name === value)?.redirectUrl || "")
            setProvider(SUPPORTED_BANKS.find(x => x.name === value)?.name || "");
        }} options={SUPPORTED_BANKS.map(x => ({
            key: x.name,
            value: x.name
        }))} />
        <div className="flex justify-center pt-4">
            <Button onClick={async () => {
                if (amount <= 0) {
                    setToast({ message: "Enter a valid amount", type: "error" });
                    return;
                }

                try {
                    const result = await createOnRampTransaction(amount * 100 , provider);
                    if (result?.message === "user not authenticated") {
                        setToast({ message: "Please sign in again", type: "error" });
                        return;
                    }

                    setToast({ message: "Transaction started. Redirecting to bank...", type: "success" });
                    setTimeout(() => {
                        window.location.href = redirectUrl || "";
                    }, 700);
                } catch {
                    setToast({ message: "Failed to start transaction", type: "error" });
                }
            }}>
            Add Money
            </Button>
        </div>
    </div>
</Card>
}
