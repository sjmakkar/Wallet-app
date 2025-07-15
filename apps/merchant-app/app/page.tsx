"use client";

import { useBalance } from "@repo/store/hooks/useBalance";

export default function() {
  const balance = useBalance();
  return <div>
    hi there {balance}
  </div>
}