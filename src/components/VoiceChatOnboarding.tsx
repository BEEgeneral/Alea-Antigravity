"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// Simulation of the AI conversational steps
const STEPS = [
    {
        id: "welcome",
        aiText: "Bienvenido a Aleasignature. Soy tu asistente IA para la búsqueda de activos exclusivos. Para acceder, necesito cualificar tu perfil. ¿Cómo te llamas?",
        type: "input",
        key: "name"
    },
    {
        id: "interests",
        aiText: "Un placer. ¿Qué tipo de activos buscas principalmente? (Ej: Hoteles, Edificios residenciales, Villas de lujo)",
        type: "input",
        key: "assetType"
    },
    {
        id: "ticket",
        aiText: "Entendido. ¿Cuál es tu ticket medio de inversión esperado en millones de euros?",
        type: "input",
        key: "ticketSize"
    },
    {
        id: "contact",
        aiText: "Perfecto. Por último, ¿cuál es tu email profesional para enviarte el acceso a la Data Room privada?",
        type: "input",
        key: "email"
    },
    {
        id: "complete",
        aiText: "Gracias. He configurado tu perfil. Procediendo a encriptar tus credenciales y dándote acceso a la plataforma...",
        type: "loading",
        key: "done"
    }
];

export function VoiceChatOnboarding() {
    const router = useRouter();
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [inputValue, setInputValue] = useState("");
    const [isAiSpeaking, setIsAiSpeaking] = useState(true);
    const [isRecording, setIsRecording] = useState(false);
    const [userData, setUserData] = useState<Record<string, string>>({});

    const currentStep = STEPS[currentStepIndex];

    // AI Voice Animation Simulation
    useEffect(() => {
        setIsAiSpeaking(true);
        const timer = setTimeout(() => {
            setIsAiSpeaking(false);
            // If it's the final loading step, redirect after "processing"
            if (currentStep.type === "loading") {
                const saveInvestor = async () => {
                    try {
                        // Map ticket size string to numbers
                        const ticketValue = parseFloat(userData.ticketSize?.replace(/[^0-9.]/g, '') || "0") * 1000000;

                        // Sanitize email: voice recognition often adds spaces or periods at the end
                        const cleanEmail = (userData.email || "").replace(/\s+/g, '').replace(/\.$/, '').toLowerCase();

                        const { error } = await supabase
                            .from('investors')
                            .insert([{
                                full_name: userData.name || "Anon Inversor",
                                email: cleanEmail,
                                interests: userData.assetType ? [userData.assetType] : [],
                                budget_max: ticketValue,
                                status: 'nuevo',
                                kyc_status: 'pending'
                            }]);

                        if (error) throw error;

                        const { data: investorData } = await supabase
                            .from('investors')
                            .select('id')
                            .eq('email', cleanEmail)
                            .single();

                        if (investorData) {
                            localStorage.setItem('alea_investor_id', investorData.id);
                            localStorage.setItem('alea_investor_name', userData.name || "Inversor");
                        }
                    } catch (err) {
                        console.error("Error saving investor lead:", err);
                    } finally {
                        setTimeout(() => {
                            const finalEmail = (userData.email || "").replace(/\s+/g, '').replace(/\.$/, '').toLowerCase();
                            router.push(`/login?from=onboarding&email=${encodeURIComponent(finalEmail)}`);
                        }, 2000);
                    }
                };
                saveInvestor();
            }
        }, 2500); // Simulate AI talking time
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentStepIndex, router, currentStep.type]);

    const handleNext = () => {
        if (!inputValue.trim() && currentStep.type !== "loading") return;

        setUserData(prev => ({ ...prev, [currentStep.key]: inputValue }));
        setInputValue("");

        if (currentStepIndex < STEPS.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
        }
    };

    const toggleRecording = () => {
        if (isRecording) {
            // No easy way to stop from outside without a ref, but browser will stop onend
            setIsRecording(false);
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert("El reconocimiento de voz no está disponible en este navegador. Por favor, usa Chrome.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'es-ES';
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsRecording(true);
            setInputValue("");
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    // Update input with interim results to show live feedback
                    setInputValue(event.results[i][0].transcript);
                }
            }
            if (finalTranscript) {
                setInputValue(finalTranscript);
            }
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onerror = (event: any) => {
            console.error("Speech Recognition Error:", event.error);
            setIsRecording(false);
            if (event.error === 'not-allowed') {
                alert("Permiso de micrófono denegado. Por favor, actívalo en los ajustes de tu navegador.");
            }
        };

        recognition.onend = () => {
            setIsRecording(false);
        };

        recognition.start();
    };

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh]">

            {/* AI Visualizer Orb */}
            <div className="relative mb-12 flex justify-center items-center h-48 w-48">
                <AnimatePresence>
                    {isAiSpeaking && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                            className="absolute inset-0 bg-primary/20 rounded-full blur-2xl"
                        />
                    )}
                    {isRecording && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: [0.5, 0.8, 0.5], scale: [1, 1.4, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                            className="absolute inset-0 bg-red-500/20 rounded-full blur-2xl"
                        />
                    )}
                </AnimatePresence>

                <motion.div
                    className="z-10 w-24 h-24 rounded-full bg-gradient-to-tr from-foreground to-foreground/80 shadow-2xl border border-white/5 flex items-center justify-center overflow-hidden"
                    animate={isAiSpeaking ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                >
                    {currentStep.type === "loading" ? (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                            className="w-12 h-12 rounded-full border-t-2 border-r-2 border-primary"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex gap-1 items-center justify-center">
                            <span className={`w-1 bg-primary rounded-full transition-all duration-300 ${isAiSpeaking ? 'h-4 animate-pulse' : 'h-1'}`}></span>
                            <span className={`w-1 bg-primary rounded-full transition-all duration-300 delay-75 ${isAiSpeaking ? 'h-6 animate-pulse' : 'h-1'}`}></span>
                            <span className={`w-1 bg-primary rounded-full transition-all duration-300 delay-150 ${isAiSpeaking ? 'h-4 animate-pulse' : 'h-1'}`}></span>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* AI Text Output */}
            <div className="text-center mb-12 min-h-[160px] flex items-center justify-center">
                <AnimatePresence mode="wait">
                    <motion.p
                        key={currentStep.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="font-serif text-2xl md:text-3xl font-medium text-foreground leading-relaxed"
                    >
                        {currentStep.aiText}
                    </motion.p>
                </AnimatePresence>
            </div>

            {/* User Input Area */}
            {currentStep.type !== "loading" && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: isAiSpeaking ? 0.3 : 1, scale: 1 }}
                    className="w-full relative transition-opacity duration-500"
                >
                    <div className="flex items-center space-x-2 bg-card border border-border rounded-2xl p-2 shadow-lg">

                        <button
                            onClick={toggleRecording}
                            disabled={isAiSpeaking}
                            className={`p-4 rounded-xl transition-all ${isRecording ? 'bg-red-500/10 text-red-500' : 'bg-muted text-foreground hover:bg-muted/80'}`}
                        >
                            {isRecording ? <Square size={20} className="fill-current" /> : <Mic size={20} />}
                        </button>

                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            disabled={isAiSpeaking || isRecording}
                            placeholder={isRecording ? "Escuchando..." : "Escribe tu respuesta aquí..."}
                            className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 px-4 font-sans text-lg text-foreground placeholder:text-muted-foreground"
                            onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                        />

                        <button
                            onClick={handleNext}
                            disabled={!inputValue.trim()}
                            className="p-4 bg-primary text-primary-foreground rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                        >
                            <ArrowRight size={20} />
                        </button>
                    </div>

                    <div className="text-center mt-6 flex justify-center space-x-2">
                        {STEPS.filter(s => s.type !== "loading").map((step, idx) => (
                            <div
                                key={step.id}
                                className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentStepIndex ? 'w-8 bg-primary' : idx < currentStepIndex ? 'w-4 bg-primary/40' : 'w-4 bg-border'}`}
                            />
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
