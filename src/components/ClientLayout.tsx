"use client";

import { SessionProvider } from "next-auth/react";
import { AdminProvider } from "@/contexts/AdminContext";
import { ReactNode } from "react";

export default function ClientLayout({ children }: { children: ReactNode }) {
    return (
        <SessionProvider>
            <AdminProvider>{children}</AdminProvider>
        </SessionProvider>
    );
}
