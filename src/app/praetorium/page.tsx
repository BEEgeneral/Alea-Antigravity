/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
    Users, Building, Activity, ShieldAlert, ArrowUpRight, Search, Shield,
    CheckCircle2, CheckCircle, FileText, Download, UserCheck, Mail, GripVertical,
    Clock, MapPin, LayoutDashboard, Plus, MoreHorizontal, Share2,
    ChevronLeft, Maximize2, Bed, Bath, Sparkles, TrendingUp, Wind,
    Trees, ShoppingBag, Umbrella, Tag, Calendar, ShieldCheck, Star,
    Trash2, Edit2, Upload, Loader2, User, LogOut, Settings, Menu, X, BrainCircuit, MessageCircle,
    Check, Paperclip, Video, Inbox
} from "lucide-react";
import Link from "next/link";
import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { insforge } from "@/lib/insforge-client";
import { useRouter } from "next/navigation";
import {
    Agent,
    Investor,
    Lead,
    Property,
    Mandatario,
    Collaborator,
    IAISuggestion,
    Interaction,
} from "@/types/admin";
import AIChat from "@/components/admin/AIChat";
import PelayoChat, { ChatButton } from "@/components/admin/PelayoChat";
import ValuationAgent from "@/components/admin/ValuationAgent";
import AgendaPanel from "@/components/admin/AgendaPanel";
import AIDashboard from "@/components/admin/AIDashboard";
import VideoCallPanel from "@/components/admin/video/VideoCallPanel";
import {
    EditAgentModal,
    AddAgentModal,
    EditInvestorModal,
    AddInvestorModal,
    MandatarioFormModal,
    CollaboratorFormModal,
    InvestorSelectorModal,
    GlobalLeadCreationModal,
    EmailInterpretationPanel,
    TrackingNoteModal,
    AddPropertySuggestionModal,
} from "@/components/admin/modals";
import AssetPortfolio from "@/components/admin/AssetPortfolio";
import CRMPipeline from "@/components/admin/CRMPipeline";
import InvestorDirectory from "@/components/admin/InvestorDirectory";
import NDAForm from "@/components/admin/NDAForm";
import { useAdminData } from "@/hooks/useAdminData";
import { useAdmin } from "@/contexts/AdminContext";

async function uploadFileToInsforgeStorage(file: File, bucket: string, fileName: string): Promise<string | null> {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bucket', bucket);
        formData.append('fileName', fileName);

        const uploadRes = await fetch('/api/storage/upload', {
            method: 'POST',
            body: formData
        });

        if (uploadRes.ok) {
            const data = await uploadRes.json();
            return data.path || null;
        }
        console.warn("InsForge storage upload failed:", uploadRes.status);
        return null;
    } catch (error) {
        console.error('Error uploading to InsForge storage:', error);
        return null;
    }
}

// Defined Pipeline Stages
const PIPELINE_STAGES = [
    { id: "prospect", label: "Prospecto", color: "bg-blue-500" },
    { id: "qualified", label: "Cualificado", color: "bg-amber-500" },
    { id: "due-diligence", label: "Due Diligence", color: "bg-purple-500" },
    { id: "offer", label: "Oferta / LOI", color: "bg-emerald-500" },
    { id: "closing", label: "Cierre", color: "bg-primary" },
];

// Pipeline stage IDs match lead status values directly — no need for mapping objects.
const VALID_STAGES = new Set(PIPELINE_STAGES.map(s => s.id));

const MOCK_ACTIVITY = [
    { id: "a1", action: "DOCUMENTO_DESCARGADO", detail: "Alberto Gala descargó 'Nota Simple - Palacio Gran Vía'", time: "hace 10 min" },
    { id: "a2", action: "PROPIEDAD_VISTA", detail: "Sofia Martinez vio 'Azure Seafront Villa'", time: "hace 2 horas" },
    { id: "a3", action: "PERFIL_ACTUALIZADO", detail: "Eduardo Santacruz completó el Onboarding de Voz", time: "hace 5 horas" },
];

const MOCK_TEMPLATES = [
    { id: "t1", name: "NDA - Acuerdo de Confidencialidad", type: "Legal", lastUsed: "hace 1 día" },
    { id: "t2", name: "LoI - Carta de Intención de Compra", type: "Legal", lastUsed: "hace 3 días" },
    { id: "t3", name: "Perfil de Inversión Resumido", type: "Interno", lastUsed: "Hoy" },
];

