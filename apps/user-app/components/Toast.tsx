"use client";

import { useEffect } from "react";

type ToastProps = {
  message: string;
  type: "success" | "error";
  onClose: () => void;
};

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50">
      <div
        className={`rounded-md px-4 py-3 text-sm text-white shadow-lg ${
          type === "success" ? "bg-green-600" : "bg-red-600"
        }`}
      >
        {message}
      </div>
    </div>
  );
}

