import { VoiceChatOnboarding } from "@/components/VoiceChatOnboarding";
import { Lock, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function OnboardingPage() {
    return (
        <main className="min-h-screen bg-background flex flex-col selection:bg-primary/30">

            {/* Header Overlay */}
            <header className="absolute top-0 w-full p-8 flex justify-between items-center z-50">
                <Link href="/" className="group flex items-center space-x-3 text-foreground hover:opacity-80 transition-opacity">
                    <ArrowLeft size={16} className="text-muted-foreground group-hover:-translate-x-1 transition-transform" />
                    <span className="font-serif text-xl tracking-widest font-medium">Aleasignature.</span>
                </Link>
                <div className="flex items-center space-x-2 text-xs font-semibold tracking-widest uppercase text-muted-foreground">
                    <Lock size={12} />
                    <span>Encrypted Session</span>
                </div>
            </header>

            {/* Main Experience */}
            <div className="flex-1 flex items-center justify-center p-6 mt-16">
                <VoiceChatOnboarding />
            </div>

        </main>
    );
}
