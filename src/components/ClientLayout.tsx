"use client";

import { AdminProvider } from "@/contexts/AdminContext";
import { ReactNode } from "react";

export default function ClientLayout({ children }: { children: ReactNode }) {
    return <AdminProvider>{children}</AdminProvider>;
}
