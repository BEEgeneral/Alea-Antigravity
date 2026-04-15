"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, ArrowRight, ShieldCheck, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

// Simulation of the AI conversational steps
const STEPS = [
    {
        id: "welcome",
        aiText: "Bienvenido a Aleasignature. Iniciamos su proceso de calificación. Para comenzar, ¿cómo se llama o a qué entidad representa?",
        type: "input",
        key: "name"
    },
    {
        id: "investor_type",
        aiText: "Un placer. ¿Qué perfil de inversión tienes? (Multi-Family Office, Fondo Institucional, UHNWI, Private Equity)",
        type: "input",
        key: "investorType"
    },
    {
        id: "ticket",
        aiText: "Entendido. ¿Cuál es el volumen de capital o ticket medio disponible para inversión (en millones de euros)?",
        type: "input",
        key: "ticketSize"
    },
    {
        id: "alea_basics",
        aiText: "Operamos bajo un protocolo de originación ciega: facilitamos ubicación estratégica y rentabilidad estimada. Tras su interés, un agente coordinará los detalles financieros. ¿Acepta este protocolo?",
        type: "input",
        key: "basicsAccepted"
    },
    {
        id: "phone",
        aiText: "Excelente. Por favor, facilite un número de teléfono de contacto para una comunicación ágil durante la calificación.",
        type: "input",
        key: "phone"
    },
    {
        id: "email",
        aiText: "Perfecto. Por favor, facilítame tu email corporativo para enviarte la documentación de acceso al Radar.",
        type: "input",
        key: "email"
    },
    {
        id: "complete",
        aiText: "Cualificación registrada. Generando tu identificador cifrado y procesando las credenciales...",
        type: "loading",
        key: "done"
    },
    {
        id: "confirmation",
        aiText: "¡Registro completado! Revisa tu bandeja de entrada para confirmar el email. Tu acceso al Radar permanecerá bloqueado bajo aprobación hasta que el equipo de Praetorium valide el perfil.",
        type: "success",
        key: "success"
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
        // Dynamic reading time based on text length
        const readingTime = Math.max(1200, Math.min(3000, currentStep.aiText.length * 40));

        const timer = setTimeout(() => {
            setIsAiSpeaking(false);
            // If it's the final loading step, redirect after "processing"
            if (currentStep.type === "loading") {
                const saveInvestor = async () => {
                    try {
                        const finalEmail = (userData.email || "").replace(/\s+/g, '').replace(/\.$/, '').toLowerCase();

                        const res = await fetch('/api/auth/register', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                email: finalEmail,
                                password: crypto.randomUUID() + "A1!",
                                name: userData.name || "Anon Inversor"
                            })
                        });

                        const data = await res.json();

                        if (!res.ok) {
                            console.error("Registration error:", data.error);
                        }

                        localStorage.removeItem('alea_investor_name');
                        setCurrentStepIndex(STEPS.length - 1);
                    } catch (err) {
                        console.error("Onboarding: [CRITICAL ERROR] Error saving investor lead:", err);
                        setCurrentStepIndex(STEPS.length - 1);
                    }
                };
                saveInvestor();
            }
        }, readingTime);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentStepIndex, router, currentStep.type]);

    const [countryCode, setCountryCode] = useState("+34");

    const handleNext = () => {
        if (!inputValue.trim() && currentStep.type !== "loading") return;

        let finalValue = inputValue.trim();

        // Concatenate country code for phone number
        if (currentStep.key === 'phone') {
            finalValue = `${countryCode} ${finalValue}`;
        }

        // Save name for later steps if needed
        if (currentStep.key === 'name') {
            localStorage.setItem('alea_investor_name', finalValue);
        }

        setUserData(prev => ({ ...prev, [currentStep.key]: finalValue }));
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
                    ) : currentStep.type === "success" ? (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="text-primary"
                        >
                            <ShieldCheck size={48} />
                        </motion.div>
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
            <div className="text-center mb-12 min-h-[160px] flex flex-col items-center justify-center">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        <p className="font-serif text-2xl md:text-3xl font-medium text-foreground leading-relaxed px-4">
                            {currentStep.aiText}
                        </p>

                        {currentStep.type === "success" && (
                            <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1 }}
                                onClick={() => router.push("/")}
                                className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-primary hover:text-foreground transition-colors"
                            >
                                <ChevronLeft size={14} />
                                <span>Volver a la Home</span>
                            </motion.button>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* User Input Area */}
            {currentStep.type !== "loading" && currentStep.type !== "success" && (
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

                        {currentStep.key === 'phone' && (
                            <div className="flex items-center">
                                <select
                                    value={countryCode}
                                    onChange={(e) => setCountryCode(e.target.value)}
                                    className="bg-muted/50 border-none focus:outline-none focus:ring-0 px-2 md:px-3 py-3 md:py-4 rounded-l-xl font-sans text-xs md:text-sm text-foreground appearance-none cursor-pointer hover:bg-muted/80 transition-colors border-r border-border/50"
                                >
                                    <option value="+34">🇪🇸 +34</option>
                                    <option value="+1">🇺🇸 +1</option>
                                    <option value="+44">🇬🇧 +44</option>
                                    <option value="+49">🇩🇪 +49</option>
                                    <option value="+33">🇫🇷 +33</option>
                                    <option value="+39">🇮🇹 +39</option>
                                    <option value="+351">🇵🇹 +351</option>
                                    <option value="+41">🇨🇭 +41</option>
                                    <option value="+32">🇧🇪 +32</option>
                                    <option value="+31">🇳🇱 +31</option>
                                    <option value="+52">🇲🇽 +52</option>
                                    <option value="+54">🇦🇷 +54</option>
                                    <option value="+55">🇧🇷 +55</option>
                                    <option value="+56">🇨联合 +56</option>
                                    <option value="+57">🇨🇴 +57</option>
                                    <option value="+51">🇵🇪 +51</option>
                                </select>
                            </div>
                        )}

                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            disabled={isAiSpeaking || isRecording}
                            placeholder={isRecording ? "Escuchando..." : (currentStep.key === 'phone' ? "Nº de teléfono..." : "Escribe aquí...")}
                            className={`flex-1 min-w-0 bg-transparent border-none focus:outline-none focus:ring-0 px-2 md:px-4 font-sans text-base md:text-lg text-foreground placeholder:text-muted-foreground ${currentStep.key === 'phone' ? 'rounded-r-xl pl-1' : 'rounded-xl'}`}
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