export default function AdminDashboard() {
    const router = useRouter();
    const { fetchAll } = useAdminData();
    const {
        leads, setLeads,
        investors, setInvestors,
        properties, setProperties,
        mandatarios, setMandatarios,
        collaborators, setCollaborators,
        agents, setAgents,
        currentUser, setCurrentUser,
        selectedLead, setSelectedLead,
        selectedProperty, setSelectedProperty,
        selectedInvestor, setSelectedInvestor,
        draggingId, setDraggingId,
        isInitialLoading, setIsInitialLoading,
        showToast: _contextShowToast, toast: _contextToast, showToastMessage, hideToast,
        interactions,
    } = useAdmin();

    const [toastContent, setToastContent] = useState({ message: '', type: 'success' as 'success' | 'error' });
    const setShowToast = (show: boolean) => {
        if (show) {
            showToastMessage(toastContent.message, toastContent.type);
        } else {
            hideToast();
        }
    };
    const setToast = ({message, type}: {message: string, type: 'success' | 'error'}) => {
        setToastContent({message, type});
    };
    const showToast = _contextShowToast;
    const toast = _contextToast;

    const [activeTab, setActiveTab] = useState<string>("crm");
    const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
    const [trackingNoteContent, setTrackingNoteContent] = useState("");
    const [activeLeadForNote, setActiveLeadForNote] = useState<string | null>(null);
    const [isSavingNote, setIsSavingNote] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
    const [priceForm, setPriceForm] = useState({ price: 0, comision_tercero: 2, comision_interna: 1 });
    const [_loading, setLoading] = useState(true);
    const [selectedAgentToEdit, setSelectedAgentToEdit] = useState<any>(null);
    const [selectedInvestorToEdit, setSelectedInvestorToEdit] = useState<any>(null);
    const [selectedMandatarioToEdit, setSelectedMandatarioToEdit] = useState<any>(null);
    const [isAddingAgent, setIsAddingAgent] = useState(false);
    const [isAddingInvestor, setIsAddingInvestor] = useState(false);
    const [isAddingMandatario, setIsAddingMandatario] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isAddingCollaborator, setIsAddingCollaborator] = useState(false);
    const [editingCollaborator, setEditingCollaborator] = useState<any>(null);
    const [isUploadingPdf, setIsUploadingPdf] = useState(false);
    const [iaiDossierFile, setIaiDossierFile] = useState<File | null>(null);
    const [isUploadingIaiDossier, setIsUploadingIaiDossier] = useState(false);
    const [isSelectingInvestorForLead, setIsSelectingInvestorForLead] = useState(false);
    const [targetPropertyForLead, setTargetPropertyForLead] = useState<any>(null);
    const [agentForm, setAgentForm] = useState({ full_name: "", email: "", role: "agent" });
    const [showAIChat, setShowAIChat] = useState(false);
    const [investorForm, setInvestorForm] = useState<any>({
        full_name: "",
        company_name: "",
        email: "",
        phone: "",
        investor_type: "",
        budget_min: 0,
        budget_max: 0,
        labels: []
    });
    const [mandatarioForm, setMandatarioForm] = useState<any>({
        full_name: "",
        company_name: "",
        email: "",
        phone: "",
        Mandatario_type: "",
        labels: []
    });
    const [collaboratorForm, setCollaboratorForm] = useState({
        full_name: "",
        company_name: "",
        email: "",
        phone: "",
        specialty: ""
    });
    const [investorAssignSearch, setInvestorAssignSearch] = useState("");
    const [isCreatingGlobalLead, setIsCreatingGlobalLead] = useState(false);
    const [stepInGlobalLead, setStepInGlobalLead] = useState(1); // 1: Asset, 2: Investor
    const [assetSearch, setAssetSearch] = useState("");

    // IAI Suggestion Processing States
    const [selectedSuggestion, setSelectedSuggestion] = useState<any>(null);
    const [isReviewingPropertySuggestion, setIsReviewingPropertySuggestion] = useState(false);
    const [propertyForm, setPropertyForm] = useState<any>({
        title: "",
        type: "",
        price: 0,
        meters: 0,
        address: "",
        vendor_name: "",
        description: ""
    });

    // IAI Inbox Suggestions
    const [iaiSuggestions, setIaiSuggestions] = useState<IAISuggestion[]>([]);
    const [iaiFilter, setIaiFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
    const [iaiTypeFilter, setIaiTypeFilter] = useState<'all' | 'property' | 'investor' | 'lead' | 'mandatario'>('all');

    // IAI Email Interpretation Modal
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailInterpretation, setEmailInterpretation] = useState<string | null>(null);
    const [isLoadingInterpretation, setIsLoadingInterpretation] = useState(false);
    const [activeEmailSuggestion, setActiveEmailSuggestion] = useState<any>(null);

    const handleApproveSuggestion = (suggestion: any) => {
        setSelectedSuggestion(suggestion);
        if (suggestion.suggestion_type === 'property') {
            setPropertyForm({
                title: suggestion.extracted_data.title || "",
                type: suggestion.extracted_data.type || "",
                price: suggestion.extracted_data.price || 0,
                meters: suggestion.extracted_data.surface || 0,
                address: suggestion.extracted_data.location || "",
                vendor_name: suggestion.extracted_data.vendor_name || "",
                description: suggestion.extracted_data.summary || "",
                comision_tercero: suggestion.extracted_data.comision_tercero || 0,
                comision_interna: suggestion.extracted_data.comision_interna || 0,
                extended_data: suggestion.extracted_data.extended_data || {}
            });
            setIsReviewingPropertySuggestion(true);
        } else if (suggestion.suggestion_type === 'investor') {
            setInvestorForm({
                full_name: suggestion.extracted_data.full_name || "",
                company_name: suggestion.extracted_data.company_name || "",
                email: suggestion.extracted_data.email || "",
                phone: suggestion.extracted_data.phone || "",
                investor_type: suggestion.extracted_data.type || "",
                budget_min: 0,
                budget_max: parseInt((suggestion.extracted_data.ticket || "0").replace(/\D/g, "")) * 1000000 || 0,
                labels: suggestion.extracted_data.labels || []
            });
            setIsAddingInvestor(true);
        } else if (suggestion.suggestion_type === 'collaborator') {
            setCollaboratorForm({
                full_name: suggestion.extracted_data.full_name || "",
                company_name: suggestion.extracted_data.company_name || "",
                email: suggestion.extracted_data.email || "",
                phone: suggestion.extracted_data.phone || "",
                specialty: suggestion.extracted_data.type || ""
            });
            setIsAddingCollaborator(true);
        } else {
            // Mandatario
            setMandatarioForm({
                full_name: suggestion.extracted_data.full_name || "",
                company_name: suggestion.extracted_data.company_name || "",
                email: suggestion.extracted_data.email || "",
                phone: suggestion.extracted_data.phone || "",
                mandatario_type: suggestion.extracted_data.type || "",
                labels: suggestion.extracted_data.labels || []
            });
            setIsAddingMandatario(true);
        }
    };

    const handleRejectSuggestion = async (id: string) => {
        await insforge.database.from('iai_inbox_suggestions').update({ status: 'rejected' }).eq('id', id);
        setIaiSuggestions(prev => prev.filter(s => s.id !== id));
    };

    const handleViewEmail = async (suggestion: any) => {
        setActiveEmailSuggestion(suggestion);
        setShowEmailModal(true);
        setEmailInterpretation(null);

        // If we already have it in the suggestion object (from previous fetch)
        if (suggestion.ai_interpretation) {
            setEmailInterpretation(suggestion.ai_interpretation);
            return;
        }

        setIsLoadingInterpretation(true);
        try {
            const res = await fetch('/api/interpret-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    suggestion_id: suggestion.id,
                    email_body: suggestion.original_email_body,
                    email_subject: suggestion.original_email_subject,
                    sender_email: suggestion.sender_email,
                }),
            });
            const data = await res.json();
            if (data.interpretation) {
                setEmailInterpretation(data.interpretation);
                // Cache locally in the suggestion list
                setIaiSuggestions(prev =>
                    prev.map(s => s.id === suggestion.id ? { ...s, ai_interpretation: data.interpretation } : s)
                );
            } else {
                setEmailInterpretation('❌ No se pudo interpretar el email. Inténtalo de nuevo.');
            }
        } catch (err) {
            console.error('Error interpreting email:', err);
            setEmailInterpretation('❌ Error de conexión al interpretar el email.');
        } finally {
            setIsLoadingInterpretation(false);
        }
    };

    const handleSubmitPropertySuggestion = async () => {
        try {
            setIsUploadingIaiDossier(true);
            let pdfUrl = null;

            if (iaiDossierFile) {
                const fileExt = iaiDossierFile.name.split('.').pop();
                const fileName = `dossiers/iai_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                pdfUrl = await uploadFileToInsforgeStorage(iaiDossierFile, 'properties', fileName);
                if (!pdfUrl) {
                    console.warn("Could not upload AI PDF to InsForge Storage");
                }
            }

            // Map type to database enum asset_class
            const typeMapping: any = {
                'Hotel': 'hotel',
                'Edificio': 'building',
                'Suelo': 'land',
                'Retail': 'retail',
                'Oficinas': 'office',
                'Logístico': 'industrial',
                'Otro': 'other'
            };

            const newProperty = {
                title: propertyForm.title,
                description: propertyForm.description,
                price_eur: Number(propertyForm.price) || 0,
                m2_total: Number(propertyForm.meters) || 0,
                status: 'Origen Privado',
                asset_type: typeMapping[propertyForm.type] || 'other',
                location: propertyForm.address || 'Ubicación Proporionada',
                is_off_market: true,
                thumbnail_url: null,
                images: [],
                extended_data: {
                    ...propertyForm.extended_data,
                    vendor_name: propertyForm.vendor_name || null,
                    comision_tercero: propertyForm.comision_tercero || 0,
                    comision_interna: propertyForm.comision_interna || 0,
                    dossier_url: pdfUrl,
                    category: selectedSuggestion ?
                        (selectedSuggestion.extracted_data?._iai_has_dossier === false ? ['IAI', 'Sin Dossier'] : ['IAI'])
                        : []
                },
            };

            const { data: insertedData, error: insertError } = await insforge.database
                    .from('properties')
                .insert([newProperty])
                .select();

            if (insertError) throw insertError;

            if (insertedData) {
                setProperties(prev => [insertedData[0], ...prev]);
                setShowToast(true);
            }

            // Mark suggestion as approved
            if (selectedSuggestion) {
                await insforge.database.from('iai_inbox_suggestions').update({ status: 'approved' }).eq('id', selectedSuggestion.id);
                setIaiSuggestions(prev => prev.filter(s => s.id !== selectedSuggestion.id));
            }

            setIsReviewingPropertySuggestion(false);
            setSelectedSuggestion(null);
            setIaiDossierFile(null);
            setIsUploadingIaiDossier(false);
            setToast({ message: "Activo dado de alta exitosamente", type: 'success' });
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        } catch (err: any) {
            console.error("Error creating property from suggestion:", err);
            setIsUploadingIaiDossier(false);
            setToast({ message: `Error al dar de alta el activo: ${err.message || "Error desconocido"}`, type: 'error' });
            setShowToast(true);
            setTimeout(() => setShowToast(false), 5000);
        }
    };

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = localStorage.getItem('insforge_token');
                const headers: HeadersInit = {};
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }

                const res = await fetch('/api/auth/me', { headers });
                if (!res.ok) {
                    router.push("/login");
                    return;
                }

                const { user, profile } = await res.json();

                if (!user || !profile) {
                    router.push("/login");
                    return;
                }

                const normalizedEmail = user.email?.toLowerCase();
                const isGodMode = normalizedEmail === 'beenocode@gmail.com' || normalizedEmail === 'albertogala@beenocode.com';

                if (profile.role !== 'admin' && profile.role !== 'agent' && !isGodMode) {
                    router.push("/radar");
                    return;
                }

                setCurrentUser({
                    id: user.id,
                    email: user.email,
                    role: profile.role,
                    full_name: profile.name || user.email
                });

                await fetchAll();
                setLoading(false);
            } catch (err) {
                console.error("Auth check failed:", err);
                router.push("/login");
            }
        };
        checkAuth();
    }, [router]);

useEffect(() => {
        if (activeTab === "agents" && currentUser?.role === "admin") {
            fetchAll();
        }
    }, [activeTab, currentUser]);
    
    const handleLogout = async () => {
        await insforge.auth.signOut();
        window.location.href = "/";
    };

    const handleApproveAgent = async (id: string) => {
        const { error } = await insforge.database
                    .from('agents')
            .update({ is_approved: true, has_centurion_access: true })
            .eq('id', id);

        if (!error) {
            setAgents(prev => prev.map(a => a.id === id ? { ...a, is_approved: true, has_centurion_access: true } : a));
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        }
    };

    const handleRejectAgent = async (id: string) => {
        if (currentUser?.role !== 'admin') {
            alert('Solo el administrador puede eliminar agentes.');
            return;
        }
        const { error } = await insforge.database
                    .from('agents')
            .delete()
            .eq('id', id);

        if (!error) {
            setAgents(prev => prev.filter(a => a.id !== id));
        }
    };

    const handleDeleteInvestor = async (id: string) => {
        if (currentUser?.role !== 'admin') {
            alert('Solo el administrador puede eliminar inversores.');
            return;
        }
        if (!confirm("¿Estás seguro de que quieres eliminar a este inversor? Esta acción es irreversible.")) return;
        const { error } = await insforge.database
                    .from('investors')
            .delete()
            .eq('id', id);

        if (!error) {
            setInvestors((prev: any[]) => prev.filter((i: any) => i.id !== id));
            if (selectedInvestor?.id === id) setSelectedInvestor(null);
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        } else {
            console.error("Error deleting investor", error);
        }
    };

    const handleDeleteLead = async (id: string) => {
        if (currentUser?.role !== 'admin') {
            alert('Solo el administrador puede eliminar leads.');
            return;
        }
        if (!confirm("¿Estás seguro de que quieres eliminar esta ficha de Operativa (Lead)? Esta acción es irreversible.")) return;
        const { error } = await insforge.database
                    .from('leads')
            .delete()
            .eq('id', id);

        if (!error) {
            setLeads((prev: any[]) => prev.filter((l: any) => l.id !== id));
            if (selectedLead?.id === id) setSelectedLead(null);
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        } else {
            console.error("Error deleting lead", error);
        }
    };

    const handleDeleteProperty = async (id: string) => {
        if (currentUser?.role !== 'admin') {
            alert('Solo el administrador puede eliminar propiedades.');
            return;
        }
        if (!confirm("¿Estás seguro de que quieres dar de baja esta propiedad?")) return;
        const { error } = await insforge.database
                    .from('properties')
            .delete()
            .eq('id', id);

        if (!error) {
            setProperties((prev: any[]) => prev.filter((p: any) => p.id !== id));
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        } else {
            console.error("Error deleting property", error);
        }
    };

    const handleCreateLead = async (investorId: string, propertyId: string) => {
        try {
            const { data, error } = await insforge.database
                    .from('leads')
                .insert([{
                    investor_id: investorId,
                    property_id: propertyId,
                    status: 'prospect',
                    created_at: new Date().toISOString()
                }])
                .select();

            if (!error) {
                await fetchAll(); // Refresh leads
                setIsSelectingInvestorForLead(false);
                setTargetPropertyForLead(null);
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);

                // Optionally switch to CRM tab to show it's there
                setActiveTab("crm");
                setSelectedProperty(null); // Close property detail
            } else {
                console.error("Error creating lead:", error);
            }
        } catch (error) {
            console.error("Catch error creating lead:", error);
        }
    };

    const handleUpdatePropertyPrice = async () => {
        if (!selectedProperty) return;
        const { error } = await insforge.database
                    .from('properties')
            .update({
                price: priceForm.price,
                comision_tercero: priceForm.comision_tercero,
                comision_interna: priceForm.comision_interna,
                updated_at: new Date().toISOString()
            })
            .eq('id', selectedProperty.id);

        if (!error) {
            // Update local state so UI reflects immediately
            const updated = { ...selectedProperty, ...priceForm };
            setSelectedProperty(updated);
            setProperties((prev: any[]) => prev.map((p: any) => p.id === selectedProperty.id ? { ...p, ...priceForm } : p));
            setEditingPriceId(null);
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        } else {
            console.error("Error updating property price:", error);
        }
    };

    const handleUploadPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingPdf(true);
        try {
            // 1. Upload original PDF to InsForge Storage (bucket 'properties')
            let pdfUrl = null;
            const fileExt = file.name.split('.').pop();
            const fileName = `dossiers/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

            pdfUrl = await uploadFileToInsforgeStorage(file, 'properties', fileName);
            if (!pdfUrl) {
                console.warn("Could not upload PDF to InsForge Storage");
            }

            // 2. Parse PDF dynamically
            const rawPdfjs = await import('pdfjs-dist');
            const pdfjsLib: any = rawPdfjs.default ? rawPdfjs.default : rawPdfjs;

            if (pdfjsLib.GlobalWorkerOptions) {
                const version = pdfjsLib.version || '3.11.174';
                pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`;
            }

            const arrayBuffer = await file.arrayBuffer();
            const typedArray = new Uint8Array(arrayBuffer);
            const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;

            let fullText = "";
            const extractedImages: string[] = [];

            // Extract text from all pages
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map((item: any) => item.str).join(" ");
                fullText += pageText + "\n";
            }

            // Extract images from first 3 pages by rendering them via Canvas
            for (let i = 1; i <= Math.min(pdf.numPages, 3); i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 1.5 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                if (context) {
                    await page.render({ canvasContext: context, viewport }).promise;
                    extractedImages.push(canvas.toDataURL('image/jpeg', 0.8));
                }
            }

            // Parse text with Groq via our Next.js API Route
            const groqResponse = await fetch('/api/parse-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: fullText.substring(0, 15000) }) // Send up to 15k chars to avoid token limits
            });

            if (!groqResponse.ok) {
                throw new Error("Error al analizar el PDF con la IA");
            }

            const { extracted_data } = await groqResponse.json();

            const typeMapping: any = {
                'Hotel': 'hotel',
                'Edificio': 'building',
                'Suelo': 'land',
                'Retail': 'retail',
                'Oficinas': 'office',
                'Logístico': 'industrial',
                'Otro': 'other'
            };

            const newProperty = {
                title: extracted_data?.title || file.name.replace('.pdf', ''),
                description: extracted_data?.summary || fullText.substring(0, 800) + (fullText.length > 800 ? "..." : ""),
                price_eur: Number(extracted_data?.price) || 0,
                m2_total: Number(extracted_data?.surface) || 0,
                location: extracted_data?.location || 'Ubicación Extraída',
                thumbnail_url: extractedImages[0] || null,
                // images: extractedImages, // Schema in migration doesn't have images array yet
                asset_type: typeMapping[extracted_data?.type] || 'other',
                is_off_market: true,
                is_published: false,
                extended_data: {
                    ...(extracted_data?.extended_data || {}),
                    vendor_name: extracted_data?.vendor_name || null,
                    comision_tercero: Number(extracted_data?.comision_tercero) || 0,
                    comision_interna: Number(extracted_data?.comision_interna) || 0,
                    dossier_url: pdfUrl,
                    full_images: extractedImages
                }
            };

            const { data: insertedData, error: insertError } = await insforge.database
                    .from('properties')
                .insert([newProperty])
                .select();

            if (insertError) throw insertError;

            if (insertedData) {
                setProperties(prev => [insertedData[0], ...prev]);
                setShowToast(true);
            }

        } catch (err: any) {
            console.error("Error processing PDF:", err?.message || err, err?.stack || "");
            setToast({ message: `Error al procesar el PDF: ${err?.message || 'Error desconocido'}`, type: 'error' });
            setShowToast(true);
            setTimeout(() => setShowToast(false), 5000);
        } finally {
            setIsUploadingPdf(false);
            if (e.target) e.target.value = '';
        }
    };

    const handleUpdateAgent = async (agent: any) => {
        const { error } = await insforge.database
                    .from('agents')
            .update({
                full_name: agent.full_name,
                role: agent.role,
                is_approved: agent.is_approved,
                has_centurion_access: agent.has_centurion_access
            })
            .eq('id', agent.id);

        if (!error) {
            setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, ...agent } : a));
            setSelectedAgentToEdit(null);
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        }
    };

    const handleUpdateInvestor = async (investor: any) => {
        const { error } = await insforge.database
                    .from('investors')
            .update({
                full_name: investor.full_name,
                company_name: investor.company_name,
                phone: investor.phone,
                investor_type: investor.investor_type,
                budget_min: investor.budget_min,
                budget_max: investor.budget_max,
                labels: investor.labels
            })
            .eq('id', investor.id);

        if (!error) {
            setInvestors(prev => prev.map(i => i.id === investor.id ? { ...i, ...investor } : i));
            setSelectedInvestorToEdit(null);
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        } else {
            console.error("Error updating investor:", error);
        }
    };

    const handleToggleVerification = async (investorId: string, currentStatus: boolean) => {
        const { error } = await insforge.database
                    .from('investors')
            .update({ is_verified: !currentStatus })
            .eq('id', investorId);

        if (!error) {
            setInvestors(prev => prev.map(i => i.id === investorId ? { ...i, is_verified: !currentStatus } : i));
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        } else {
            console.error("Error updating verification status:", error);
        }
    };

    const handleUpdateLeadFunnel = async (leadId: string, updates: any) => {
        const lead = leads.find(l => l.id === leadId);
        if (!lead) return;

        const { error } = await insforge.database
                    .from('leads')
            .update(updates)
            .eq('id', leadId);

        if (!error) {
            setLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...updates } : l));
            if (selectedLead?.id === leadId) {
                setSelectedLead({ ...selectedLead, ...updates });
            }

            // Sync with Property (Asset) Price Information
            if (lead.property_id && (updates.alea_commission !== undefined || updates.intermediaries !== undefined)) {
                const updatedLeadState = { ...lead, ...updates };
                const propUpdates: any = {};

                if (updates.alea_commission !== undefined) {
                    propUpdates.comision_interna = updates.alea_commission;
                }

                if (updates.intermediaries !== undefined) {
                    const totalExternal = (updates.intermediaries || []).reduce((acc: number, curr: any) => acc + (parseFloat(curr.commission) || 0), 0);
                    propUpdates.comision_tercero = totalExternal;
                }

                if (Object.keys(propUpdates).length > 0) {
                    await insforge.database.from('properties').update(propUpdates).eq('id', lead.property_id);
                    setProperties(prev => prev.map(p => p.id === lead.property_id ? { ...p, ...propUpdates } : p));
                }
            }

            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        } else {
            console.error("Error updating lead funnel:", error);
        }
    };

    const handleCreateAgent = async () => {
        const { error } = await insforge.database
                    .from('agents')
            .insert([{
                id: crypto.randomUUID(),
                ...agentForm,
                is_approved: true,
                has_centurion_access: agentForm.role === 'admin',
                created_at: new Date().toISOString()
            }]);

        if (error) {
            console.error("Error creating agent:", error);
            alert("Error al crear agente: " + error.message);
            return;
        }

        const { data } = await insforge.database.from('agents').select('*').order('created_at', { ascending: false });
        if (data) setAgents(data);
        setIsAddingAgent(false);
        setAgentForm({ full_name: "", email: "", role: "agent" });
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    const handleCreateInvestor = async () => {
        try {
            const { error } = await insforge.database
                    .from('investors')
                .insert([{
                    ...investorForm,
                    status: 'nuevo',
                    kyc_status: 'pending',
                    created_at: new Date().toISOString()
                }]);

            if (!error) {
                await fetchAll(); // Refresh list
                setIsAddingInvestor(false);
                setInvestorForm({
                    full_name: "",
                    company_name: "",
                    email: "",
                    phone: "",
                    investor_type: "",
                    budget_min: 0,
                    budget_max: 0,
                    labels: []
                });
                setShowToast(true);

                if (selectedSuggestion) {
                    await insforge.database.from('iai_inbox_suggestions').update({ status: 'approved' }).eq('id', selectedSuggestion.id);
                    setIaiSuggestions(prev => prev.filter(s => s.id !== selectedSuggestion.id));
                    setSelectedSuggestion(null);
                }

                setTimeout(() => setShowToast(false), 3000);
            } else {
                console.error("Error creating investor:", error);
                setToast({ message: `Error al crear inversor: ${error.message || "Permiso denegado por seguridad (RLS)"}`, type: 'error' });
                setShowToast(true);
                setTimeout(() => setShowToast(false), 5000);
            }
        } catch (error: any) {
            console.error("Error creating investor:", error);
            setToast({ message: `Error inesperado: ${error.message}`, type: 'error' });
            setShowToast(true);
            setTimeout(() => setShowToast(false), 5000);
        }
    };

    const handleCreateMandatario = async () => {
        try {
            const { error } = await insforge.database
                    .from('mandatarios')
                .insert([{
                    ...mandatarioForm,
                    status: 'nuevo',
                    kyc_status: 'pending',
                    created_at: new Date().toISOString()
                }]);

            if (!error) {
                await fetchAll(); // Refresh list
                setIsAddingMandatario(false);
                setMandatarioForm({
                    full_name: "",
                    company_name: "",
                    email: "",
                    phone: "",
                    mandatario_type: "",
                    labels: []
                });
                setShowToast(true);

                if (selectedSuggestion) {
                    await insforge.database.from('iai_inbox_suggestions').update({ status: 'approved' }).eq('id', selectedSuggestion.id);
                    setIaiSuggestions(prev => prev.filter(s => s.id !== selectedSuggestion.id));
                    setSelectedSuggestion(null);
                }

                setTimeout(() => setShowToast(false), 3000);
            } else {
                console.error("Error creating mandatario:", error);
                setToast({ message: `Error al crear mandatario: ${error.message || "Permiso denegado por seguridad (RLS)"}`, type: 'error' });
                setShowToast(true);
                setTimeout(() => setShowToast(false), 5000);
            }
        } catch (error: any) {
            console.error("Error creating mandatario:", error);
            setToast({ message: `Error inesperado: ${error.message}`, type: 'error' });
            setShowToast(true);
            setTimeout(() => setShowToast(false), 5000);
        }
    };

    const handleUpdateMandatario = async (mandatario: any) => {
        const { error } = await insforge.database
                    .from('mandatarios')
            .update({
                full_name: mandatario.full_name,
                company_name: mandatario.company_name,
                phone: mandatario.phone,
                mandatario_type: mandatario.mandatario_type,
                labels: mandatario.labels
            })
            .eq('id', mandatario.id);

        if (!error) {
            setMandatarios(prev => prev.map(m => m.id === mandatario.id ? { ...m, ...mandatario } : m));
            setSelectedMandatarioToEdit(null);
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        } else {
            console.error("Error updating mandatario:", error);
        }
    };

    const handleDeleteMandatario = async (id: string) => {
        if (currentUser?.role !== 'admin') {
            alert('Solo el administrador puede eliminar mandatarios.');
            return;
        }
        const { error } = await insforge.database
                    .from('mandatarios')
            .delete()
            .eq('id', id);

        if (!error) {
            setMandatarios(prev => prev.filter(m => m.id !== id));
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        } else {
            console.error("Error deleting mandatario:", error);
        }
    };

    const handleCreateCollaborator = async () => {
        try {
            const { data, error } = await insforge.database
                    .from('collaborators')
                .insert([{
                    ...collaboratorForm,
                    created_at: new Date().toISOString()
                }])
                .select();

            if (!error) {
                if (data) setCollaborators(prev => [data[0], ...prev]);

                if (selectedSuggestion) {
                    await insforge.database.from('iai_inbox_suggestions').update({ status: 'approved' }).eq('id', selectedSuggestion.id);
                    setIaiSuggestions(prev => prev.filter(s => s.id !== selectedSuggestion.id));
                    setSelectedSuggestion(null);
                }

                setIsAddingCollaborator(false);
                setCollaboratorForm({
                    full_name: "",
                    company_name: "",
                    email: "",
                    phone: "",
                    specialty: ""
                });
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
            } else {
                console.error("Error creating collaborator:", error);
            }
        } catch (error) {
            console.error("Catch error creating collaborator:", error);
        }
    };

    const handleDeleteCollaborator = async (id: string) => {
        if (currentUser?.role !== 'admin') {
            alert('Solo el administrador puede eliminar colaboradores.');
            return;
        }
        if (!confirm("¿Estás seguro de que quieres eliminar a este colaborador?")) return;
        const { error } = await insforge.database
                    .from('collaborators')
            .delete()
            .eq('id', id);

        if (!error) {
            setCollaborators(prev => prev.filter(c => c.id !== id));
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        } else {
            console.error("Error deleting collaborator", error);
        }
    };

    const handleUpdateCollaborator = async () => {
        if (!editingCollaborator) return;
        try {
            const { data, error } = await insforge.database
                    .from('collaborators')
                .update({
                    full_name: collaboratorForm.full_name,
                    specialty: collaboratorForm.specialty,
                    company_name: collaboratorForm.company_name,
                    email: collaboratorForm.email,
                    phone: collaboratorForm.phone,
                })
                .eq('id', editingCollaborator.id)
                .select();

            if (!error && data) {
                setCollaborators(prev => prev.map(c => c.id === editingCollaborator.id ? data[0] : c));
                setEditingCollaborator(null);
                setCollaboratorForm({ full_name: '', company_name: '', email: '', phone: '', specialty: '' });
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
            } else {
                console.error('Error updating collaborator:', error);
            }
        } catch (error) {
            console.error('Catch error updating collaborator:', error);
        }
    };

    // Refs for columns to detect drop zones
    const columnRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const handleDragStart = (id: string) => {
        setDraggingId(id);
    };

    const handleDragEnd = async (event: any, info: any, leadId: string) => {
        setDraggingId(null);

        // Find which column the pointer is over
        const point = info.point;
        let targetStageId = null;

        for (const stage of PIPELINE_STAGES) {
            const el = columnRefs.current[stage.id];
            if (el) {
                const rect = el.getBoundingClientRect();
                if (point.x >= rect.left && point.x <= rect.right) {
                    targetStageId = stage.id;
                    break;
                }
            }
        }

        if (targetStageId) {
            const lead = leads.find(l => l.id === leadId);

            if (lead && lead.status !== targetStageId) {
                // Update local state for optimistic UI
                setLeads(prev => prev.map(l =>
                    l.id === leadId ? { ...l, status: targetStageId } : l
                ));

                // Persist to Supabase
                const { error } = await insforge.database
                    .from('leads')
                    .update({ status: targetStageId, updated_at: new Date().toISOString() })
                    .eq('id', leadId);

                if (error) {
                    console.error("Error updating lead status:", error);
                    // Revert local state if needed
                    await fetchAll();
                } else {
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 3000);
                }
            }
        }
    };

    const _handleAddInteraction = (leadId: string) => {
        setActiveLeadForNote(leadId);
        setTrackingNoteContent("");
        setIsTrackingModalOpen(true);
    };

    const handleSaveTrackingNote = async () => {
        if (!activeLeadForNote || !trackingNoteContent.trim()) return;

        setIsSavingNote(true);
        try {
            const { error } = await insforge.database
                    .from('interactions')
                .insert([{
                    lead_id: activeLeadForNote,
                    type: 'note',
                    content: trackingNoteContent
                }]);

            if (error) throw error;

            setToast({ message: "Nota añadida correctamente", type: 'success' });
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
            setIsTrackingModalOpen(false);
            setTrackingNoteContent("");
            setActiveLeadForNote(null);
            fetchAll();
        } catch (err: any) {
            setToast({ message: `Error al añadir nota: ${err.message}`, type: 'error' });
            setShowToast(true);
            setTimeout(() => setShowToast(false), 5000);
        } finally {
            setIsSavingNote(false);
        }
    };

    const renderInvestorProfile = (investor: any) => {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-6xl mx-auto w-full p-8"
            >
                <div className="flex items-center justify-between mb-12">
                    <button
                        onClick={() => setSelectedInvestor(null)}
                        className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <span>← Volver al Pipeline</span>
                    </button>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setSelectedInvestorToEdit(investor)}
                            className="px-6 py-2 bg-primary/10 text-primary rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-primary hover:text-white transition-all"
                        >
                            Editar Perfil
                        </button>
                        <button className="px-6 py-2 bg-foreground text-background rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-foreground/90 transition-all">Generar Reporte KYC</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Sidebar Info */}
                    <div className="lg:col-span-1 space-y-8">
                        <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-sm">
                            <div className="w-24 h-24 bg-primary/5 rounded-3xl flex items-center justify-center text-4xl font-serif text-primary mb-6 border border-primary/10">
                                {investor.investor?.charAt(0) || 'I'}
                            </div>
                            <h2 className="text-2xl font-serif font-medium mb-1">{investor.investor || investor.full_name}</h2>
                            <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-4">{investor.type || investor.investor_type}</p>

                            {investor.labels && investor.labels.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {investor.labels.map((label: string) => (
                                        <span key={label} className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-[9px] font-black uppercase tracking-widest">
                                            {label}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="space-y-4 pt-6 border-t border-border">
                                <div className="flex items-center space-x-3 text-sm">
                                    <Mail size={16} className="text-primary/40" />
                                    <span>{investor.email}</span>
                                </div>
                                <div className="flex items-center space-x-3 text-sm">
                                    <Activity size={16} className="text-primary/40" />
                                    <span className="text-green-500 font-bold uppercase text-[10px] tracking-widest">Inversor Verificado</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-sm">
                            <h3 className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold mb-6">Tesis de Inversión</h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Ticket Preferencial</p>
                                    <p className="text-lg font-serif">{investor.ticket}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Sectores de Interés</p>
                                    <div className="flex flex-wrap gap-2">
                                        {investor.interests?.map((interest: string) => (
                                            <span key={interest} className="px-3 py-1 bg-muted rounded-full text-[10px] font-bold uppercase tracking-wider">{interest}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Profiling */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-card border border-border rounded-[2.5rem] p-10 shadow-sm">
                            <h3 className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold mb-8">Historial de Operaciones</h3>
                            <div className="space-y-6">
                                <div className="p-6 bg-muted/30 rounded-3xl border border-border/50 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-bold">{investor.property}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">{investor.status}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-serif text-primary">{investor.matchScore}% Match</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-card border border-border rounded-[2.5rem] p-10 shadow-sm">
                            <h3 className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold mb-8">Documentación KYC</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 border border-border rounded-2xl flex items-center justify-between group hover:bg-muted/50 transition-all">
                                    <div className="flex items-center space-x-3">
                                        <FileText size={18} className="text-primary/60" />
                                        <span className="text-xs font-bold uppercase tracking-wider">NDA Firmado</span>
                                    </div>
                                    <Download size={14} className="text-muted-foreground group-hover:text-primary transition-colors cursor-pointer" />
                                </div>
                                <div className="p-4 border border-border rounded-2xl flex items-center justify-between group hover:bg-muted/50 transition-all">
                                    <div className="flex items-center space-x-3">
                                        <ShieldAlert size={18} className="text-primary/60" />
                                        <span className="text-xs font-bold uppercase tracking-wider">Origen de Fondos</span>
                                    </div>
                                    <Download size={14} className="text-muted-foreground group-hover:text-primary transition-colors cursor-pointer" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    };

    const renderPropertyDetail = (property: any) => {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-[1400px] mx-auto w-full p-8"
            >
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-4">
                    <div className="flex-1">
                        <button
                            onClick={() => setSelectedProperty(null)}
                            className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-4"
                        >
                            <ChevronLeft size={16} />
                            <span>Volver a Inventario</span>
                        </button>
                        <h1 className="text-3xl md:text-4xl font-serif font-medium leading-tight mb-2 uppercase tracking-tight">
                            {property.title}
                        </h1>
                        <div className="flex items-center text-sm text-muted-foreground font-medium">
                            <MapPin size={16} className="text-primary mr-2" />
                            <span className="uppercase tracking-wider">{property.address}</span>
                        </div>

                        {/* 🚨 IAI Missing Dossier Warning 🚨 */}
                        {(property.category?.includes('IAI') && !property.dossier_url) && (
                            <div className="mt-4 inline-flex items-center bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-2.5 rounded-xl shadow-sm">
                                <FileText size={18} className="mr-3 shrink-0" />
                                <span className="text-xs font-bold uppercase tracking-widest">
                                    🚨 Datos aportados por IA Alea — Falta dossier en el activo
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        {property.dossier_url && (
                            <a
                                href={property.dossier_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-2 px-6 py-3 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                            >
                                <FileText size={16} />
                                <span>Ver Dossier Original</span>
                            </a>
                        )}
                        <button
                            onClick={() => {
                                setTargetPropertyForLead(property);
                                setIsSelectingInvestorForLead(true);
                            }}
                            className="flex items-center space-x-2 px-6 py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                        >
                            <ArrowUpRight size={16} />
                            <span>Generar Oportunidad</span>
                        </button>
                        <button className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 hidden md:flex">
                            <FileText size={16} />
                            <span>Generar PDF</span>
                        </button>
                        <button className="flex items-center space-x-2 px-6 py-3 bg-white border border-border rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-muted transition-all text-foreground">
                            <Share2 size={16} />
                            <span>Compartir</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Main Content (Left Column) */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Gallery Section */}
                        {(() => {
                            const images: string[] = property.images?.length > 0
                                ? property.images
                                : ["https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80"];
                            const total = images.length;
                            const goTo = (idx: number) => setActiveImageIndex((idx + total) % total);

                            return (
                                <div className="relative group">
                                    {/* Main Image */}
                                    <div className="aspect-[16/10] bg-muted rounded-[2.5rem] overflow-hidden border border-border/50 relative">
                                        <AnimatePresence mode="wait">
                                            <motion.img
                                                key={activeImageIndex}
                                                src={images[activeImageIndex]}
                                                alt={`${property.title} — foto ${activeImageIndex + 1}`}
                                                initial={{ opacity: 0, scale: 1.03 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="w-full h-full object-cover"
                                            />
                                        </AnimatePresence>

                                        {/* Badges */}
                                        <div className="absolute top-6 left-6 flex space-x-2">
                                            <span className="px-4 py-1.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center shadow-lg">
                                                <Star size={12} className="mr-2 fill-white" />
                                                Exclusiva
                                            </span>
                                        </div>

                                        {/* Counter */}
                                        <div className="absolute bottom-6 right-6 px-4 py-2 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold rounded-xl border border-white/10">
                                            {activeImageIndex + 1} / {total}
                                        </div>

                                        {/* Prev / Next arrows — only shown when >1 image */}
                                        {total > 1 && (
                                            <>
                                                <button
                                                    onClick={() => goTo(activeImageIndex - 1)}
                                                    className="absolute left-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-2xl bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-primary transition-all opacity-0 group-hover:opacity-100 border border-white/10 shadow-lg"
                                                    aria-label="Foto anterior"
                                                >
                                                    <ChevronLeft size={20} />
                                                </button>
                                                <button
                                                    onClick={() => goTo(activeImageIndex + 1)}
                                                    className="absolute right-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-2xl bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-primary transition-all opacity-0 group-hover:opacity-100 border border-white/10 shadow-lg"
                                                    aria-label="Foto siguiente"
                                                >
                                                    <ChevronLeft size={20} className="rotate-180" />
                                                </button>
                                            </>
                                        )}
                                    </div>

                                    {/* Thumbnails strip */}
                                    <div className="flex space-x-3 mt-5 overflow-x-auto pb-2 no-scrollbar">
                                        {images.map((img: string, i: number) => (
                                            <button
                                                key={i}
                                                onClick={() => goTo(i)}
                                                className={`w-24 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all duration-200 ${i === activeImageIndex
                                                    ? 'border-primary scale-105 shadow-lg shadow-primary/20'
                                                    : 'border-transparent opacity-60 hover:opacity-100 hover:border-border'
                                                    }`}
                                            >
                                                <img
                                                    src={img}
                                                    alt={`Vista ${i + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Description Section */}
                        <div className="bg-card border border-border/60 rounded-[2.5rem] p-10 shadow-sm text-white">
                            <h3 className="flex items-center space-x-3 text-lg font-serif font-medium mb-8">
                                <FileText className="text-primary" size={24} />
                                <span className="text-foreground">Descripción</span>
                            </h3>
                            <div className="text-muted-foreground leading-relaxed font-light text-lg">
                                {property.description || "Sin descripción disponible."}
                            </div>
                        </div>



                        {/* Generic Overview */}
                        <div className="bg-card border border-border/60 rounded-[2.5rem] p-10 shadow-sm text-white">
                            <h3 className="flex items-center space-x-3 text-lg font-serif font-medium mb-10">
                                <Building className="text-primary" size={24} />
                                <span className="text-foreground">Resumen del Activo</span>
                            </h3>

                            {/* Icon Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                                {[
                                    { icon: Maximize2, label: "Superficie", value: `${property.meters || property.parcela_meters || 0}` },
                                    { icon: TrendingUp, label: "Rentabilidad", value: property.extended_data?.investment?.rentabilidad || property.rentabilidad || "Consultar" },
                                    { icon: Sparkles, label: "Estado", value: property.status || "A consultar" },
                                    { icon: Building, label: "Tipo", value: property.type || "Activo Comercial" }
                                ].map((item, i) => (
                                    <div key={i} className="bg-muted/30 p-6 rounded-3xl border border-border/40 text-center flex flex-col items-center group hover:bg-primary/5 hover:border-primary/20 transition-all">
                                        <item.icon className="text-primary/40 group-hover:text-primary transition-colors mb-4" size={24} />
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mb-1">{item.label}</p>
                                        <p className="text-base font-bold font-serif text-foreground truncate w-full">{item.value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Info List */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6 text-sm">
                                {[
                                    { label: "Tipo General:", value: property.type || "Comercial" },
                                    { label: "Referencia Alea:", value: property.reference || "Pendiente", valueClass: "font-mono font-bold" },
                                    { label: "Estado Actual:", value: property.status || "En evaluación" },
                                    { label: "Ubicación:", value: property.location || property.address || "A consultar" },
                                    { label: "Agente responsable:", value: property.agent_responsible || "Equipo Alea", valueClass: "font-serif italic text-primary" }
                                ].map((row, i) => (
                                    <div key={i} className="flex justify-between items-center py-3 border-b border-border/30 last:border-0">
                                        <span className="text-muted-foreground uppercase tracking-widest text-[10px] font-bold">{row.label}</span>
                                        <span className={`text-right text-foreground ${row.valueClass || 'font-bold'}`}>{row.value}</span>
                                    </div>
                                ))}
                            </div>


                        </div>

                        {/* =========================================
                            UNIFIED ASSET FORM (MODULAR BLOCKS) 
                            ========================================= */}
                        {property.extended_data && Object.keys(property.extended_data).length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* ECONOMICS BLOCK */}
                                {property.extended_data.economics && Object.keys(property.extended_data.economics).length > 0 && (
                                    <div className="bg-card border border-border/60 rounded-[2rem] p-8 shadow-sm">
                                        <h4 className="flex items-center text-[10px] uppercase tracking-[0.2em] font-black text-amber-500 mb-6">
                                            <Activity size={14} className="mr-2" />
                                            Datos Económicos y Legales
                                        </h4>
                                        <div className="space-y-4">
                                            {Object.entries(property.extended_data.economics).map(([key, value]) => (
                                                <div key={key} className="flex justify-between items-start text-sm border-b border-border/30 pb-3 last:border-0">
                                                    <span className="text-muted-foreground uppercase tracking-wider text-[10px] font-bold mt-1 shrink-0">{key.replace(/_/g, ' ')}</span>
                                                    <span className="text-right font-medium text-white max-w-[60%] pl-4">{String(value)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* SURFACES BLOCK */}
                                {property.extended_data.surfaces && Object.keys(property.extended_data.surfaces).length > 0 && (
                                    <div className="bg-card border border-border/60 rounded-[2rem] p-8 shadow-sm">
                                        <h4 className="flex items-center text-[10px] uppercase tracking-[0.2em] font-black text-emerald-500 mb-6">
                                            <Maximize2 size={14} className="mr-2" />
                                            Superficies y Características
                                        </h4>
                                        <div className="space-y-4">
                                            {Object.entries(property.extended_data.surfaces).map(([key, value]) => (
                                                <div key={key} className="flex justify-between items-start text-sm border-b border-border/30 pb-3 last:border-0">
                                                    <span className="text-muted-foreground uppercase tracking-wider text-[10px] font-bold mt-1 shrink-0">{key.replace(/_/g, ' ')}</span>
                                                    <span className="text-right font-medium text-white max-w-[60%] pl-4">{String(value)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* URBANISTIC BLOCK */}
                                {property.extended_data.urbanistic && Object.keys(property.extended_data.urbanistic).length > 0 && (
                                    <div className="bg-card border border-border/60 rounded-[2rem] p-8 shadow-sm">
                                        <h4 className="flex items-center text-[10px] uppercase tracking-[0.2em] font-black text-purple-500 mb-6">
                                            <MapPin size={14} className="mr-2" />
                                            Información Urbanística
                                        </h4>
                                        <div className="space-y-4">
                                            {Object.entries(property.extended_data.urbanistic).map(([key, value]) => (
                                                <div key={key} className="flex justify-between items-start text-sm border-b border-border/30 pb-3 last:border-0">
                                                    <span className="text-muted-foreground uppercase tracking-wider text-[10px] font-bold mt-1 shrink-0">{key.replace(/_/g, ' ')}</span>
                                                    <span className="text-right font-medium text-white max-w-[60%] pl-4">{String(value)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* INVESTMENT BLOCK */}
                                {property.extended_data.investment && Object.keys(property.extended_data.investment).length > 0 && (
                                    <div className="bg-card border border-border/60 rounded-[2rem] p-8 shadow-sm md:col-span-2">
                                        <h4 className="flex items-center text-[10px] uppercase tracking-[0.2em] font-black text-blue-500 mb-6">
                                            <TrendingUp size={14} className="mr-2" />
                                            Indicadores de Inversión
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            {Object.entries(property.extended_data.investment).map(([key, value]) => (
                                                <div key={key} className="bg-muted/20 p-5 rounded-2xl border border-border/40 text-center">
                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mb-2">{key.replace(/_/g, ' ')}</p>
                                                    <p className="text-lg font-bold font-serif text-white">{String(value)}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {/* ========================================= */}
                    </div>

                    {/* Sidebar (Right Column) */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Pricing Card */}
                        <div className="bg-card border border-border/60 rounded-[2.5rem] p-10 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />

                            <div className="flex items-center justify-between mb-10">
                                <h3 className="flex items-center space-x-3 text-[10px] uppercase tracking-[0.2em] text-primary font-black">
                                    <Tag size={16} />
                                    <span>Información de Precio</span>
                                </h3>
                                {editingPriceId !== property.id ? (
                                    <button
                                        onClick={() => {
                                            setEditingPriceId(property.id);
                                            setPriceForm({
                                                price: Number(property.price) || 0,
                                                comision_tercero: Number(property.comision_tercero) || 2,
                                                comision_interna: Number(property.comision_interna) || 1,
                                            });
                                        }}
                                        className="p-2 rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all border border-transparent hover:border-primary/20"
                                        title="Editar precios"
                                    >
                                        <Edit2 size={15} />
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleUpdatePropertyPrice}
                                            className="px-4 py-1.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-primary/90 transition-all"
                                        >
                                            Guardar
                                        </button>
                                        <button
                                            onClick={() => setEditingPriceId(null)}
                                            className="px-4 py-1.5 bg-muted text-muted-foreground text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-muted/80 transition-all"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                )}
                            </div>

                            {editingPriceId === property.id ? (
                                /* ── EDIT MODE ── */
                                <div className="space-y-5">
                                    <div>
                                        <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mb-2 block">Precio Base (€)</label>
                                        <input
                                            type="number"
                                            value={priceForm.price || ""}
                                            placeholder="0"
                                            onFocus={(e) => e.target.select()}
                                            onChange={(e) => setPriceForm(f => ({ ...f, price: Number(e.target.value) }))}
                                            className="w-full bg-muted/50 border border-border rounded-2xl px-5 py-3 text-2xl font-serif font-medium focus:outline-none focus:border-primary/60 transition-all"
                                        />
                                        {priceForm.price > 0 && (
                                            <p className="text-[10px] text-primary font-bold mt-1.5 ml-1 animate-in fade-in slide-in-from-top-1">
                                                {priceForm.price.toLocaleString('es-ES')} €
                                            </p>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mb-2 block">Comisión Tercero (%)</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={priceForm.comision_tercero || ""}
                                                placeholder="0"
                                                onFocus={(e) => e.target.select()}
                                                onChange={(e) => setPriceForm(f => ({ ...f, comision_tercero: Number(e.target.value) }))}
                                                className="w-full bg-muted/50 border border-border rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-primary/60 transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mb-2 block">Comisión Alea (%)</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={priceForm.comision_interna || ""}
                                                placeholder="0"
                                                onFocus={(e) => e.target.select()}
                                                onChange={(e) => setPriceForm(f => ({ ...f, comision_interna: Number(e.target.value) }))}
                                                className="w-full bg-muted/50 border border-border rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-primary/60 transition-all"
                                            />
                                        </div>
                                    </div>
                                    {/* Live preview */}
                                    <div className="bg-muted/30 rounded-2xl p-5 border border-border/40 space-y-2 mt-2">
                                        <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-black mb-3">Preview en tiempo real</p>
                                        <div className="flex justify-between text-sm font-medium">
                                            <span className="text-muted-foreground">Precio base:</span>
                                            <span>€{priceForm.price.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-sm font-medium">
                                            <span className="text-muted-foreground">Com. tercero ({priceForm.comision_tercero}%):</span>
                                            <span>€{(priceForm.price * priceForm.comision_tercero / 100).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-sm font-medium">
                                            <span className="text-muted-foreground">Com. Alea ({priceForm.comision_interna}%):</span>
                                            <span>€{(priceForm.price * priceForm.comision_interna / 100).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-3 border-t border-border mt-2">
                                            <p className="text-[10px] uppercase tracking-widest text-primary font-black">Precio final:</p>
                                            <p className="text-xl font-serif font-bold text-emerald-600">€{(priceForm.price * (1 + priceForm.comision_tercero / 100 + priceForm.comision_interna / 100)).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* ── VIEW MODE ── */
                                <>
                                    <div className="mb-10">
                                        <div className="text-4xl md:text-5xl font-serif font-medium text-foreground mb-1 uppercase tracking-tighter">
                                            €{new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 }).format(property.price)}
                                        </div>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Precio base</p>
                                    </div>
                                    <div className="space-y-6 pt-8 border-t border-border/50">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-4">Desglose de Comisiones</p>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center text-sm font-medium">
                                                <span className="text-muted-foreground">Precio base:</span>
                                                <span className="text-foreground">€{new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 }).format(property.price)}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm font-medium">
                                                <span className="text-muted-foreground">Comisión tercero ({Number(property.comision_tercero) || 2}%):</span>
                                                <span className="text-foreground">€{(Number(property.price) * (Number(property.comision_tercero) || 2) / 100).toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm font-medium">
                                                <span className="text-muted-foreground">Comisión Alea ({Number(property.comision_interna) || 1}%):</span>
                                                <span className="text-foreground">€{(Number(property.price) * (Number(property.comision_interna) || 1) / 100).toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center pt-8 border-t border-border mt-8">
                                            <p className="text-[10px] uppercase tracking-widest text-primary font-black">Precio final:</p>
                                            <p className="text-2xl font-serif font-bold text-emerald-600">
                                                €{(Number(property.price) * (1 + (Number(property.comision_tercero) || 2) / 100 + (Number(property.comision_interna) || 1) / 100)).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Quick Characteristics Card */}
                        <div className="bg-card border border-border/60 rounded-[2.5rem] p-10 shadow-xl relative overflow-hidden">
                            <h3 className="flex items-center space-x-3 text-[10px] uppercase tracking-[0.2em] text-primary font-black mb-10">
                                <LayoutDashboard size={16} />
                                <span>Características</span>
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { icon: Building, label: "Superficie", value: `${property.meters || 0} m²` },
                                    { icon: Bed, label: "Habitaciones", value: property.rooms || 10 },
                                    { icon: Bath, label: "Baños", value: property.bathrooms || 12 },
                                    { icon: Sparkles, label: "Estado", value: property.status || "Excelente", tag: true }
                                ].map((item, i) => (
                                    <div key={i} className="p-6 bg-muted/20 border border-border/30 rounded-3xl flex flex-col items-center text-center group hover:bg-primary/5 transition-all">
                                        <item.icon className="text-primary/40 group-hover:text-primary transition-colors mb-4" size={24} />
                                        <p className="text-base font-bold font-serif mb-1 text-foreground">{item.value}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">{item.label}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-10 space-y-4 pt-10 border-t border-border/50">
                                {[
                                    { label: "Tipo:", value: property.type || "Local" },
                                    { label: "Condición:", value: "Excelente" },
                                    { label: "Piscina:", value: property.piscina ? "Sí" : "Sí" },
                                    { label: "Jardín:", value: property.jardin ? "Sí" : "Sí" },
                                    { label: "Amueblado:", value: property.amueblado ? "Sí" : "Sí" },
                                    { label: "Agente responsable:", value: property.agent_responsible || "Alberto BeeNoCode" }
                                ].map((row, i) => (
                                    <div key={i} className="flex justify-between text-xs font-medium">
                                        <span className="text-muted-foreground uppercase tracking-widest text-[9px] font-black">{row.label}</span>
                                        <span className="text-right font-black text-foreground">{row.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    };

    const renderLeadWorkplace = (lead: any) => {
        const leadInteractions = interactions.filter(i => i.leadId === lead.id);

        return (
            <motion.div
                key="lead-workplace"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="fixed inset-0 top-0 md:top-[110px] left-0 md:left-[256px] bg-background z-40 flex flex-col lg:flex-row overflow-hidden"
            >
                {/* Left Area: The "Sala" (Interaction Hub) - Expansive */}
                <div className="flex-1 flex flex-col border-r border-border/50 bg-muted/5 overflow-y-auto">
                    {/* Header of the Sala */}
                    <div className="p-8 border-b border-border/50 flex justify-between items-center bg-card/30 backdrop-blur-md">
                        <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 mb-1">
                                <h2 className="text-xl md:text-2xl font-serif font-medium truncate">{lead.investor}</h2>
                                <span className="inline-block mt-2 sm:mt-0 px-3 py-1 bg-primary/10 text-primary text-xs md:text-sm font-black uppercase tracking-[0.2em] rounded-full leading-none w-fit">
                                    {lead.status}
                                </span>
                            </div>
                            <p className="text-sm md:text-base text-muted-foreground uppercase tracking-widest font-bold truncate">Activo: {lead.property}</p>
                        </div>
                        <div className="flex items-center space-x-2 md:space-x-6">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs md:text-sm text-muted-foreground uppercase tracking-widest font-black mb-1">Score de Match IAI</p>
                                <div className="flex items-center space-x-2">
                                    <div className="w-16 md:w-24 bg-muted-foreground/10 h-1.5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${lead.matchScore}%` }}
                                            className="h-full bg-primary shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                                        />
                                    </div>
                                    <span className="text-xs md:text-sm font-serif text-primary italic">{lead.matchScore}%</span>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDeleteLead(lead.id)}
                                className="p-3 hover:bg-red-50 rounded-2xl transition-all border border-transparent hover:border-red-200 group"
                                title="Eliminar Ficha de Operativa"
                            >
                                <Trash2 size={20} className="text-muted-foreground group-hover:text-red-500 transition-colors" />
                            </button>
                            <button
                                onClick={() => setSelectedLead(null)}
                                className="p-3 hover:bg-muted rounded-2xl transition-all border border-transparent hover:border-border"
                            >
                                <Plus size={20} className="rotate-45 text-muted-foreground" />
                            </button>
                        </div>
                    </div>

                    {/* Content of the Sala */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-12">
                        {/* 0. Visual Funnel Architecture */}
                        <section className="space-y-6">
                            <h3 className="text-[14px] uppercase tracking-[0.3em] text-primary font-black flex items-center">
                                <Sparkles size={16} className="mr-2" />
                                Arquitectura de la Operación
                            </h3>

                            <div className="bg-card border border-border/50 rounded-[2.5rem] p-8 relative overflow-hidden">
                                {/* Level 1: The Asset */}
                                <div className="flex flex-col items-center mb-12 relative z-10">
                                    <div
                                        onClick={() => lead.properties && setSelectedProperty(lead.properties)}
                                        className="p-4 bg-primary/10 rounded-2xl border border-primary/20 flex items-center space-x-4 max-w-sm w-full shadow-sm cursor-pointer hover:bg-primary/20 transition-all group"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-muted overflow-hidden shrink-0">
                                            <img src={lead.properties?.images?.[0] || "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="text-[12px] text-primary font-black uppercase tracking-widest mb-1">Activo Principal</p>
                                            <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">{lead.properties?.title || lead.property}</p>
                                        </div>
                                    </div>
                                    <div className="w-px h-8 bg-gradient-to-b from-primary/30 to-border mt-2" />
                                </div>

                                {/* Level 2: Entities & Intermediary */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 items-center mb-12 relative z-10">
                                    {/* Comprador Side */}
                                    <div className="flex flex-col items-center space-y-4">
                                        <div className="w-full p-5 bg-muted/30 rounded-3xl border border-border/50 text-center relative group">
                                            <p className="text-xs text-muted-foreground font-black uppercase tracking-widest mb-2">Comprador</p>
                                            <p className="text-sm font-bold truncate">{lead.investors?.full_name || lead.investor}</p>

                                            <button
                                                onClick={() => handleUpdateLeadFunnel(lead.id, { is_buyer_mandatario: !lead.is_buyer_mandatario })}
                                                className={`mt-3 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all border ${lead.is_buyer_mandatario ? 'bg-amber-500 text-white border-amber-600' : 'bg-muted text-muted-foreground border-border'}`}
                                            >
                                                {lead.is_buyer_mandatario ? 'Gestionado por Mandatario' : 'Acceso Directo'}
                                            </button>

                                            {lead.is_buyer_mandatario && (
                                                <div className="mt-3">
                                                    <select
                                                        value={lead.buyer_mandatario_id || ""}
                                                        onChange={(e) => handleUpdateLeadFunnel(lead.id, { buyer_mandatario_id: e.target.value })}
                                                        className="w-full bg-muted/50 border border-amber-500/30 rounded-xl px-3 py-2 text-[11px] font-bold focus:outline-none focus:border-amber-500 transition-all text-center appearance-none"
                                                    >
                                                        <option value="">Seleccionar Mandatario</option>
                                                        {mandatarios.map((m: any) => (
                                                            <option key={m.id} value={m.id}>{m.full_name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center relative">
                                        <div className="absolute top-1/2 left-[-20%] right-[-20%] h-px bg-border -z-10" />
                                        <div className="w-16 h-16 bg-foreground text-background rounded-full flex items-center justify-center shadow-2xl border-4 border-background ring-4 ring-primary/20 transition-transform hover:scale-105">
                                            <Sparkles size={24} />
                                        </div>
                                        <div className="mt-3 text-center">
                                            <p className="text-sm font-black uppercase tracking-[0.2em] text-primary">Intermediario</p>
                                            <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Alea Signature</p>

                                            <div className="flex flex-col items-center space-y-1">
                                                <div className="flex items-center space-x-1 bg-card border border-border/50 rounded-lg px-2 py-0.5 shadow-sm">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        className="bg-transparent border-none w-12 text-xs font-black focus:outline-none text-right"
                                                        value={lead.alea_commission || 0}
                                                        onFocus={(e) => e.target.select()}
                                                        onChange={(e) => handleUpdateLeadFunnel(lead.id, { alea_commission: parseFloat(e.target.value) || 0 })}
                                                    />
                                                    <span className="text-[11px] font-black text-primary">%</span>
                                                </div>
                                                {lead.properties?.price && (
                                                    <p className="text-[11px] text-primary font-bold">
                                                        {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format((lead.properties.price * (lead.alea_commission || 0)) / 100)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Vendedor Side */}
                                    <div className="flex flex-col items-center space-y-4">
                                        <div className="w-full p-5 bg-muted/30 rounded-3xl border border-border/50 text-center relative group">
                                            <p className="text-xs text-muted-foreground font-black uppercase tracking-widest mb-2">Vendedor / Propiedad</p>
                                            <input
                                                type="text"
                                                placeholder="Nombre del Vendedor..."
                                                defaultValue={lead.seller_name || ""}
                                                onBlur={(e) => handleUpdateLeadFunnel(lead.id, { seller_name: e.target.value })}
                                                className="bg-transparent border-none text-sm font-bold text-center w-full focus:outline-none placeholder:text-muted-foreground/30"
                                            />

                                            <button
                                                onClick={() => handleUpdateLeadFunnel(lead.id, { is_seller_mandatario: !lead.is_seller_mandatario })}
                                                className={`mt-3 px-3 py-1 rounded-full text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all border ${lead.is_seller_mandatario ? 'bg-amber-500 text-white border-amber-600' : 'bg-muted text-muted-foreground border-border'}`}
                                            >
                                                {lead.is_seller_mandatario ? 'Gestionado por Mandatario' : 'Acceso Directo'}
                                            </button>

                                            {lead.is_seller_mandatario && (
                                                <div className="mt-3">
                                                    <select
                                                        value={lead.seller_mandatario_id || ""}
                                                        onChange={(e) => handleUpdateLeadFunnel(lead.id, { seller_mandatario_id: e.target.value })}
                                                        className="w-full bg-muted/50 border border-amber-500/30 rounded-xl px-3 py-1.5 text-[9px] font-bold focus:outline-none focus:border-amber-500 transition-all text-center appearance-none"
                                                    >
                                                        <option value="">Seleccionar Mandatario</option>
                                                        {mandatarios.map((m: any) => (
                                                            <option key={m.id} value={m.id}>{m.full_name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Level 3: Collaborators */}
                                <div className="flex flex-col items-center relative z-10">
                                    <div className="w-px h-8 bg-gradient-to-b from-border to-primary/30 mb-2" />
                                    <div className="w-full max-w-2xl bg-muted/20 border border-border/40 rounded-3xl p-8">
                                        <div className="flex justify-between items-center mb-6">
                                            <div>
                                                <p className="text-xs md:text-sm text-muted-foreground font-black uppercase tracking-widest">Colaboradores Externos</p>
                                                <p className="text-[10px] text-primary uppercase font-bold tracking-tighter">Gestión de Intermediarios y Comisiones</p>
                                            </div>

                                            <div className="relative group">
                                                <button className="p-2 bg-primary/10 hover:bg-primary/20 rounded-xl text-primary transition-all flex items-center space-x-2">
                                                    <Plus size={14} />
                                                    <span className="text-xs font-black uppercase tracking-widest">Añadir</span>
                                                </button>

                                                <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-2xl shadow-2xl p-4 hidden group-hover:block z-50">
                                                    <p className="text-[9px] font-black uppercase tracking-widest mb-3 text-muted-foreground">Seleccionar Colaborador</p>
                                                    <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                                                        {collaborators
                                                            .filter(c => !(lead.intermediaries || []).find((i: any) => i.id === c.id))
                                                            .map((c: any) => (
                                                                <button
                                                                    key={c.id}
                                                                    onClick={() => {
                                                                        const currentCols = lead.intermediaries || [];
                                                                        handleUpdateLeadFunnel(lead.id, {
                                                                            intermediaries: [...currentCols, {
                                                                                id: c.id,
                                                                                name: c.full_name,
                                                                                specialty: c.specialty,
                                                                                commission: 0
                                                                            }]
                                                                        });
                                                                    }}
                                                                    className="w-full text-left p-2 hover:bg-primary/5 rounded-lg transition-all"
                                                                >
                                                                    <p className="text-xs font-bold">{c.full_name}</p>
                                                                    <p className="text-[8px] text-primary uppercase font-black">{c.specialty}</p>
                                                                </button>
                                                            ))
                                                        }
                                                        {collaborators.length === 0 && (
                                                            <p className="text-[10px] text-muted-foreground italic p-2 text-center">No hay colaboradores registrados</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {(lead.intermediaries || []).map((col: any, idx: number) => (
                                                <div key={idx} className="p-4 bg-card border border-border/50 rounded-2xl flex items-center justify-between shadow-sm group">
                                                    <div className="flex items-center space-x-4">
                                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-[10px] font-black">
                                                            {col.name?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <span className="text-xs font-bold block">{col.name}</span>
                                                            <span className="text-[8px] text-muted-foreground uppercase font-black">{col.specialty}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center space-x-6">
                                                        <div className="text-right">
                                                            <div className="flex items-center space-x-2">
                                                                <span className="text-xs font-black uppercase text-muted-foreground">Fee:</span>
                                                                <div className="flex items-center bg-muted/50 border border-border/50 rounded-lg px-2 py-1">
                                                                    <input
                                                                        type="number"
                                                                        step="0.01"
                                                                        className="bg-transparent border-none w-14 text-xs font-black focus:outline-none text-right"
                                                                        value={col.commission || 0}
                                                                        onFocus={(e) => e.target.select()}
                                                                        onChange={(e) => {
                                                                            const newCols = [...lead.intermediaries];
                                                                            newCols[idx] = { ...col, commission: parseFloat(e.target.value) || 0 };
                                                                            handleUpdateLeadFunnel(lead.id, { intermediaries: newCols });
                                                                        }}
                                                                    />
                                                                    <span className="text-xs font-black text-primary ml-1">%</span>
                                                                </div>
                                                            </div>
                                                            {lead.properties?.price && (
                                                                <p className="text-[10px] text-primary font-bold mt-1">
                                                                    {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format((lead.properties.price * (col.commission || 0)) / 100)}
                                                                </p>
                                                            )}
                                                        </div>

                                                        <button
                                                            onClick={() => {
                                                                const newCols = [...lead.intermediaries];
                                                                newCols.splice(idx, 1);
                                                                handleUpdateLeadFunnel(lead.id, { intermediaries: newCols });
                                                            }}
                                                            className="p-2 text-muted-foreground hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            {(lead.intermediaries || []).length === 0 && (
                                                <div className="text-center py-6 border-2 border-dashed border-border/40 rounded-2xl flex flex-col items-center">
                                                    <Share2 size={24} className="text-muted-foreground/30 mb-2" />
                                                    <p className="text-[10px] text-muted-foreground/50 uppercase font-black tracking-widest italic">No hay colaboradores externos asignados</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Background Decorative Element */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-[80px]" />
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h3 className="text-[10px] uppercase tracking-[0.3em] text-primary font-black flex items-center">
                                <Activity size={14} className="mr-2" />
                                Centinela IAI — Predicciones Estratégicas
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Metric 1: Asset Score */}
                                <div className="p-6 bg-card border border-border/50 rounded-[2rem] relative overflow-hidden group">
                                    <div className="flex justify-between items-start mb-4">
                                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-black">Alea Intelligence del Activo</p>
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                            <Sparkles size={16} />
                                        </div>
                                    </div>
                                    <div className="flex items-baseline space-x-2">
                                        <p className="text-4xl font-serif font-medium text-primary">{lead.ai_asset_score || 85}</p>
                                        <p className="text-sm text-muted-foreground font-bold">/ 100</p>
                                    </div>
                                    <div className="mt-4 w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${lead.ai_asset_score || 85}%` }}
                                            className="h-full bg-primary"
                                        />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-3 font-medium">Viabilidad y calidad intrínseca de la propiedad operativa.</p>
                                </div>

                                {/* Metric 2: Closing Probability */}
                                <div className="p-6 bg-gradient-to-br from-primary/[0.05] to-transparent border border-primary/10 rounded-[2rem] relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <ArrowUpRight size={40} />
                                    </div>
                                    <p className="text-xs text-primary/60 uppercase tracking-widest font-black mb-4">Tasa de Cierre (Avance)</p>
                                    <div className="flex items-baseline space-x-2">
                                        <p className="text-4xl font-serif font-medium">{lead.ai_closing_probability || 65}%</p>
                                    </div>
                                    <div className="mt-4 w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${lead.ai_closing_probability || 65}%` }}
                                            className="h-full bg-emerald-500"
                                        />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-3 font-medium">Probabilidad de éxito basada en el progreso de la operación.</p>
                                </div>

                                {/* Combined: Insights & Next Action */}
                                <div className="p-6 bg-card border border-border/50 rounded-[2rem] flex flex-col justify-between">
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-black mb-3">Insights de Operación</p>
                                        <div className="space-y-2">
                                            <div className="flex items-start space-x-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                                                <p className="text-xs"><span className="font-bold">Riesgo:</span> Dilatación en Due Diligence (Bajo)</p>
                                            </div>
                                            <div className="flex items-start space-x-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                                <p className="text-xs"><span className="font-bold">Siguiente:</span> Enviar Dossier Técnico Actualizado</p>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="mt-4 w-full py-2.5 bg-primary/10 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all">
                                        Ejecutar Acción Sugerida
                                    </button>
                                </div>
                            </div>
                        </section>

                        {/* 2. Main Timeline (Emails, Notes, Milestones) */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            <section className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-black flex items-center">
                                        <Mail size={14} className="mr-2" />
                                        Canal de Comunicación y Notas
                                    </h3>
                                    <div className="flex space-x-2">
                                        <button className="px-3 py-1 bg-muted rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all">Nota</button>
                                        <button className="px-3 py-1 bg-muted rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all">Email</button>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {leadInteractions.map((interaction) => (
                                        <div key={interaction.id} className="group relative pl-8 border-l border-primary/10">
                                            <div className="absolute left-[-4px] top-0 w-2 h-2 rounded-full bg-primary/30 group-hover:bg-primary transition-colors" />
                                            <div className="bg-card border border-border/40 p-6 rounded-3xl group-hover:border-primary/20 transition-all shadow-sm">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-primary bg-primary/5 px-2 py-0.5 rounded-lg border border-primary/10">
                                                            {interaction.type}
                                                        </span>
                                                        <span className="ml-3 text-[9px] text-muted-foreground font-black uppercase tracking-widest">{interaction.date}</span>
                                                    </div>
                                                </div>
                                                <p className="text-sm leading-relaxed text-foreground/80">{interaction.content}</p>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Placeholder for Future Email Integration */}
                                    <div className="p-8 border-2 border-dashed border-border/40 rounded-[2.5rem] flex flex-col items-center justify-center text-center bg-muted/5 opacity-40">
                                        <Mail size={32} className="text-muted-foreground mb-4" />
                                        <p className="text-[10px] uppercase tracking-[0.3em] font-black text-muted-foreground">Sincronización de Email</p>
                                        <p className="text-[9px] text-muted-foreground/60 mt-1">Conecta Office365 / Gmail para volcar hilos de conversación</p>
                                    </div>
                                </div>
                            </section>

                            {/* Avances & Nuevas Situaciones */}
                            <section className="space-y-6">
                                <h3 className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-black flex items-center">
                                    <Clock size={14} className="mr-2" />
                                    Hitos de Maduración
                                </h3>
                                <div className="space-y-4">
                                    <div className="p-6 bg-card border border-border/60 rounded-3xl border-l-4 border-l-emerald-500">
                                        <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mb-1">Hito Completado</p>
                                        <p className="text-sm font-bold">Validación de Fondos Certificada</p>
                                        <p className="text-[10px] text-muted-foreground mt-2">Documentación KYC procesada correctamente.</p>
                                    </div>
                                    <div className="p-6 bg-card border border-border/60 rounded-3xl border-l-4 border-l-amber-500">
                                        <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest mb-1">Situación Pendiente</p>
                                        <p className="text-sm font-bold">Confirmación de Cita con Arquitecto</p>
                                        <p className="text-[10px] text-muted-foreground mt-2">Esperando respuesta del equipo de property management.</p>
                                    </div>
                                    {/* Feature expansion placeholder */}
                                    <div className="pt-8 border-t border-border/50">
                                        <p className="text-[9px] text-muted-foreground/40 italic uppercase tracking-[0.2em] font-bold">Módulo de Seguimiento Dinámico v2.0</p>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>

                {/* Right Area: Investor Details & KYC - Compact Sidebar */}
                <div className="w-full lg:w-[380px] flex flex-col bg-card/50 backdrop-blur-xl shrink-0 overflow-y-auto border-t lg:border-t-0 lg:border-l border-border/50">
                    <div className="p-8 space-y-10">
                        <div className="text-center">
                            <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center text-3xl font-serif text-primary mx-auto mb-6 border border-primary/20">
                                {lead.investor?.charAt(0) || 'I'}
                            </div>
                            <h3 className="text-xl font-serif font-medium leading-none mb-2">{lead.investor}</h3>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">{lead.type}</p>
                        </div>

                        {/* Essential Info */}
                        <div className="space-y-6">
                            <div className="p-5 bg-muted/30 rounded-[2rem] border border-border/50">
                                <h4 className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-black mb-4">Información Principal</h4>
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-3 text-sm">
                                        <Mail size={16} className="text-primary/40 shrink-0" />
                                        <span className="truncate">{lead.email}</span>
                                    </div>
                                    <div className="flex items-center space-x-3 text-sm">
                                        <Activity size={16} className="text-primary/40 shrink-0" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Estado KYC: Verificado</span>
                                    </div>
                                    <div className="flex items-center space-x-3 text-sm pt-2 border-t border-border/30">
                                        <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center text-[9px] text-primary font-bold">
                                            {lead.agent?.charAt(0)}
                                        </div>
                                        <span className="text-xs font-medium text-muted-foreground">Responsable: {lead.agent}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-5 bg-muted/30 rounded-[2rem] border border-border/50">
                                <h4 className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-black mb-4">Capacidad de Inversión</h4>
                                <div className="space-y-2">
                                    <p className="text-2xl font-serif text-primary">{lead.ticket}</p>
                                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-medium">Liquidez Nominal Detectada</p>
                                </div>
                            </div>
                        </div>

                        {/* Documents */}
                        <div className="space-y-4">
                            <h4 className="text-[9px] uppercase tracking-[0.3em] text-primary font-black ml-1">Documentación Crítica</h4>
                            <div className="space-y-2">
                                <div className="p-4 bg-muted/20 border border-border/40 rounded-2xl flex items-center justify-between group hover:bg-muted/50 transition-all cursor-pointer">
                                    <div className="flex items-center space-x-3">
                                        <FileText size={16} className="text-primary/60" />
                                        <span className="text-[10px] font-black uppercase tracking-wider">Ejecución de NDA</span>
                                    </div>
                                    <Download size={14} className="text-muted-foreground" />
                                </div>
                                <div className="p-4 bg-muted/20 border border-border/40 rounded-2xl flex items-center justify-between group hover:bg-muted/50 transition-all cursor-pointer">
                                    <div className="flex items-center space-x-3">
                                        <Users size={16} className="text-primary/60" />
                                        <span className="text-[10px] font-black uppercase tracking-wider">Declaración UBO</span>
                                    </div>
                                    <Download size={14} className="text-muted-foreground" />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6">
                            <button
                                onClick={() => { setSelectedInvestor(lead); setSelectedLead(null); }}
                                className="w-full py-4 bg-foreground text-background rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] hover:scale-[1.02] transition-all"
                            >
                                Perfil Completo Maestro
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    };

    const pipelineData = useMemo(() => {
        const columns: Record<string, any[]> = {};
        PIPELINE_STAGES.forEach(stage => columns[stage.id] = []);
        leads.forEach(lead => {
            const stageId = VALID_STAGES.has(lead.status) ? lead.status : "prospect";
            if (columns[stageId]) columns[stageId].push(lead);
        });
        return columns;
    }, [leads]);

    const intelligenceMetrics = useMemo(() => {
        let totalValue = 0;
        let totalStrategicValue = 0;

        leads.forEach(lead => {
            const price = lead.properties?.price || 0;
            const exclusivity = 0.15; // default E
            const access = 0.10; // default A

            totalValue += price;
            totalStrategicValue += price * (1 + exclusivity + access);
        });

        return {
            totalPipelineValue: totalValue,
            totalStrategicValue: totalStrategicValue,
            strategicAlpha: totalStrategicValue - totalValue,
            activeCount: leads.length
        };
    }, [leads]);

    return (
        <div className="flex h-screen bg-muted/10 selection:bg-primary/30">

            {/* Admin Sidebar */}
            <aside className="w-64 bg-background/60 backdrop-blur-3xl border-r border-white/5 flex flex-col hidden md:flex shrink-0 z-20 shadow-xl">
                <div className="p-6 border-b border-border">
                    <span className="font-serif text-2xl tracking-widest font-medium">Praetorium.</span>
                    <span className="block text-xs text-muted-foreground uppercase tracking-widest mt-1 font-semibold">Panel de Control</span>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <button
                        onClick={() => { setActiveTab("crm"); setSelectedInvestor(null); setSelectedLead(null); }}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${activeTab === "crm" ? 'bg-primary/10 text-primary font-medium shadow-sm' : 'text-foreground/70 hover:bg-muted'}`}
                    >
                        <div className="flex items-center space-x-3">
                            <LayoutDashboard size={18} />
                            <span>Operaciones Activas</span>
                        </div>
                    </button>

                    <button
                        onClick={() => { setActiveTab("investors"); setSelectedInvestor(null); setSelectedLead(null); }}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === "investors" ? 'bg-primary/10 text-primary font-medium shadow-sm' : 'text-foreground/70 hover:bg-muted'}`}
                    >
                        <Users size={18} />
                        <span>Inversores (KYC)</span>
                    </button>

                    <button
                        onClick={() => { setActiveTab("mandatarios"); setSelectedInvestor(null); setSelectedLead(null); }}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === "mandatarios" ? 'bg-primary/10 text-primary font-medium shadow-sm' : 'text-foreground/70 hover:bg-muted'}`}
                    >
                        <ShieldCheck size={18} />
                        <span>Mandatarios</span>
                    </button>

                    <button
                        onClick={() => { setActiveTab("collaborators"); setSelectedInvestor(null); setSelectedLead(null); }}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === "collaborators" ? 'bg-primary/10 text-primary font-medium shadow-sm' : 'text-foreground/70 hover:bg-muted'}`}
                    >
                        <Share2 size={18} />
                        <span>Colaboradores</span>
                    </button>

                    <button
                        onClick={() => { setActiveTab("templates"); setSelectedInvestor(null); setSelectedLead(null); }}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === "templates" ? 'bg-primary/10 text-primary font-medium shadow-sm' : 'text-foreground/70 hover:bg-muted'}`}
                    >
                        <FileText size={18} />
                        <span>Plantillas</span>
                    </button>

                    <button
                        onClick={() => { setActiveTab("nda"); setSelectedInvestor(null); setSelectedLead(null); }}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === "nda" ? 'bg-primary/10 text-primary font-medium shadow-sm' : 'text-foreground/70 hover:bg-muted'}`}
                    >
                        <ShieldCheck size={18} />
                        <span>Acuerdos NDA</span>
                    </button>

                    <button
                        onClick={() => { setActiveTab("assets"); setSelectedInvestor(null); setSelectedLead(null); }}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === "assets" ? 'bg-primary/10 text-primary font-medium shadow-sm' : 'text-foreground/70 hover:bg-muted'}`}
                    >
                        <Building size={18} />
                        <span>Activos</span>
                    </button>

                </nav>

                <div className="p-4 border-t border-border bg-muted/5 space-y-3">
                    <Link href="/" className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center uppercase tracking-widest font-bold">
                        <ArrowUpRight size={12} className="mr-2" /> Ver Sitio Web
                    </Link>
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => { setActiveTab("profile"); setSelectedInvestor(null); setSelectedLead(null); }}
                            className={`flex items-center space-x-2 px-3 py-2 rounded-xl transition-all flex-1 mr-2 text-[10px] font-bold uppercase tracking-widest ${activeTab === "profile" ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                        >
                            <User size={14} />
                            <span className="truncate">{currentUser?.full_name?.split(' ')[0] || 'Mi Perfil'}</span>
                        </button>
                        <button
                            onClick={handleLogout}
                            title="Cerrar Sesión"
                            className="p-2 rounded-xl text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-all shrink-0"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] md:hidden"
                        />
                        <motion.aside
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 left-0 w-72 bg-background/60 backdrop-blur-3xl z-[101] shadow-2xl flex flex-col md:hidden border-r border-white/10"
                        >
                            <div className="p-6 border-b border-border flex justify-between items-center">
                                <div>
                                    <span className="font-serif text-2xl tracking-widest font-medium">Praetorium.</span>
                                    <span className="block text-xs text-muted-foreground uppercase tracking-widest mt-1 font-semibold">Panel de Control</span>
                                </div>
                                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-muted rounded-xl">
                                    <X size={20} />
                                </button>
                            </div>

                            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                                {[
                                    { id: "crm", label: "Operaciones Activas", icon: LayoutDashboard },
                                    { id: "investors", label: "Inversores (KYC)", icon: Users },
                                    { id: "mandatarios", label: "Mandatarios", icon: ShieldCheck },
                                    { id: "collaborators", label: "Colaboradores", icon: Share2 },
                                    { id: "templates", label: "Plantillas", icon: FileText },
                                    { id: "assets", label: "Activos", icon: Building },
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            setActiveTab(item.id);
                                            setSelectedInvestor(null);
                                            setSelectedLead(null);
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-primary/10 text-primary font-medium shadow-sm' : 'text-foreground/70 hover:bg-muted'}`}
                                    >
                                        <item.icon size={18} />
                                        <span>{item.label}</span>
                                    </button>
                                ))}
                            </nav>

                            <div className="p-4 border-t border-border bg-muted/5 space-y-3">
                                <Link href="/" className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center uppercase tracking-widest font-bold">
                                    <ArrowUpRight size={12} className="mr-2" /> Ver Sitio Web
                                </Link>
                                <div className="flex items-center justify-between">
                                    <button
                                        onClick={() => { setActiveTab("profile"); setSelectedInvestor(null); setIsMobileMenuOpen(false); }}
                                        className={`flex items-center space-x-2 px-3 py-2 rounded-xl transition-all flex-1 mr-2 text-[10px] font-bold uppercase tracking-widest ${activeTab === "profile" ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                                    >
                                        <User size={14} />
                                        <span className="truncate">{currentUser?.full_name?.split(' ')[0] || 'Mi Perfil'}</span>
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className="p-2 rounded-xl text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-all shrink-0"
                                    >
                                        <LogOut size={16} />
                                    </button>
                                </div>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content Area */}
            <main className="flex-1 overflow-hidden flex flex-col relative">

                <header className="px-4 py-6 md:p-8 md:pb-4 flex justify-between items-center bg-background/40 backdrop-blur-md z-10 border-b border-white/5 sticky top-0">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="p-2 bg-muted rounded-xl md:hidden text-foreground hover:bg-primary/10 transition-colors"
                        >
                            <Menu size={20} />
                        </button>
<div>
                            <h1 className="font-serif text-xl md:text-3xl font-medium tracking-tight">
                                {activeTab === 'crm' ? 'Operaciones Activas' :
                                    activeTab === 'investors' ? 'Directorio de Inversores' :
                                        activeTab === 'mandatarios' ? 'Directorio de Mandatarios' :
                                            activeTab === 'collaborators' ? 'Colaboradores' :
                                                activeTab === 'templates' ? 'Document Factory' :
                                                    activeTab === 'assets' ? 'Asset Portfolio' :
                                                        activeTab === 'profile' ? 'Perfil de Usuario' : 'Praetorium'}
                            </h1>
                            <div className="flex items-center space-x-2 mt-1 hidden sm:flex">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                    {selectedInvestor ? `Cualificación: ${selectedInvestor.investor}` : 'Estado real de las operaciones activas.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3 md:space-x-4">
                        <Link
                            href="/centurion"
                            className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-amber-500/10 text-amber-500 rounded-full hover:bg-amber-500/20 transition-all border border-amber-500/20"
                        >
                            <Shield size={16} />
                            <span className="text-xs font-bold uppercase tracking-wider">Centurión</span>
                        </Link>
                        <div className="bg-card border border-border px-4 py-2 rounded-full hidden sm:flex items-center space-x-2 focus-within:border-primary/50 transition-all shadow-sm">
                            <Search size={16} className="text-muted-foreground" />
                            <input type="text" placeholder="Buscar..." className="bg-transparent border-none focus:outline-none text-sm w-24 md:w-48" />
                        </div>
                        <button className="sm:hidden p-2 text-muted-foreground hover:text-primary transition-colors">
                            <Search size={20} />
                        </button>
                        <button
                            onClick={() => {
                                setStepInGlobalLead(1);
                                setIsCreatingGlobalLead(true);
                            }}
                            className="p-2 bg-primary text-white rounded-full hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                        >
                            <Plus size={20} />
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-x-auto p-8 pt-6 relative">
                    <AnimatePresence>
                        {showToast && (
                            <motion.div
                                initial={{ opacity: 0, y: 50, scale: 0.9, filter: 'blur(10px)' }}
                                animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                                exit={{ opacity: 0, scale: 0.9, y: 20, filter: 'blur(10px)' }}
                                className={`fixed bottom-8 right-8 ${toast.type === 'error' ? 'bg-red-500/90 text-white' : 'bg-foreground/90 text-background'} backdrop-blur-xl px-6 py-4 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-[100] flex items-center space-x-4 font-bold border border-white/10 min-w-[320px]`}
                            >
                                <div className={`w-10 h-10 rounded-2xl ${toast.type === 'error' ? 'bg-white/20' : 'bg-primary/20'} flex items-center justify-center`}>
                                    {toast.type === 'error' ? <ShieldAlert size={20} className="text-white" /> : <Sparkles size={20} className="text-primary" />}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase tracking-widest opacity-60 font-black">{toast.type === 'error' ? 'Critical Alert' : 'System Intelligence'}</span>
                                    <span className="text-sm tracking-tight">{toast.message || "Operación completada en Supabase"}</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {selectedInvestor ? (
                        renderInvestorProfile(selectedInvestor)
                    ) : (
                        <div className="h-full flex relative px-8 pt-6">
                            <div className={`flex-1 overflow-x-auto pb-8 transition-all duration-500 ${selectedLead ? 'mr-96' : ''} relative`}>
                                {/* Subliminal Background Glows (Phase 1 Visuals) */}
                                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
                                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

                                {activeTab === "crm" && (
                                    <CRMPipeline
                                        pipelineData={pipelineData}
                                        draggingId={draggingId}
                                        selectedLead={selectedLead}
                                        onDragStart={handleDragStart}
                                        onDragEnd={handleDragEnd}
                                        onSelectLead={setSelectedLead}
                                        columnRefs={columnRefs}
                                    />
                                )}

                                {activeTab === "iai_inbox" && (
                                    <div className="flex flex-col space-y-8 animate-in fade-in duration-700 p-8">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h2 className="text-2xl font-serif font-bold">Bandeja IAI</h2>
                                                <p className="text-muted-foreground text-sm">Emails analizados por Inteligencia Artificial</p>
                                            </div>
                                        </div>

                                        {/* KPIs */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="bg-card border border-border rounded-2xl p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Inbox size={16} className="text-muted-foreground" />
                                                    <span className="text-xs text-muted-foreground">Total</span>
                                                </div>
                                                <p className="text-3xl font-bold">{iaiSuggestions.length}</p>
                                            </div>
                                            <div className="bg-card border border-border rounded-2xl p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Clock size={16} className="text-amber-500" />
                                                    <span className="text-xs text-muted-foreground">Pendientes</span>
                                                </div>
                                                <p className="text-3xl font-bold text-amber-500">{iaiSuggestions.filter(s => s.status === 'pending').length}</p>
                                            </div>
                                            <div className="bg-card border border-border rounded-2xl p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <CheckCircle size={16} className="text-emerald-500" />
                                                    <span className="text-xs text-muted-foreground">Aprobados</span>
                                                </div>
                                                <p className="text-3xl font-bold text-emerald-500">{iaiSuggestions.filter(s => s.status === 'approved').length}</p>
                                            </div>
                                            <div className="bg-card border border-border rounded-2xl p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Building size={16} className="text-blue-500" />
                                                    <span className="text-xs text-muted-foreground">Properties</span>
                                                </div>
                                                <p className="text-3xl font-bold text-blue-500">{iaiSuggestions.filter(s => s.suggestion_type === 'property').length}</p>
                                            </div>
                                        </div>

                                        {/* Filters */}
                                        <div className="flex flex-wrap gap-4">
                                            <select
                                                value={iaiFilter}
                                                onChange={(e) => setIaiFilter(e.target.value as any)}
                                                className="bg-card border border-border rounded-xl px-4 py-2 text-sm"
                                            >
                                                <option value="all">Todos los estados</option>
                                                <option value="pending">Pendientes</option>
                                                <option value="approved">Aprobados</option>
                                                <option value="rejected">Rechazados</option>
                                            </select>
                                            <select
                                                value={iaiTypeFilter}
                                                onChange={(e) => setIaiTypeFilter(e.target.value as any)}
                                                className="bg-card border border-border rounded-xl px-4 py-2 text-sm"
                                            >
                                                <option value="all">Todos los tipos</option>
                                                <option value="property">Propiedades</option>
                                                <option value="investor">Inversores</option>
                                                <option value="lead">Leads</option>
                                                <option value="mandatario">Mandatarios</option>
                                            </select>
                                        </div>
                                        
                                        {iaiSuggestions.filter(s => {
                                            const statusMatch = iaiFilter === 'all' || s.status === iaiFilter;
                                            const typeMatch = iaiTypeFilter === 'all' || s.suggestion_type === iaiTypeFilter;
                                            return statusMatch && typeMatch;
                                        }).length === 0 ? (
                                            <div className="bg-card/40 backdrop-blur-sm border border-white/5 p-12 rounded-[3rem] shadow-sm flex items-center justify-center min-h-[300px]">
                                                <div className="text-center">
                                                    <Inbox size={48} className="mx-auto text-muted-foreground mb-4" />
                                                    <h3 className="text-xl font-serif font-bold text-foreground/80 mb-2">No hay emails</h3>
                                                    <p className="text-muted-foreground">Los nuevos emails aparecerán aquí para revisión.</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="grid gap-4">
                                                {iaiSuggestions.filter(s => {
                                                    const statusMatch = iaiFilter === 'all' || s.status === iaiFilter;
                                                    const typeMatch = iaiTypeFilter === 'all' || s.suggestion_type === iaiTypeFilter;
                                                    return statusMatch && typeMatch;
                                                }).map((suggestion: any) => (
                                                    <div 
                                                        key={suggestion.id}
                                                        className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-all"
                                                    >
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div className="flex-1 cursor-pointer" onClick={() => {
                                                                setSelectedSuggestion(suggestion);
                                                                handleViewEmail(suggestion);
                                                            }}>
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                                                                        suggestion.suggestion_type === 'property' ? 'bg-emerald-500/20 text-emerald-400' :
                                                                        suggestion.suggestion_type === 'investor' ? 'bg-blue-500/20 text-blue-400' :
                                                                        'bg-purple-500/20 text-purple-400'
                                                                    }`}>
                                                                        {suggestion.suggestion_type}
                                                                    </span>
                                                                    <span className={`text-[10px] px-2 py-1 rounded-full ${
                                                                        suggestion.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                                                                        suggestion.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                                                                        'bg-red-500/20 text-red-400'
                                                                    }`}>
                                                                        {suggestion.status}
                                                                    </span>
                                                                </div>
                                                                <h4 className="font-medium">{suggestion.original_email_subject}</h4>
                                                                <p className="text-sm text-muted-foreground">{suggestion.sender_email}</p>
                                                            </div>
                                                            <div className="flex flex-col items-end gap-2">
                                                                <span className="text-xs text-muted-foreground">
                                                                    {new Date(suggestion.created_at).toLocaleDateString('es-ES')}
                                                                </span>
                                                                {suggestion.status === 'pending' && (
                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleApproveSuggestion(suggestion);
                                                                            }}
                                                                            className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-xs flex items-center gap-1 hover:bg-emerald-600"
                                                                        >
                                                                            <Check size={12} /> Aprobar
                                                                        </button>
                                                                        <button
                                                                            onClick={async (e) => {
                                                                                e.stopPropagation();
                                                                                await insforge.database.from('iai_inbox_suggestions').update({ status: 'rejected' }).eq('id', suggestion.id);
                                                                                setIaiSuggestions(prev => prev.map(s => s.id === suggestion.id ? { ...s, status: 'rejected' } : s));
                                                                            }}
                                                                            className="px-3 py-1 bg-red-500 text-white rounded-lg text-xs flex items-center gap-1 hover:bg-red-600"
                                                                        >
                                                                            <X size={12} /> Rechazar
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="text-sm text-muted-foreground line-clamp-2">
                                                            {suggestion.extracted_data?._iai_summary || suggestion.ai_interpretation?.substring(0, 150)}
                                                        </div>
                                                        {suggestion.extracted_data?.attachments?.length > 0 && (
                                                            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                                                                <Paperclip size={12} />
                                                                {suggestion.extracted_data.attachments.length} adjunto(s)
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === "investors" && (
                                    <InvestorDirectory
                                        investors={investors}
                                        onAddInvestor={() => setIsAddingInvestor(true)}
                                        onEditInvestor={(inv) => setSelectedInvestorToEdit(inv)}
                                        onSelectInvestor={(inv) => setSelectedInvestor(inv)}
                                    />
                                )}

                                {activeTab === "nda" && (
                                    <div className="max-w-4xl mx-auto w-full space-y-6 mt-10 pb-20">
                                        <NDAForm />
                                    </div>
                                )}

                                {activeTab === "assets" && (
                                    <AssetPortfolio
                                        properties={properties}
                                        onSelectProperty={setSelectedProperty}
                                        isUploadingPdf={isUploadingPdf}
                                        onUploadPdf={handleUploadPdf}
                                    />
                                )}
                                {activeTab === "profile" && (
                                    <div className="max-w-4xl mx-auto w-full mt-10 pb-20">
                                        <div className="bg-card border border-border rounded-[3rem] shadow-xl overflow-hidden">
                                            <div className="relative h-32 bg-gradient-to-r from-primary/20 to-primary/5">
                                                <div className="absolute -bottom-12 left-10">
                                                    <div className="w-24 h-24 rounded-[2rem] bg-card border-4 border-background flex items-center justify-center text-4xl font-serif text-primary shadow-xl">
                                                        {currentUser?.full_name?.charAt(0) || 'U'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="pt-16 p-10">
                                                <div className="flex justify-between items-start mb-10">
                                                    <div>
                                                        <h2 className="text-3xl font-serif font-medium">{currentUser?.full_name}</h2>
                                                        <p className="text-muted-foreground uppercase tracking-[0.2em] text-[10px] font-black mt-2">{currentUser?.role || 'Agent'}</p>
                                                    </div>
                                                    <button className="px-6 py-2 bg-muted/50 hover:bg-muted rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Editar Perfil</button>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    <div className="space-y-6">
                                                        <div className="p-6 bg-muted/10 border border-border/50 rounded-3xl">
                                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary mb-4 flex items-center">
                                                                <Mail size={14} className="mr-2" /> Información de ContactO
                                                            </h3>
                                                            <div className="space-y-4">
                                                                <div>
                                                                    <label className="text-[8px] uppercase tracking-widest text-muted-foreground font-bold">Email Corporativo</label>
                                                                    <p className="text-sm font-medium mt-1">{currentUser?.email}</p>
                                                                </div>
                                                                <div>
                                                                    <label className="text-[8px] uppercase tracking-widest text-muted-foreground font-bold">Fecha de Ingreso</label>
                                                                    <p className="text-sm font-medium mt-1">{currentUser?.created_at ? new Date(currentUser.created_at).toLocaleDateString() : 'N/A'}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-6">
                                                        <div className="p-6 bg-muted/10 border border-border/50 rounded-3xl">
                                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary mb-4 flex items-center">
                                                                <ShieldCheck size={14} className="mr-2" /> Seguridad y Acceso
                                                            </h3>
                                                            <div className="space-y-4">
                                                                <div>
                                                                    <label className="text-[8px] uppercase tracking-widest text-muted-foreground font-bold">Estado de Cuenta</label>
                                                                    <div className="flex items-center mt-1 text-emerald-500">
                                                                        <CheckCircle2 size={14} className="mr-2" />
                                                                        <span className="text-sm font-bold uppercase tracking-widest text-[10px]">Verificado y Activo</span>
                                                                    </div>
                                                                </div>
                                                                <button className="w-full py-3 border border-border/50 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-muted/50 transition-all flex items-center justify-center">
                                                                    Cambiar Contraseña
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <AnimatePresence>
                    {selectedLead && renderLeadWorkplace(selectedLead)}
                    {selectedProperty && (
                        <div key="property-modal" className="fixed inset-0 z-[60] bg-background overscroll-none overflow-y-auto">
                            {renderPropertyDetail(selectedProperty)}
                        </div>
                    )}

                    {/* Edit Agent Modal */}
                    {selectedAgentToEdit && (
                        <EditAgentModal
                            agent={selectedAgentToEdit}
                            onClose={() => setSelectedAgentToEdit(null)}
                            onUpdate={(agent) => handleUpdateAgent(agent)}
                        />
                    )}

                    {/* Add Agent Modal */}
                    {isAddingAgent && (
                        <AddAgentModal
                            form={agentForm}
                            onClose={() => setIsAddingAgent(false)}
                            onChange={(form) => setAgentForm(form)}
                            onSubmit={handleCreateAgent}
                        />
                    )}

                    {/* Edit Investor Modal */}
                    <EditInvestorModal
                        investor={selectedInvestorToEdit}
                        onClose={() => setSelectedInvestorToEdit(null)}
                        onChange={setSelectedInvestorToEdit}
                        onSave={handleUpdateInvestor}
                    />
                    {/* Add Property Suggestion Modal */}
                    <AddPropertySuggestionModal
                        isOpen={isReviewingPropertySuggestion}
                        form={propertyForm}
                        onClose={() => setIsReviewingPropertySuggestion(false)}
                        onChange={setPropertyForm}
                        onSave={handleSubmitPropertySuggestion}
                    />
                    {/* Add Investor Modal */}
                    <AddInvestorModal
                        isOpen={isAddingInvestor}
                        onClose={() => setIsAddingInvestor(false)}
                        form={investorForm}
                        onChange={setInvestorForm}
                        onSubmit={handleCreateInvestor}
                    />

                    {/* Add/Edit Mandatario Modal */}
                    <MandatarioFormModal
                        isOpen={isAddingMandatario || !!selectedMandatarioToEdit}
                        editingMandatario={selectedMandatarioToEdit}
                        form={mandatarioForm}
                        onClose={() => {
                            setIsAddingMandatario(false);
                            setSelectedMandatarioToEdit(null);
                            setMandatarioForm({ full_name: '', company_name: '', email: '', phone: '', mandatario_type: '', labels: [] });
                        }}
                        onChange={setMandatarioForm}
                        onSave={(form) => {
                            if (selectedMandatarioToEdit) {
                                handleUpdateMandatario({ ...form, id: selectedMandatarioToEdit.id });
                            } else {
                                setMandatarioForm(form);
                                handleCreateMandatario();
                            }
                        }}
                        onReset={() => {
                            setIsAddingMandatario(false);
                            setSelectedMandatarioToEdit(null);
                            setMandatarioForm({ full_name: '', company_name: '', email: '', phone: '', mandatario_type: '', labels: [] });
                        }}
                    />

                    {/* Add/Edit Collaborator Modal */}
                    <CollaboratorFormModal
                        isOpen={isAddingCollaborator || !!editingCollaborator}
                        editingCollaborator={editingCollaborator}
                        form={collaboratorForm}
                        onClose={() => {
                            setIsAddingCollaborator(false);
                            setEditingCollaborator(null);
                            setCollaboratorForm({ full_name: '', company_name: '', email: '', phone: '', specialty: '' });
                        }}
                        onChange={setCollaboratorForm}
                        onSave={() => {
                            if (editingCollaborator) {
                                handleUpdateCollaborator();
                            } else {
                                handleCreateCollaborator();
                            }
                        }}
                        onReset={() => {
                            setIsAddingCollaborator(false);
                            setEditingCollaborator(null);
                            setCollaboratorForm({ full_name: '', company_name: '', email: '', phone: '', specialty: '' });
                        }}
                    />

                    {/* Select Investor for Opportunity Modal */}
                    <InvestorSelectorModal
                        isOpen={isSelectingInvestorForLead}
                        investors={investors}
                        search={investorAssignSearch}
                        onSearchChange={setInvestorAssignSearch}
                        onSelect={(investorId) => {
                            handleCreateLead(investorId, targetPropertyForLead?.id);
                            setInvestorAssignSearch("");
                        }}
                        onClose={() => setIsSelectingInvestorForLead(false)}
                        targetPropertyId={targetPropertyForLead?.id}
                    />
                    {/* Global Opportunity Creation Modal */}
                    <GlobalLeadCreationModal
                        isOpen={isCreatingGlobalLead}
                        step={stepInGlobalLead}
                        assetSearch={assetSearch}
                        investorSearch={investorAssignSearch}
                        properties={properties}
                        investors={investors}
                        targetProperty={targetPropertyForLead}
                        onAssetSearchChange={setAssetSearch}
                        onInvestorSearchChange={setInvestorAssignSearch}
                        onSelectAsset={(p) => {
                            setTargetPropertyForLead(p);
                            setStepInGlobalLead(2);
                        }}
                        onSelectInvestor={(investorId, propertyId) => {
                            if (propertyId) {
                                handleCreateLead(investorId, propertyId);
                            }
                            setIsCreatingGlobalLead(false);
                            setAssetSearch("");
                            setInvestorAssignSearch("");
                        }}
                        onStepChange={setStepInGlobalLead}
                        onClose={() => {
                            setIsCreatingGlobalLead(false);
                            setAssetSearch("");
                            setInvestorAssignSearch("");
                        }}
                    />
                </AnimatePresence>

                {/* AI Email Interpretation Modal */}
                <EmailInterpretationPanel
                    isOpen={showEmailModal}
                    suggestion={activeEmailSuggestion}
                    interpretation={emailInterpretation}
                    isLoading={isLoadingInterpretation}
                    onClose={() => setShowEmailModal(false)}
                />
                {/* Tracking Note Modal */}
                <TrackingNoteModal
                    isOpen={isTrackingModalOpen}
                    content={trackingNoteContent}
                    isSaving={isSavingNote}
                    leadName={(activeLeadForNote as any)?.investors?.full_name}
                    onChange={setTrackingNoteContent}
                    onSave={handleSaveTrackingNote}
                    onClose={() => setIsTrackingModalOpen(false)}
                />
            </main>
            
            {/* Chat Button */}
            <ChatButton onClick={() => setShowAIChat(true)} />
            
            {/* Pelayo Chat */}
            <PelayoChat isOpen={showAIChat} onClose={() => setShowAIChat(false)} />
            
            </div>
    );
}
