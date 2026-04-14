"use client";

import UserManagement from "@/components/admin/UserManagement";

export default function UsersPage() {
    return (
        <main className="min-h-screen bg-background text-foreground selection:bg-primary/30 font-sans overflow-x-hidden">
            <div className="max-w-6xl mx-auto px-6 py-12">
                <UserManagement />
            </div>
        </main>
    );
}