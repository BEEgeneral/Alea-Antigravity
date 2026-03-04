/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
    Users, Building, Activity, ShieldAlert, ArrowUpRight, Search,
    CheckCircle2, FileText, Download, UserCheck, Mail, GripVertical,
    Clock, MapPin, LayoutDashboard, Plus, MoreHorizontal, Share2,
    ChevronLeft, Maximize2, Bed, Bath, Sparkles, TrendingUp, Wind,
    Trees, ShoppingBag, Umbrella, Tag, Calendar, ShieldCheck, Star,
    Trash2, Edit2, Upload, Loader2, User, LogOut, Settings, Menu, X, Inbox, BrainCircuit
} from "lucide-react";
import Link from "next/link";
import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import ValuationAgent from "@/components/admin/ValuationAgent";

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
    const [activeTab, setActiveTab] = useState<string>("crm");
    const [selectedInvestor, setSelectedInvestor] = useState<any>(null);
    const [selectedLead, setSelectedLead] = useState<any>(null);
    const [leads, setLeads] = useState<any[]>([]);
    const [interactions, setInteractions] = useState<any[]>([]);
    const [investors, setInvestors] = useState<any[]>([]);
    const [mandatarios, setMandatarios] = useState<any[]>([]);
    const [collaborators, setCollaborators] = useState<any[]>([]);
    const [properties, setProperties] = useState<any[]>([]);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [showToast, setShowToast] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [allAgents, setAllAgents] = useState<any[]>([]);
    const [selectedProperty, setSelectedProperty] = useState<any>(null);
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
    const [isSelectingInvestorForLead, setIsSelectingInvestorForLead] = useState(false);
    const [targetPropertyForLead, setTargetPropertyForLead] = useState<any>(null);
    const [agentForm, setAgentForm] = useState({ full_name: "", email: "", role: "agent" });
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
        mandatario_type: "",
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
    const [iaiSuggestions, setIaiSuggestions] = useState<any[]>([]);

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
                description: suggestion.extracted_data.summary || ""
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
        if (confirm("¿Estás seguro de que quieres descartar esta sugerencia de IA?")) {
            await supabase.from('iai_inbox_suggestions').update({ status: 'rejected' }).eq('id', id);
            setIaiSuggestions(prev => prev.filter(s => s.id !== id));
            alert("Sugerencia descartada");
        }
    };

    const handleSubmitPropertySuggestion = async () => {
        try {
            const newProperty = {
                title: propertyForm.title,
                description: propertyForm.description,
                price: Number(propertyForm.price) || 0,
                meters: Number(propertyForm.meters) || 0,
                status: 'Origen Privado',
                asset_type: propertyForm.type || 'Activo Extraído',
                address: propertyForm.address || null,
                is_off_market: true,
                vendor_name: propertyForm.vendor_name || null,
                category: selectedSuggestion ?
                    (selectedSuggestion.extracted_data?._iai_has_dossier === false ? ['IAI', 'Sin Dossier'] : ['IAI'])
                    : []
            };

            const { data: insertedData, error: insertError } = await supabase
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
                await supabase.from('iai_inbox_suggestions').update({ status: 'approved' }).eq('id', selectedSuggestion.id);
                setIaiSuggestions(prev => prev.filter(s => s.id !== selectedSuggestion.id));
            }

            setIsReviewingPropertySuggestion(false);
            setSelectedSuggestion(null);
            alert("Activo dado de alta exitosamente");
        } catch (err: any) {
            console.error("Error creating property from suggestion:", err);
            alert("Error al dar de alta el activo.");
        }
    };

    const fetchData = async () => {
        try {
            // Fetch Leads with Investor and Property details
            const { data: leadsData } = await supabase
                .from('leads')
                .select(`
                    *,
                    investors (*),
                    properties (*)
                `)
                .order('created_at', { ascending: false });

            // Fetch Properties
            const { data: propertiesData } = await supabase.from('properties').select('*');

            // Fetch Investors
            const { data: investorsData } = await supabase.from('investors').select('*');

            // Fetch Collaborators
            const { data: collaboratorsData } = await supabase.from('collaborators').select('*').order('created_at', { ascending: false });

            // Fetch Mandatarios
            const { data: mandatariosData } = await supabase.from('mandatarios').select('*').order('created_at', { ascending: false });

            // Fetch IAI Suggestions
            const { data: iaiSuggestionsData } = await supabase.from('iai_inbox_suggestions').select('*').eq('status', 'pending').order('created_at', { ascending: false });

            if (leadsData) setLeads(leadsData);
            if (propertiesData) setProperties(propertiesData);
            if (investorsData) setInvestors(investorsData);
            if (mandatariosData) setMandatarios(mandatariosData);
            if (collaboratorsData) setCollaborators(collaboratorsData);
            if (iaiSuggestionsData) setIaiSuggestions(iaiSuggestionsData);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push("/login");
                return;
            }

            const isGodMode = session.user.email === 'beenocode@gmail.com';

            const { data: agent } = await supabase
                .from('agents')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (!isGodMode && (!agent || !agent.is_approved)) {
                router.push("/login");
                return;
            }

            if (isGodMode && !agent) {
                // Pre-set God Mode user if not in DB
                setCurrentUser({
                    id: session.user.id,
                    full_name: 'Super Admin',
                    email: 'beenocode@gmail.com',
                    role: 'admin',
                    is_approved: true
                });
            } else {
                setCurrentUser(agent);
            }

            await fetchData();
            setLoading(false);
        };
        checkAuth();
    }, [router]);

    useEffect(() => {
        if (activeTab === "agents" && currentUser?.role === "admin") {
            const fetchAgents = async () => {
                const { data } = await supabase.from('agents').select('*').order('created_at', { ascending: false });
                if (data) setAllAgents(data);
            };
            fetchAgents();
        }
    }, [activeTab, currentUser]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = "/";
    };

    const handleApproveAgent = async (id: string) => {
        const { error } = await supabase
            .from('agents')
            .update({ is_approved: true })
            .eq('id', id);

        if (!error) {
            setAllAgents(prev => prev.map(a => a.id === id ? { ...a, is_approved: true } : a));
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        }
    };

    const handleRejectAgent = async (id: string) => {
        const { error } = await supabase
            .from('agents')
            .delete()
            .eq('id', id);

        if (!error) {
            setAllAgents(prev => prev.filter(a => a.id !== id));
        }
    };

    const handleDeleteInvestor = async (id: string) => {
        if (!confirm("¿Estás seguro de que quieres eliminar a este inversor? Esta acción es irreversible.")) return;
        const { error } = await supabase
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
        if (!confirm("¿Estás seguro de que quieres eliminar esta ficha de Operativa (Lead)? Esta acción es irreversible.")) return;
        const { error } = await supabase
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
        if (!confirm("¿Estás seguro de que quieres dar de baja esta propiedad?")) return;
        const { error } = await supabase
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
            const { data, error } = await supabase
                .from('leads')
                .insert([{
                    investor_id: investorId,
                    property_id: propertyId,
                    status: 'prospect',
                    created_at: new Date().toISOString()
                }])
                .select();

            if (!error) {
                await fetchData(); // Refresh leads
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
        const { error } = await supabase
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
            // 1. Upload original PDF to Supabase Storage (bucket 'properties')
            let pdfUrl = null;
            const fileExt = file.name.split('.').pop();
            const fileName = `dossiers/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('properties')
                .upload(fileName, file);

            if (uploadData && !uploadError) {
                const { data: { publicUrl } } = supabase.storage.from('properties').getPublicUrl(fileName);
                pdfUrl = publicUrl;
            } else {
                console.warn("Could not upload PDF to Storage:", uploadError);
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

            // Fallback heuristics
            const priceMatch = fullText.match(/(?:precio|price|valor)[\s:=]*([0-9.,]+)[\s]*(?:€|euros|m|k)/i);
            const parsedPrice = priceMatch ? parseFloat(priceMatch[1].replace(/[^0-9]/g, '')) : 0;

            // Look for meters
            const metersMatch = fullText.match(/([0-9.,]+)[\s]*(?:m2|m²|metros)/i);
            const parsedMeters = metersMatch ? parseFloat(metersMatch[1].replace(/[^0-9]/g, '')) : 0;

            const newProperty = {
                title: file.name.replace('.pdf', ''),
                description: fullText.substring(0, 800) + (fullText.length > 800 ? "..." : ""),
                price: parsedPrice || 1000000, // mock fallback
                meters: parsedMeters || 150,
                thumbnail_url: extractedImages[0] || null,
                images: extractedImages,
                status: 'Origen Privado',
                asset_type: 'Activo Extraído',
                is_off_market: true,
                dossier_url: pdfUrl
            };

            const { data: insertedData, error: insertError } = await supabase
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
            alert(`Error al procesar el PDF: ${err?.message || 'Error desconocido'}`);
        } finally {
            setIsUploadingPdf(false);
            e.target.value = '';
        }
    };

    const handleUpdateAgent = async (agent: any) => {
        const { error } = await supabase
            .from('agents')
            .update({
                full_name: agent.full_name,
                role: agent.role,
                is_approved: agent.is_approved
            })
            .eq('id', agent.id);

        if (!error) {
            setAllAgents(prev => prev.map(a => a.id === agent.id ? { ...a, ...agent } : a));
            setSelectedAgentToEdit(null);
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        }
    };

    const handleUpdateInvestor = async (investor: any) => {
        const { error } = await supabase
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
        const { error } = await supabase
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

        const { error } = await supabase
            .from('leads')
            .update(updates)
            .eq('id', leadId);

        if (!error) {
            setLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...updates } : l));
            if (selectedLead?.id === leadId) {
                setSelectedLead((prev: any) => ({ ...prev, ...updates }));
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
                    await supabase.from('properties').update(propUpdates).eq('id', lead.property_id);
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
        // Note: Creating a user via admin typically requires Service Role or specific Auth logic.
        // For simplicity in this UI, we assume we insert into 'agents' and the user will register later,
        // or we use this just for administrative tracking.
        const { error } = await supabase
            .from('agents')
            .insert([{
                ...agentForm,
                is_approved: true,
                created_at: new Date().toISOString()
            }]);

        if (!error) {
            const { data } = await supabase.from('agents').select('*').order('created_at', { ascending: false });
            if (data) setAllAgents(data);
            setIsAddingAgent(false);
            setAgentForm({ full_name: "", email: "", role: "agent" });
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        } else {
            console.error("Error creating agent:", error);
        }
    };

    const handleCreateInvestor = async () => {
        try {
            const { error } = await supabase
                .from('investors')
                .insert([{
                    ...investorForm,
                    status: 'nuevo',
                    kyc_status: 'pending',
                    created_at: new Date().toISOString()
                }]);

            if (!error) {
                await fetchData(); // Refresh list
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
                    await supabase.from('iai_inbox_suggestions').update({ status: 'approved' }).eq('id', selectedSuggestion.id);
                    setIaiSuggestions(prev => prev.filter(s => s.id !== selectedSuggestion.id));
                    setSelectedSuggestion(null);
                }

                setTimeout(() => setShowToast(false), 3000);
            } else {
                console.error("Error creating investor:", error);
            }
        } catch (error) {
            console.error("Error creating investor:", error);
        }
    };

    const handleCreateMandatario = async () => {
        try {
            const { error } = await supabase
                .from('mandatarios')
                .insert([{
                    ...mandatarioForm,
                    status: 'nuevo',
                    kyc_status: 'pending',
                    created_at: new Date().toISOString()
                }]);

            if (!error) {
                await fetchData(); // Refresh list
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
                    await supabase.from('iai_inbox_suggestions').update({ status: 'approved' }).eq('id', selectedSuggestion.id);
                    setIaiSuggestions(prev => prev.filter(s => s.id !== selectedSuggestion.id));
                    setSelectedSuggestion(null);
                }

                setTimeout(() => setShowToast(false), 3000);
            } else {
                console.error("Error creating mandatario:", error);
            }
        } catch (error) {
            console.error("Error creating mandatario:", error);
        }
    };

    const handleUpdateMandatario = async (mandatario: any) => {
        const { error } = await supabase
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
        const { error } = await supabase
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
            const { data, error } = await supabase
                .from('collaborators')
                .insert([{
                    ...collaboratorForm,
                    created_at: new Date().toISOString()
                }])
                .select();

            if (!error) {
                if (data) setCollaborators(prev => [data[0], ...prev]);

                if (selectedSuggestion) {
                    await supabase.from('iai_inbox_suggestions').update({ status: 'approved' }).eq('id', selectedSuggestion.id);
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
        if (!confirm("¿Estás seguro de que quieres eliminar a este colaborador?")) return;
        const { error } = await supabase
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
            const { data, error } = await supabase
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
                const { error } = await supabase
                    .from('leads')
                    .update({ status: targetStageId, updated_at: new Date().toISOString() })
                    .eq('id', leadId);

                if (error) {
                    console.error("Error updating lead status:", error);
                    // Revert local state if needed
                    await fetchData();
                } else {
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 3000);
                }
            }
        }
    };

    const _handleAddInteraction = (leadId: string) => {
        const content = prompt("Añadir nota de seguimiento:");
        if (content) {
            const newInteraction = {
                id: `i${Date.now()}`,
                leadId,
                type: "note",
                content,
                date: "Just now"
            };
            setInteractions([newInteraction, ...interactions]);
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



                        {/* Detailed Characteristics */}
                        <div className="bg-card border border-border/60 rounded-[2.5rem] p-10 shadow-sm text-white">
                            <h3 className="flex items-center space-x-3 text-lg font-serif font-medium mb-10">
                                <Building className="text-primary" size={24} />
                                <span className="text-foreground">Características Detalladas</span>
                            </h3>

                            {/* Icon Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                                {[
                                    { icon: Maximize2, label: "M² Útiles", value: `${property.meters || 0}` },
                                    { icon: Building, label: "Parcela", value: `${property.parcela_meters || 279} m²` },
                                    { icon: Sparkles, label: "Estado", value: property.status || "Excelente" },
                                    { icon: Building, label: "Tipo", value: property.type || "Local" }
                                ].map((item, i) => (
                                    <div key={i} className="bg-muted/30 p-6 rounded-3xl border border-border/40 text-center flex flex-col items-center group hover:bg-primary/5 hover:border-primary/20 transition-all">
                                        <item.icon className="text-primary/40 group-hover:text-primary transition-colors mb-4" size={24} />
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mb-1">{item.label}</p>
                                        <p className="text-base font-bold font-serif text-foreground">{item.value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Info List */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6 text-sm">
                                {[
                                    { label: "Tipo:", value: property.type || "Local" },
                                    { label: "Referencia:", value: property.reference || "3250313UF7635S0001WO", valueClass: "font-mono font-bold" },
                                    { label: "Estado:", value: property.status || "Excelente" },
                                    { label: "Orientación:", value: property.orientacion || "Norte" },
                                    { label: "Cocina:", value: property.cocina || "Equipada" },
                                    { label: "Piscina:", value: property.piscina ? "Sí" : "Sí" },
                                    { label: "Jardín:", value: property.jardin ? "Sí" : "Sí" },
                                    { label: "Amueblado:", value: property.amueblado ? "Sí" : "Sí" },
                                    { label: "Agente responsable:", value: property.agent_responsible || "Alberto BeeNoCode", valueClass: "font-serif italic" }
                                ].map((row, i) => (
                                    <div key={i} className="flex justify-between items-center py-3 border-b border-border/30 last:border-0">
                                        <span className="text-muted-foreground uppercase tracking-widest text-[10px] font-bold">{row.label}</span>
                                        <span className={`text-right text-foreground ${row.valueClass || 'font-bold'}`}>{row.value}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Tags Sections */}
                            <div className="mt-12 space-y-8">
                                {[
                                    { label: "Características", tags: property.features || ["Patio"], icon: Star },
                                    { label: "Climatización", tags: property.climatization || ["Aire Acondicionado"], icon: Wind },
                                    { label: "Entorno", tags: property.entorno || ["Cerca de Tiendas", "Cerca del Mar", "Cerca de Colegios"], icon: MapPin },
                                    { label: "Categoría", tags: property.category || ["Institucional", "Residencial Core", "Terciario Yield", "Prime"], icon: Tag }
                                ].map((section, i) => (
                                    <div key={i}>
                                        <p className="text-[10px] uppercase tracking-widest text-primary font-black mb-4 flex items-center">
                                            <section.icon size={12} className="mr-2" />
                                            {section.label}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {section.tags?.map((tag: string) => (
                                                <span key={tag} className="px-4 py-1.5 bg-muted rounded-xl text-[10px] font-bold uppercase tracking-wider border border-border/40 text-muted-foreground hover:bg-primary hover:text-white hover:border-primary transition-all cursor-default">{tag}</span>
                                            ))}
                                            {(!section.tags || section.tags.length === 0) && <span className="text-[10px] text-muted-foreground/40 uppercase tracking-widest font-bold">No especificado</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
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
                                            €{Number(property.price).toLocaleString()}
                                        </div>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Precio base</p>
                                    </div>
                                    <div className="space-y-6 pt-8 border-t border-border/50">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-4">Desglose de Comisiones</p>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center text-sm font-medium">
                                                <span className="text-muted-foreground">Precio base:</span>
                                                <span className="text-foreground">€{Number(property.price).toLocaleString()}</span>
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
            <aside className="w-64 bg-card border-r border-border flex flex-col hidden md:flex shrink-0 z-20 shadow-xl">
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

                    {/* New Line: IAI Inbox */}
                    {currentUser?.role === 'admin' && (
                        <button
                            onClick={() => { setActiveTab("iai_inbox"); setSelectedInvestor(null); setSelectedLead(null); }}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${activeTab === "iai_inbox" ? 'bg-primary/10 text-primary font-medium shadow-sm' : 'text-foreground/70 hover:bg-muted'}`}
                        >
                            <div className="flex items-center space-x-3">
                                <Inbox size={18} className={activeTab === "iai_inbox" ? "text-primary" : "text-muted-foreground"} />
                                <span>Bandeja IAI</span>
                            </div>
                            {iaiSuggestions.filter(s => s.status === 'pending').length > 0 && (
                                <span className="bg-primary text-background text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                                    {iaiSuggestions.filter(s => s.status === 'pending').length}
                                </span>
                            )}
                        </button>
                    )}

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
                        onClick={() => { setActiveTab("assets"); setSelectedInvestor(null); setSelectedLead(null); }}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === "assets" ? 'bg-primary/10 text-primary font-medium shadow-sm' : 'text-foreground/70 hover:bg-muted'}`}
                    >
                        <Building size={18} />
                        <span>Activos</span>
                    </button>

                    <button
                        onClick={() => { setActiveTab("intelligence"); setSelectedInvestor(null); setSelectedLead(null); }}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === "intelligence" ? 'bg-primary/10 text-primary font-medium shadow-sm' : 'text-foreground/70 hover:bg-muted'}`}
                    >
                        <Sparkles size={18} />
                        <span>Alea Intelligence</span>
                    </button>

                    <button
                        onClick={() => { setActiveTab("audit"); setSelectedInvestor(null); setSelectedLead(null); }}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === "audit" ? 'bg-primary/10 text-primary font-medium shadow-sm' : 'text-foreground/70 hover:bg-muted'}`}
                    >
                        <ShieldAlert size={18} />
                        <span>Logs del Sistema</span>
                    </button>

                    {currentUser?.role === 'admin' && (
                        <button
                            onClick={() => { setActiveTab("agents"); setSelectedInvestor(null); setSelectedLead(null); }}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === "agents" ? 'bg-primary/10 text-primary font-medium shadow-sm' : 'text-foreground/70 hover:bg-muted'}`}
                        >
                            <UserCheck size={18} />
                            <span>Gestión de Agentes</span>
                        </button>
                    )}

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
                            className="fixed inset-y-0 left-0 w-72 bg-card z-[101] shadow-2xl flex flex-col md:hidden"
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
                                    ...(currentUser?.role === 'admin' ? [{ id: "iai_inbox", label: "Bandeja IAI", icon: Inbox }] : []),
                                    { id: "investors", label: "Inversores (KYC)", icon: Users },
                                    { id: "mandatarios", label: "Mandatarios", icon: ShieldCheck },
                                    { id: "collaborators", label: "Colaboradores", icon: Share2 },
                                    { id: "templates", label: "Plantillas", icon: FileText },
                                    { id: "assets", label: "Activos", icon: Building },
                                    { id: "intelligence", label: "Alea Intelligence", icon: Sparkles },
                                    { id: "audit", label: "Logs del Sistema", icon: ShieldAlert },
                                    ...(currentUser?.role === 'admin' ? [{ id: "agents", label: "Gestión de Agentes", icon: UserCheck }] : [])
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

                <header className="px-4 py-6 md:p-8 md:pb-4 flex justify-between items-center bg-background/50 backdrop-blur-sm z-10 border-b border-border/50">
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
                                    activeTab === 'iai_inbox' ? 'Bandeja de Inteligencia Artificial (IAI)' :
                                        activeTab === 'investors' ? 'Directorio de Inversores' :
                                            activeTab === 'mandatarios' ? 'Directorio de Mandatarios' :
                                                activeTab === 'templates' ? 'Document Factory' :
                                                    activeTab === 'assets' ? 'Asset Portfolio' :
                                                        activeTab === 'intelligence' ? 'Alea Intelligence Core' :
                                                            activeTab === 'profile' ? 'Perfil de Usuario' :
                                                                activeTab === 'agents' ? 'Control de Agentes' : 'System Logs'}
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
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="fixed bottom-8 right-8 bg-foreground text-background px-6 py-3 rounded-2xl shadow-2xl z-50 flex items-center space-x-3 font-medium border border-white/10"
                            >
                                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                <span>Estado de operación actualizado en Supabase</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {selectedInvestor ? (
                        renderInvestorProfile(selectedInvestor)
                    ) : (
                        <div className="h-full flex relative px-8 pt-6">
                            <div className={`flex-1 overflow-x-auto pb-8 transition-all duration-500 ${selectedLead ? 'mr-96' : ''}`}>
                                {activeTab === "crm" && (
                                    <div className="flex h-full space-x-6 min-w-max pb-8 relative">
                                        {PIPELINE_STAGES.map((stage) => (
                                            <div
                                                key={stage.id}
                                                ref={(el) => (columnRefs.current[stage.id] = el as any)}
                                                className="w-80 flex flex-col group/column"
                                            >
                                                <div className="flex items-center justify-between mb-4 px-3">
                                                    <div className="flex items-center space-x-2">
                                                        <div className={`w-2.5 h-2.5 rounded-full ${stage.color} shadow-[0_0_10px_rgba(0,0,0,0.1)]`} />
                                                        <h3 className="font-serif text-sm font-bold tracking-tight uppercase text-xs tracking-[0.2em]">{stage.label}</h3>
                                                        <span className="text-[10px] bg-muted/60 px-2 py-0.5 rounded-full text-muted-foreground font-bold border border-border/50">
                                                            {pipelineData[stage.id]?.length || 0}
                                                        </span>
                                                    </div>
                                                    <button className="text-muted-foreground/40 hover:text-foreground transition-colors">
                                                        <Plus size={14} />
                                                    </button>
                                                </div>

                                                <div className={`flex-1 bg-muted/20 rounded-[2rem] border border-dashed transition-all duration-300 ${draggingId ? 'border-primary/20 bg-primary/5' : 'border-border/40'} p-4 space-y-4 overflow-y-auto`}>
                                                    <AnimatePresence>
                                                        {pipelineData[stage.id]?.map((lead) => (
                                                            <motion.div
                                                                key={lead.id}
                                                                layoutId={lead.id}
                                                                drag
                                                                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                                                                dragElastic={0.05}
                                                                onDragStart={() => handleDragStart(lead.id)}
                                                                onDragEnd={(e, info) => handleDragEnd(e, info, lead.id)}
                                                                onClick={() => { if (!draggingId) setSelectedLead(lead); }}
                                                                whileDrag={{ scale: 1.05, rotate: 2, zIndex: 100, boxShadow: "0 20px 40px rgba(0,0,0,0.15)" }}
                                                                initial={{ opacity: 0, scale: 0.9 }}
                                                                animate={{ opacity: 1, scale: 1 }}
                                                                className={`bg-card border rounded-3xl p-5 shadow-sm hover:shadow-md transition-all group relative cursor-grab active:cursor-grabbing ${selectedLead?.id === lead.id ? 'border-primary ring-1 ring-primary/20 bg-primary/[0.02]' : 'border-border hover:border-primary/40'}`}
                                                            >
                                                                <div className="flex justify-between items-start mb-4">
                                                                    <div className="flex items-center space-x-3">
                                                                        <div className="w-10 h-10 bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl flex items-center justify-center text-xs font-serif border border-primary/10 text-primary">
                                                                            {lead.investors?.full_name?.charAt(0) || lead.investor?.charAt(0)}
                                                                        </div>
                                                                        <div>
                                                                            <h4 className="text-sm font-semibold leading-tight mb-0.5">{lead.investors?.full_name || lead.investor}</h4>
                                                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{lead.investors?.investor_type || lead.type}</p>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-2.5 mb-5 px-1">
                                                                    <div className="flex items-center text-[11px] text-muted-foreground/80 font-medium">
                                                                        <MapPin size={12} className="mr-2 text-primary/40" />
                                                                        <span className="truncate">{lead.properties?.title || lead.property}</span>
                                                                    </div>

                                                                    {/* Metrics Viability */}
                                                                    <div className="mt-4 p-3 bg-primary/[0.03] border border-primary/10 rounded-2xl space-y-2">
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Mercado Base</span>
                                                                            <span className="text-[10px] font-bold">€{(lead.properties?.price || 0).toLocaleString()}</span>
                                                                        </div>
                                                                        <div className="flex items-center justify-between">
                                                                            <div className="flex items-center gap-1">
                                                                                <Sparkles size={8} className="text-primary" />
                                                                                <span className="text-[8px] font-black uppercase tracking-widest text-primary">Target (Vp)</span>
                                                                            </div>
                                                                            <span className="text-[10px] font-bold text-primary">€{((lead.properties?.price || 0) * 1.25).toLocaleString()}</span>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex items-center text-[10px] text-muted-foreground/60 font-bold uppercase tracking-wider mt-2">
                                                                        <Clock size={12} className="mr-2 text-primary/40" />
                                                                        <span>ID: {lead.id.slice(0, 8)}...</span>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center justify-between border-t border-border/30 pt-4">
                                                                    <div className="flex items-center space-x-2">
                                                                        <div className="w-20 bg-muted/50 rounded-full h-1.5 overflow-hidden">
                                                                            <motion.div
                                                                                initial={{ width: 0 }}
                                                                                animate={{ width: `${lead.match_score || lead.matchScore}%` }}
                                                                                className="bg-primary h-full"
                                                                            />
                                                                        </div>
                                                                        <span className="text-[10px] font-black text-primary">{lead.match_score || lead.matchScore}%</span>
                                                                    </div>
                                                                    <div className="flex items-center space-x-2">
                                                                        <span className="text-[9px] font-black bg-primary/5 text-primary/80 px-2 py-1 rounded-lg border border-primary/10">
                                                                            {lead.investors?.ticket_size || lead.ticket}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        ))}
                                                    </AnimatePresence>
                                                    {pipelineData[stage.id]?.length === 0 && (
                                                        <div className="h-40 flex flex-col items-center justify-center text-[10px] text-muted-foreground/30 uppercase tracking-[0.3em] font-bold border-2 border-dashed border-border/20 rounded-[2rem]">
                                                            <span>Zona Vacía</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* IAI INBOX TAB */}
                                {activeTab === "iai_inbox" && currentUser?.role === 'admin' && (
                                    <div className="space-y-6 max-w-5xl mx-auto px-4 lg:px-0 mt-8 mb-20">
                                        <div className="p-6 md:p-8 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-[2rem] border border-primary/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                                <BrainCircuit size={160} />
                                            </div>
                                            <div className="max-w-2xl relative z-10">
                                                <h3 className="text-2xl font-serif font-medium flex items-center">
                                                    <Sparkles size={24} className="mr-3 text-primary" />
                                                    Bandeja de Inteligencia Artificial
                                                </h3>
                                                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                                                    Estos correos han sido procesados por <strong>Alea Intelligence Core</strong>.
                                                    Revisa la información estructurada que la IA ha extraído y apruébala para convertirla al instante en nuevas fichas operacionales dentro de la base de datos de Alea Signature.
                                                </p>
                                            </div>
                                            <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto bg-background/50 backdrop-blur-md p-4 rounded-3xl border border-white/10 relative z-10 shadow-xl">
                                                <p className="text-5xl font-serif font-medium text-primary">{iaiSuggestions.filter(s => s.status === 'pending').length}</p>
                                                <p className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground mt-1">Pendientes</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-6">
                                            {iaiSuggestions.filter(s => s.status === 'pending').length === 0 ? (
                                                <div className="p-16 text-center border-2 border-dashed border-border/50 rounded-[3rem] bg-muted/5 flex flex-col items-center justify-center">
                                                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                                                        <CheckCircle2 size={32} className="text-primary" />
                                                    </div>
                                                    <h3 className="text-xl font-serif font-medium text-foreground tracking-tight">Bandeja al Día</h3>
                                                    <p className="text-sm text-muted-foreground mt-3 max-w-sm mx-auto">No hay nuevos correos pendientes de revisión. Envía correos a la dirección de inteligencia para verlos aquí.</p>
                                                </div>
                                            ) : (
                                                iaiSuggestions.filter(s => s.status === 'pending').map((suggestion) => (
                                                    <div key={suggestion.id} className="p-6 md:p-8 bg-card border border-border shadow-md rounded-[2.5rem] hover:border-primary/30 transition-all group flex flex-col md:flex-row gap-8">
                                                        <div className="flex-1 space-y-6">
                                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                                                <div>
                                                                    <div className="flex flex-wrap items-center gap-2 mb-3">
                                                                        <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center shadow-sm ${suggestion.suggestion_type === 'property' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                                                                            suggestion.suggestion_type === 'investor' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                                                                'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                                                            }`}>
                                                                            {suggestion.suggestion_type === 'property' && <Building size={12} className="mr-1.5" />}
                                                                            {suggestion.suggestion_type === 'investor' && <Users size={12} className="mr-1.5" />}
                                                                            Sugerencia: {suggestion.suggestion_type === 'property' ? 'Nuevo Activo' : suggestion.suggestion_type === 'investor' ? 'Nuevo Inversor' : 'Contacto'}
                                                                        </span>
                                                                        <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground flex items-center bg-muted/50 px-3 py-1.5 rounded-xl">
                                                                            <Clock size={12} className="mr-1.5" />
                                                                            {new Date(suggestion.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                                        </span>
                                                                    </div>
                                                                    <h4 className="text-xl font-serif font-medium text-foreground tracking-tight">{suggestion.original_email_subject}</h4>
                                                                    <p className="text-xs font-medium text-muted-foreground flex items-center mt-2.5">
                                                                        <Mail size={14} className="mr-2 text-primary/40" />
                                                                        Origen: <span className="ml-1 text-foreground">{suggestion.sender_email}</span>
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className="bg-muted/30 p-6 rounded-[2rem] border border-border/50 relative overflow-hidden">
                                                                <div className="flex items-start">
                                                                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mr-3 shrink-0 mt-0.5">
                                                                        <Sparkles size={12} className="text-primary" />
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <p className="text-sm text-foreground/80 leading-relaxed font-medium mb-2">
                                                                            <span className="font-bold text-foreground block mb-1">Extracto Inteligente:</span>
                                                                            {suggestion.extracted_data?._iai_summary || suggestion.extracted_data?.summary || 'No hay resumen disponible.'}
                                                                        </p>
                                                                        {suggestion.suggestion_type === 'property' && suggestion.extracted_data?._iai_has_dossier === false && (
                                                                            <span className="inline-block mt-1 px-3 py-1 bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] font-bold uppercase tracking-wider rounded-lg">
                                                                                ⚠️ No se detectaron PDFs ni dossiers adjuntos en el correo
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="mt-6 pt-6 border-t border-border/50 grid grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                                                                    {suggestion.suggestion_type === 'property' ? (
                                                                        <>
                                                                            <div>
                                                                                <p className="text-[9px] uppercase tracking-[0.2em] font-black text-muted-foreground mb-1.5">Título del Activo</p>
                                                                                <p className="text-sm font-semibold text-foreground line-clamp-2">{suggestion.extracted_data.title}</p>
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-[9px] uppercase tracking-[0.2em] font-black text-muted-foreground mb-1.5">Precio Propuesto</p>
                                                                                <p className="text-sm font-bold text-primary">{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(suggestion.extracted_data.price || 0)}</p>
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-[9px] uppercase tracking-[0.2em] font-black text-muted-foreground mb-1.5">Ubicación</p>
                                                                                <p className="text-sm font-semibold">{suggestion.extracted_data.location}</p>
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-[9px] uppercase tracking-[0.2em] font-black text-muted-foreground mb-1.5">Superficie</p>
                                                                                <p className="text-sm font-semibold">{suggestion.extracted_data.surface} m²</p>
                                                                            </div>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <div>
                                                                                <p className="text-[9px] uppercase tracking-[0.2em] font-black text-muted-foreground mb-1.5">Nombre / Entidad</p>
                                                                                <p className="text-sm font-semibold">{suggestion.extracted_data.full_name}</p>
                                                                                <p className="text-[10px] text-muted-foreground">{suggestion.extracted_data.company_name}</p>
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-[9px] uppercase tracking-[0.2em] font-black text-muted-foreground mb-1.5">Ticket de Inversión</p>
                                                                                <span className="px-2 py-1 bg-primary/10 text-primary font-bold text-[10px] rounded-lg border border-primary/20">
                                                                                    {suggestion.extracted_data.ticket}
                                                                                </span>
                                                                            </div>
                                                                            <div className="col-span-2">
                                                                                <p className="text-[9px] uppercase tracking-[0.2em] font-black text-muted-foreground mb-1.5">Etiquetas Detectadas</p>
                                                                                <div className="flex flex-wrap gap-2 mt-1.5">
                                                                                    {(suggestion.extracted_data as any).labels?.map((label: string, i: number) => (
                                                                                        <span key={i} className="px-2.5 py-1 bg-muted border border-border/50 text-foreground font-bold rounded-lg text-[9px] uppercase tracking-wider">{label}</span>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex md:flex-col justify-end md:justify-center gap-3 md:w-56 shrink-0 md:pl-8 md:border-l border-t md:border-t-0 border-border pt-6 md:pt-0">
                                                            <button
                                                                onClick={() => handleApproveSuggestion(suggestion)}
                                                                className="flex-1 md:flex-none w-full py-4 bg-foreground text-background rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:scale-[1.02] hover:shadow-xl transition-all flex items-center justify-center">
                                                                <CheckCircle2 size={16} className="mr-2" />
                                                                Aprobar Alta
                                                            </button>
                                                            <button className="hidden md:flex flex-1 md:flex-none w-full py-3 text-muted-foreground bg-muted/30 border border-border/50 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-muted transition-all items-center justify-center">
                                                                <FileText size={14} className="mr-2" />
                                                                Ver Email
                                                            </button>
                                                            <button
                                                                onClick={() => handleRejectSuggestion(suggestion.id)}
                                                                className="flex-1 md:flex-none w-full py-4 text-red-500/70 bg-red-500/5 hover:bg-red-500/10 hover:text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center border border-red-500/10">
                                                                <Trash2 size={14} className="mr-2" />
                                                                Descartar
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="max-w-5xl mx-auto w-full">
                                    {activeTab === "investors" && (
                                        <div className="bg-card border border-border rounded-[3rem] shadow-xl p-10 mt-10 max-w-5xl mx-auto overflow-hidden">
                                            <div className="flex justify-between items-center mb-10 px-6">
                                                <div>
                                                    <h2 className="text-2xl font-serif font-medium">Directorio de Inversores</h2>
                                                    <p className="text-muted-foreground text-xs uppercase tracking-widest font-bold mt-1">Sincronizado con Supabase</p>
                                                </div>
                                                <button
                                                    onClick={() => setIsAddingInvestor(true)}
                                                    className="px-6 py-2 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                                                >
                                                    Añadir Inversor
                                                </button>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {investors.map((investor: any) => (
                                                        <motion.div
                                                            key={investor.id}
                                                            whileHover={{ y: -5 }}
                                                            className="bg-card/50 backdrop-blur-sm border border-border/60 rounded-[2rem] p-6 flex flex-col justify-between hover:shadow-xl hover:border-primary/30 transition-all group relative overflow-hidden"
                                                        >
                                                            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-primary/10 transition-all" />

                                                            <div className="flex items-start justify-between mb-6 relative">
                                                                <div className="flex items-center space-x-4">
                                                                    <div className="w-14 h-14 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center text-xl font-serif text-primary border border-primary/10 shadow-inner">
                                                                        {investor.full_name?.charAt(0) || 'I'}
                                                                    </div>
                                                                    <div>
                                                                        <h3 className="text-base font-bold text-foreground leading-tight group-hover:text-primary transition-colors">{investor.full_name}</h3>
                                                                        <div className="flex items-center mt-1">
                                                                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${investor.is_verified ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                                                                                {investor.is_verified ? 'Verificado' : 'Pendiente'}
                                                                            </span>
                                                                            <span className="text-[9px] text-muted-foreground ml-2 font-medium uppercase tracking-wider">{investor.investor_type || 'Private Investor'}</span>
                                                                        </div>
                                                                        {investor.labels && investor.labels.length > 0 && (
                                                                            <div className="flex gap-1 mt-2">
                                                                                {investor.labels.map((label: string) => (
                                                                                    <span key={label} className="text-[7px] font-black uppercase tracking-[0.1em] px-1.5 py-0.5 bg-primary/5 text-primary rounded border border-primary/10">
                                                                                        {label}
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex space-x-1">
                                                                    <button
                                                                        onClick={() => handleToggleVerification(investor.id, !!investor.is_verified)}
                                                                        className={`p-2.5 rounded-xl transition-all ${investor.is_verified ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' : 'bg-muted/50 text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-500'}`}
                                                                        title={investor.is_verified ? "Revocar Verificación/NDA" : "Verificar/Aprobar NDA"}
                                                                    >
                                                                        <ShieldCheck size={14} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setSelectedInvestorToEdit(investor)}
                                                                        className="p-2.5 bg-muted/50 rounded-xl hover:bg-primary/10 hover:text-primary transition-all text-muted-foreground"
                                                                    >
                                                                        <Edit2 size={14} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteInvestor(investor.id)}
                                                                        className="p-2.5 bg-muted/50 rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-all text-muted-foreground"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setSelectedInvestor(investor)}
                                                                        className="p-2.5 bg-muted/50 rounded-xl hover:bg-foreground hover:text-white transition-all text-muted-foreground"
                                                                    >
                                                                        <ArrowUpRight size={14} />
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-3 mb-6">
                                                                <div className="flex items-center text-[11px] text-muted-foreground/80 font-medium">
                                                                    <Mail size={12} className="mr-2 text-primary/40" />
                                                                    <span className="truncate">{investor.email || 'N/A'}</span>
                                                                </div>
                                                                <div className="flex items-center text-[11px] text-muted-foreground/80 font-medium">
                                                                    <Building size={12} className="mr-2 text-primary/40" />
                                                                    <span className="truncate">{investor.company_name || 'Individual'}</span>
                                                                </div>
                                                            </div>

                                                            <div className="pt-4 border-t border-border/30 flex items-end justify-between">
                                                                <div>
                                                                    <p className="text-[8px] text-muted-foreground uppercase tracking-[0.2em] font-black mb-1">Capacidad Estimada</p>
                                                                    <p className="text-lg font-serif font-bold text-primary">
                                                                        {investor.ticket_size || (investor.budget_max ? `€${Number(investor.budget_max).toLocaleString()}` : '€5M+')}
                                                                    </p>
                                                                </div>
                                                                <div className="flex -space-x-2">
                                                                    {[1, 2].map((i) => (
                                                                        <div key={i} className="w-6 h-6 rounded-full border-2 border-card bg-muted flex items-center justify-center overflow-hidden">
                                                                            <div className="w-full h-full bg-primary/20" />
                                                                        </div>
                                                                    ))}
                                                                    <div className="w-6 h-6 rounded-full border-2 border-card bg-primary/10 flex items-center justify-center text-[8px] font-black text-primary">
                                                                        +3
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                    {investors.length === 0 && (
                                                        <div className="col-span-full text-center py-20 opacity-40 uppercase tracking-widest text-xs font-black border-2 border-dashed border-border/40 rounded-[3rem]">
                                                            No hay inversores en la base de datos
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {activeTab === "mandatarios" && (
                                        <div className="bg-card border border-border rounded-[3rem] shadow-xl p-10 mt-10 max-w-5xl mx-auto overflow-hidden">
                                            <div className="flex justify-between items-center mb-10 px-6">
                                                <div>
                                                    <h2 className="text-2xl font-serif font-medium">Directorio de Mandatarios</h2>
                                                    <p className="text-muted-foreground text-xs uppercase tracking-widest font-bold mt-1">Sincronizado con Supabase</p>
                                                </div>
                                                <button
                                                    onClick={() => setIsAddingMandatario(true)}
                                                    className="px-6 py-2 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                                                >
                                                    Añadir Mandatario
                                                </button>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {mandatarios.map((mandatario: any) => (
                                                        <motion.div
                                                            key={mandatario.id}
                                                            whileHover={{ y: -5 }}
                                                            className="bg-card/50 backdrop-blur-sm border border-border/60 rounded-[2rem] p-6 flex flex-col justify-between hover:shadow-xl hover:border-primary/30 transition-all group relative overflow-hidden"
                                                        >
                                                            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-primary/10 transition-all" />

                                                            <div className="flex items-start justify-between mb-6 relative">
                                                                <div className="flex items-center space-x-4">
                                                                    <div className="w-14 h-14 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center text-xl font-serif text-primary border border-primary/10 shadow-inner">
                                                                        {mandatario.full_name?.charAt(0) || 'M'}
                                                                    </div>
                                                                    <div>
                                                                        <h3 className="text-base font-bold text-foreground leading-tight group-hover:text-primary transition-colors">{mandatario.full_name}</h3>
                                                                        <div className="flex items-center mt-1">
                                                                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20`}>
                                                                                Activo
                                                                            </span>
                                                                            <span className="text-[9px] text-muted-foreground ml-2 font-medium uppercase tracking-wider">{mandatario.mandatario_type || 'Mandatario'}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex space-x-1">
                                                                    <button
                                                                        onClick={() => {
                                                                            setMandatarioForm({
                                                                                full_name: mandatario.full_name || '',
                                                                                company_name: mandatario.company_name || '',
                                                                                email: mandatario.email || '',
                                                                                phone: mandatario.phone || '',
                                                                                mandatario_type: mandatario.mandatario_type || '',
                                                                                labels: mandatario.labels || []
                                                                            });
                                                                            setSelectedMandatarioToEdit(mandatario);
                                                                        }}
                                                                        className="p-2.5 bg-muted/50 rounded-xl hover:bg-primary/10 hover:text-primary transition-all text-muted-foreground"
                                                                    >
                                                                        <Edit2 size={14} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteMandatario(mandatario.id)}
                                                                        className="p-2.5 bg-muted/50 rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-all text-muted-foreground"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-3 mb-6">
                                                                <div className="flex items-center text-[11px] text-muted-foreground/80 font-medium">
                                                                    <Mail size={12} className="mr-2 text-primary/40" />
                                                                    <span className="truncate">{mandatario.email || 'N/A'}</span>
                                                                </div>
                                                                <div className="flex items-center text-[11px] text-muted-foreground/80 font-medium">
                                                                    <Building size={12} className="mr-2 text-primary/40" />
                                                                    <span className="truncate">{mandatario.company_name || 'Individual'}</span>
                                                                </div>
                                                            </div>

                                                            <div className="pt-4 border-t border-border/30 flex items-end justify-between text-[10px] text-muted-foreground uppercase tracking-widest font-black">
                                                                Verificación completada
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                    {mandatarios.length === 0 && (
                                                        <div className="col-span-full text-center py-20 opacity-40 uppercase tracking-widest text-xs font-black border-2 border-dashed border-border/40 rounded-[3rem]">
                                                            No hay mandatarios en la base de datos
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === "collaborators" && (
                                        <div className="max-w-6xl mx-auto w-full space-y-8 mt-10 pb-20">
                                            <div className="bg-card border border-border rounded-[3rem] shadow-xl p-10 overflow-hidden relative">
                                                <div className="flex justify-between items-center mb-10">
                                                    <div>
                                                        <h2 className="text-2xl font-serif font-medium">Red de Colaboradores</h2>
                                                        <p className="text-muted-foreground text-xs uppercase tracking-widest font-bold mt-1">Intermediarios y Asesores Externos</p>
                                                    </div>
                                                    <button
                                                        onClick={() => setIsAddingCollaborator(true)}
                                                        className="flex items-center space-x-2 px-6 py-2 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
                                                    >
                                                        <Plus size={16} />
                                                        <span>Registrar Colaborador</span>
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                    {collaborators.map((col: any) => (
                                                        <div
                                                            key={col.id}
                                                            className="p-6 bg-muted/20 border border-border/60 rounded-[2rem] hover:bg-muted/40 transition-all group flex flex-col justify-between"
                                                        >
                                                            <div className="flex items-start justify-between mb-4">
                                                                <div className="flex items-center space-x-4">
                                                                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-serif border border-primary/20">
                                                                        {col.full_name?.charAt(0)}
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="font-bold text-sm">{col.full_name}</h4>
                                                                        <p className="text-[10px] text-primary uppercase font-black tracking-widest">{col.specialty || 'Intermediario'}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-all">
                                                                    <button
                                                                        onClick={() => {
                                                                            setEditingCollaborator(col);
                                                                            setCollaboratorForm({
                                                                                full_name: col.full_name || '',
                                                                                specialty: col.specialty || '',
                                                                                company_name: col.company_name || '',
                                                                                email: col.email || '',
                                                                                phone: col.phone || '',
                                                                            });
                                                                        }}
                                                                        className="p-2 hover:text-primary transition-all"
                                                                    >
                                                                        <FileText size={14} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteCollaborator(col.id)}
                                                                        className="p-2 hover:text-red-500 transition-all"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-2 mt-2">
                                                                <div className="flex items-center space-x-2 text-[11px] text-muted-foreground">
                                                                    <Building size={12} className="text-primary/40" />
                                                                    <span>{col.company_name || 'Individual'}</span>
                                                                </div>
                                                                <div className="flex items-center space-x-2 text-[11px] text-muted-foreground">
                                                                    <Mail size={12} className="text-primary/40" />
                                                                    <span>{col.email || 'N/A'}</span>
                                                                </div>
                                                                {col.phone && (
                                                                    <div className="flex items-center space-x-2 text-[11px] text-muted-foreground">
                                                                        <Activity size={12} className="text-primary/40" />
                                                                        <span>{col.phone}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {collaborators.length === 0 && (
                                                        <div className="col-span-full py-20 border-2 border-dashed border-border/40 rounded-[2.5rem] flex flex-col items-center justify-center opacity-40">
                                                            <Share2 size={32} className="mb-4 text-muted-foreground" />
                                                            <p className="text-xs uppercase tracking-[0.2em] font-black">Sin colaboradores registrados</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === "templates" && (
                                        <div className="bg-card border border-border rounded-[2.5rem] shadow-xl overflow-hidden max-w-4xl mx-auto w-full mt-10">
                                            <div className="p-10 border-b border-border bg-muted/10 flex justify-between items-center">
                                                <div>
                                                    <h2 className="font-serif text-xl font-medium">Gestión de Plantillas Maestras</h2>
                                                    <p className="text-xs text-muted-foreground mt-1">Automatización de documentos legales y técnicos.</p>
                                                </div>
                                                <button className="p-3 bg-primary/10 text-primary rounded-2xl hover:bg-primary hover:text-white transition-all">
                                                    <Plus size={20} />
                                                </button>
                                            </div>
                                            <div className="p-10 grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                {MOCK_TEMPLATES.map((template: any) => (
                                                    <div key={template.id} className="p-6 border border-border rounded-3xl flex items-center justify-between hover:bg-muted/30 transition-all group">
                                                        <div className="flex items-center space-x-4">
                                                            <div className="p-3 bg-primary/5 rounded-2xl group-hover:bg-primary/10 transition-colors">
                                                                <FileText size={24} className="text-primary" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold leading-tight">{template.name}</p>
                                                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mt-1">Status: Ready</p>
                                                            </div>
                                                        </div>
                                                        <button className="text-[10px] font-black px-4 py-2 bg-muted rounded-xl hover:bg-foreground hover:text-white transition-all uppercase tracking-widest">EDITAR</button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === "assets" && (
                                        <div className="bg-card border border-border rounded-[3rem] shadow-xl p-10 mt-10 max-w-5xl mx-auto overflow-hidden">
                                            <div className="flex justify-between items-center mb-10 px-6">
                                                <div>
                                                    <h2 className="text-2xl font-serif font-medium">Asset Portfolio</h2>
                                                    <p className="text-muted-foreground text-xs uppercase tracking-widest font-bold mt-1">Activos</p>
                                                </div>
                                                <div className="flex items-center space-x-4">
                                                    <div className="relative">
                                                        <input
                                                            type="file"
                                                            accept="application/pdf"
                                                            onChange={handleUploadPdf}
                                                            disabled={isUploadingPdf}
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                                            title="Subir Dossier (PDF)"
                                                        />
                                                        <button
                                                            disabled={isUploadingPdf}
                                                            className="px-6 py-2 bg-muted/60 text-foreground border border-border/60 hover:border-foreground/20 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center shadow-sm disabled:opacity-50"
                                                        >
                                                            {isUploadingPdf ? (
                                                                <Loader2 size={16} className="mr-2 animate-spin" />
                                                            ) : (
                                                                <Upload size={16} className="mr-2" />
                                                            )}
                                                            Procesar PDF
                                                        </button>
                                                    </div>
                                                    <button className="px-6 py-2 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-widest hidden md:block">Publicar Activo</button>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                                {properties.map((asset: any) => (
                                                    <div
                                                        key={asset.id}
                                                        onClick={() => setSelectedProperty(asset)}
                                                        className="bg-card border border-border/60 rounded-[2.5rem] overflow-hidden hover:shadow-2xl transition-all group flex flex-col h-full shadow-sm cursor-pointer"
                                                    >
                                                        <div className="relative aspect-[16/10] overflow-hidden">
                                                            <img
                                                                src={asset.images?.[0] || asset.image || "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80"}
                                                                alt={asset.title}
                                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                            />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                                            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                                                                <span className="px-3 py-1 bg-primary text-white text-[8px] font-black uppercase tracking-widest rounded-lg flex items-center shadow-lg border border-primary/20">
                                                                    <Star size={10} className="mr-1 fill-white" />
                                                                    Exclusiva
                                                                </span>
                                                                <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-foreground text-[8px] font-black uppercase tracking-widest rounded-lg border border-white/20 shadow-lg">
                                                                    {asset.status || 'Disponible'}
                                                                </span>
                                                            </div>
                                                            <div className="absolute top-4 right-4">
                                                                <span className="px-3 py-1 bg-primary/20 backdrop-blur-md text-primary text-[8px] font-black uppercase tracking-widest rounded-lg border border-primary/20">
                                                                    {asset.type || 'Piso'}
                                                                </span>
                                                            </div>

                                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity">
                                                                <Building size={80} className="text-white drop-shadow-2xl" />
                                                            </div>
                                                        </div>

                                                        <div className="p-8 flex-1 flex flex-col">
                                                            <div className="mb-6">
                                                                <h4 className="text-lg font-serif font-bold text-foreground leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2 uppercase">
                                                                    {asset.title}
                                                                </h4>
                                                                <div className="flex items-center text-[10px] text-muted-foreground uppercase tracking-widest font-black">
                                                                    <MapPin size={12} className="mr-2 text-primary/40" />
                                                                    {asset.address}
                                                                </div>
                                                            </div>

                                                            <div className="space-y-4 mb-8 flex-1">
                                                                <div className="flex items-baseline space-x-2">
                                                                    <span className="text-2xl font-serif font-bold text-primary">
                                                                        €{Number(asset.price).toLocaleString()}
                                                                    </span>
                                                                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Base</span>
                                                                </div>

                                                                <div className="grid grid-cols-3 gap-2 py-4 border-y border-border/30">
                                                                    <div className="flex flex-col items-center text-center">
                                                                        <Maximize2 size={14} className="text-primary/40 mb-1" />
                                                                        <span className="text-[10px] font-bold text-foreground">{asset.meters || 0}m²</span>
                                                                        <span className="text-[7px] text-muted-foreground uppercase tracking-widest font-black">Sup</span>
                                                                    </div>
                                                                    <div className="flex flex-col items-center text-center">
                                                                        <Bed size={14} className="text-primary/40 mb-1" />
                                                                        <span className="text-[10px] font-bold text-foreground">{asset.rooms || 0}</span>
                                                                        <span className="text-[7px] text-muted-foreground uppercase tracking-widest font-black">Hab</span>
                                                                    </div>
                                                                    <div className="flex flex-col items-center text-center">
                                                                        <Bath size={14} className="text-primary/40 mb-1" />
                                                                        <span className="text-[10px] font-bold text-foreground">{asset.bathrooms || 0}</span>
                                                                        <span className="text-[7px] text-muted-foreground uppercase tracking-widest font-black">Baños</span>
                                                                    </div>
                                                                </div>

                                                                <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2 italic font-light">
                                                                    {asset.description || "Un activo exclusivo con gran potencial de rentabilidad y ubicación estratégica."}
                                                                </p>
                                                            </div>

                                                            <div className="flex items-center gap-2 pt-6">
                                                                <div className="flex-1 bg-muted/40 hover:bg-primary/5 p-3 rounded-xl border border-border/60 hover:border-primary/20 transition-all flex items-center justify-center">
                                                                    <Search size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                                                                </div>

                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); /* logic for edit */ }}
                                                                    className="flex-1 bg-muted/40 hover:bg-foreground/5 p-3 rounded-xl border border-border/60 hover:border-foreground/20 transition-all flex items-center justify-center"
                                                                >
                                                                    <Edit2 size={16} className="text-muted-foreground" />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleDeleteProperty(asset.id); }}
                                                                    className="flex-1 bg-muted/40 hover:bg-red-50 p-3 rounded-xl border border-border/60 hover:border-red-200 transition-all flex items-center justify-center"
                                                                >
                                                                    <Trash2 size={16} className="text-muted-foreground hover:text-red-500" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
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

                                    {activeTab === "intelligence" && (
                                        <ValuationAgent />
                                    )}

                                    {activeTab === "audit" && (
                                        <div className="max-w-4xl mx-auto w-full space-y-6 mt-10">
                                            <div className="bg-card border border-border rounded-[2.5rem] shadow-sm p-10">
                                                <h2 className="font-serif text-xl font-medium mb-8">System Audit Trail</h2>
                                                <div className="space-y-6">
                                                    {MOCK_ACTIVITY.map((log: any) => (
                                                        <div key={log.id} className="flex space-x-6 items-start">
                                                            <div className="mt-1 p-2 bg-primary/5 rounded-xl text-primary">
                                                                <CheckCircle2 size={16} />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold leading-tight">{log.detail}</p>
                                                                <p className="text-xs text-muted-foreground mt-2 font-medium">{log.time} — Operativa Validada</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === "agents" && (
                                        <div className="max-w-4xl mx-auto w-full space-y-6 mt-10 pb-20">
                                            <div className="bg-card border border-border rounded-[2.5rem] shadow-sm p-10">
                                                <div className="flex justify-between items-center mb-8">
                                                    <div>
                                                        <h2 className="font-serif text-xl font-medium">Control de Agentes</h2>
                                                        <p className="text-xs text-muted-foreground mt-1">Gestión de accesos y roles del equipo.</p>
                                                    </div>
                                                    <div className="flex items-center space-x-4">
                                                        <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase tracking-widest">
                                                            {allAgents.filter(a => !a.is_approved).length} Pendientes
                                                        </span>
                                                        <button
                                                            onClick={() => setIsAddingAgent(true)}
                                                            className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all"
                                                        >
                                                            <Plus size={14} />
                                                            <span>Dar de Alta</span>
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    {allAgents.map(agent => (
                                                        <div key={agent.id} className="p-6 border border-border rounded-3xl flex items-center justify-between hover:bg-muted/30 transition-all group">
                                                            <div className="flex items-center space-x-4">
                                                                <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary font-serif border border-primary/10">
                                                                    {agent.full_name?.charAt(0) || 'A'}
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center space-x-2">
                                                                        <p className="text-sm font-bold">{agent.full_name}</p>
                                                                        <span className={`text-[8px] ${agent.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'} px-2 py-0.5 rounded-md font-bold uppercase tracking-widest`}>
                                                                            {agent.role}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{agent.email}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center space-x-3">
                                                                <button
                                                                    onClick={() => setSelectedAgentToEdit(agent)}
                                                                    className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                                                                >
                                                                    <Edit2 size={16} />
                                                                </button>
                                                                {agent.is_approved ? (
                                                                    <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest px-4">Activo</span>
                                                                ) : (
                                                                    <>
                                                                        <button
                                                                            onClick={() => handleRejectAgent(agent.id)}
                                                                            className="px-4 py-2 border border-border rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-500/10 hover:text-red-500 transition-all"
                                                                        >
                                                                            Rechazar
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleApproveAgent(agent.id)}
                                                                            className="px-4 py-2 bg-primary text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-primary/90 transition-all font-bold"
                                                                        >
                                                                            Aprobar
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {allAgents.length === 0 && (
                                                        <div className="text-center py-12 text-muted-foreground text-xs uppercase tracking-[0.2em]">No hay agentes registrados</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <AnimatePresence>
                {selectedLead && renderLeadWorkplace(selectedLead)}
                {selectedProperty && (
                    <div key="property-modal" className="fixed inset-0 z-[60] bg-background overscroll-none overflow-y-auto">
                        {renderPropertyDetail(selectedProperty)}
                    </div>
                )}

                {/* Edit Agent Modal */}
                {selectedAgentToEdit && (
                    <div key="edit-agent-modal" className="fixed inset-0 z-[80] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedAgentToEdit(null)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative bg-card border border-border w-full max-w-lg rounded-[2.5rem] shadow-2xl p-10"
                        >
                            <h2 className="font-serif text-2xl mb-2">Editar Agente</h2>
                            <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-8 italic">Modificando perfil de {selectedAgentToEdit.full_name}</p>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Nombre Completo</label>
                                    <input
                                        type="text"
                                        value={selectedAgentToEdit.full_name || ""}
                                        onChange={(e) => setSelectedAgentToEdit({ ...selectedAgentToEdit, full_name: e.target.value })}
                                        className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Rol en el Sistema</label>
                                    <select
                                        value={selectedAgentToEdit.role || "agent"}
                                        onChange={(e) => setSelectedAgentToEdit({ ...selectedAgentToEdit, role: e.target.value })}
                                        className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all appearance-none"
                                    >
                                        <option value="agent">Agente</option>
                                        <option value="admin">Administrador</option>
                                    </select>
                                </div>
                                <div className="flex items-center space-x-3 p-2">
                                    <input
                                        type="checkbox"
                                        id="edit-approved"
                                        checked={selectedAgentToEdit.is_approved}
                                        onChange={(e) => setSelectedAgentToEdit({ ...selectedAgentToEdit, is_approved: e.target.checked })}
                                        className="accent-primary"
                                    />
                                    <label htmlFor="edit-approved" className="text-xs font-bold uppercase tracking-wider cursor-pointer">Estado de Acceso: {selectedAgentToEdit.is_approved ? 'Aprobado' : 'Pendiente'}</label>
                                </div>
                            </div>

                            <div className="flex gap-4 mt-10">
                                <button
                                    onClick={() => setSelectedAgentToEdit(null)}
                                    className="flex-1 px-6 py-3 border border-border rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-muted transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => handleUpdateAgent(selectedAgentToEdit)}
                                    className="flex-1 px-6 py-3 bg-primary text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:opacity-90 shadow-lg shadow-primary/20 transition-all"
                                >
                                    Guardar Cambios
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Add Agent Modal */}
                {isAddingAgent && (
                    <div key="add-agent-modal" className="fixed inset-0 z-[80] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAddingAgent(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative bg-card border border-border w-full max-w-lg rounded-[2.5rem] shadow-2xl p-10"
                        >
                            <h2 className="font-serif text-2xl mb-2">Dar de Alta Agente</h2>
                            <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-8 italic">Registro manual de nuevo miembro del equipo</p>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Nombre Completo</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Alberto Gala"
                                        value={agentForm.full_name}
                                        onChange={(e) => setAgentForm({ ...agentForm, full_name: e.target.value })}
                                        className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Email Profesional</label>
                                    <input
                                        type="email"
                                        placeholder="correo@aleasignature.com"
                                        value={agentForm.email}
                                        onChange={(e) => setAgentForm({ ...agentForm, email: e.target.value })}
                                        className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Rol Asignado</label>
                                    <select
                                        value={agentForm.role}
                                        onChange={(e) => setAgentForm({ ...agentForm, role: e.target.value })}
                                        className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all appearance-none"
                                    >
                                        <option value="agent">Agente</option>
                                        <option value="admin">Administrador</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-4 mt-10">
                                <button
                                    onClick={() => setIsAddingAgent(false)}
                                    className="flex-1 px-6 py-3 border border-border rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-muted transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleCreateAgent}
                                    className="flex-1 px-6 py-3 bg-primary text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:opacity-90 shadow-lg shadow-primary/20 transition-all"
                                >
                                    Confirmar Alta
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Edit Investor Modal */}
                {selectedInvestorToEdit && (
                    <div key="edit-investor-modal" className="fixed inset-0 z-[80] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedInvestorToEdit(null)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative bg-card border border-border w-full max-w-2xl rounded-[2.5rem] shadow-2xl p-10 overflow-y-auto max-h-[90vh]"
                        >
                            <h2 className="font-serif text-2xl mb-2">Editar Perfil de Inversor</h2>
                            <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-8 italic">Modificando cualificación de {selectedInvestorToEdit.full_name}</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Nombre Completo</label>
                                    <input
                                        type="text"
                                        value={selectedInvestorToEdit.full_name || ""}
                                        onChange={(e) => setSelectedInvestorToEdit({ ...selectedInvestorToEdit, full_name: e.target.value })}
                                        className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Compañía / Family Office</label>
                                    <input
                                        type="text"
                                        value={selectedInvestorToEdit.company_name || ""}
                                        onChange={(e) => setSelectedInvestorToEdit({ ...selectedInvestorToEdit, company_name: e.target.value })}
                                        className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Email de Contacto</label>
                                    <input
                                        type="email"
                                        value={selectedInvestorToEdit.email || ""}
                                        onChange={(e) => setSelectedInvestorToEdit({ ...selectedInvestorToEdit, email: e.target.value })}
                                        className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Tipo de Inversor</label>
                                    <select
                                        value={selectedInvestorToEdit.investor_type || ""}
                                        onChange={(e) => setSelectedInvestorToEdit({ ...selectedInvestorToEdit, investor_type: e.target.value })}
                                        className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium appearance-none"
                                    >
                                        <option value="HNWI">HNWI</option>
                                        <option value="Family Office">Family Office</option>
                                        <option value="Institutional">Institutional</option>
                                        <option value="Private Equity">Private Equity</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Teléfono</label>
                                    <input
                                        type="text"
                                        value={selectedInvestorToEdit.phone || ""}
                                        onChange={(e) => setSelectedInvestorToEdit({ ...selectedInvestorToEdit, phone: e.target.value })}
                                        className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Ticket Mínimo (EUR)</label>
                                    <input
                                        type="number"
                                        value={selectedInvestorToEdit.budget_min}
                                        onFocus={(e) => e.target.select()}
                                        onChange={(e) => setSelectedInvestorToEdit({ ...selectedInvestorToEdit, budget_min: Number(e.target.value) })}
                                        className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Ticket Máximo (EUR)</label>
                                    <input
                                        type="number"
                                        value={selectedInvestorToEdit.budget_max}
                                        onFocus={(e) => e.target.select()}
                                        onChange={(e) => setSelectedInvestorToEdit({ ...selectedInvestorToEdit, budget_max: Number(e.target.value) })}
                                        className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-3 px-1">Etiquetas de Inversores</label>
                                    <div className="flex flex-wrap gap-4 p-4 bg-muted/20 border border-border/40 rounded-2xl">
                                        {["Comprador", "Vendedor"].map((label) => (
                                            <label key={label} className="flex items-center space-x-3 cursor-pointer group">
                                                <div className="relative flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={(selectedInvestorToEdit.labels || []).includes(label)}
                                                        onChange={(e) => {
                                                            const currentLabels = selectedInvestorToEdit.labels || [];
                                                            const newLabels = e.target.checked
                                                                ? [...currentLabels, label]
                                                                : currentLabels.filter((l: string) => l !== label);
                                                            setSelectedInvestorToEdit({ ...selectedInvestorToEdit, labels: newLabels });
                                                        }}
                                                        className="w-5 h-5 accent-primary rounded-lg border-border"
                                                    />
                                                </div>
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/70 group-hover:text-primary transition-colors">{label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <div className="flex items-center space-x-3 p-2 bg-primary/5 rounded-2xl border border-primary/10">
                                        <input
                                            type="checkbox"
                                            id="investor-verified"
                                            checked={selectedInvestorToEdit.is_verified}
                                            onChange={(e) => setSelectedInvestorToEdit({ ...selectedInvestorToEdit, is_verified: e.target.checked })}
                                            className="accent-primary w-4 h-4"
                                        />
                                        <label htmlFor="investor-verified" className="text-xs font-bold uppercase tracking-widest cursor-pointer text-primary">Estado KYC: {selectedInvestorToEdit.is_verified ? 'VERIFICADO' : 'PENDIENTE'}</label>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 mt-10">
                                <button
                                    onClick={() => setSelectedInvestorToEdit(null)}
                                    className="flex-1 px-6 py-4 border border-border rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-muted transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => handleUpdateInvestor(selectedInvestorToEdit)}
                                    className="flex-1 px-6 py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-90 shadow-xl shadow-primary/20 transition-all"
                                >
                                    Guardar Cualificación
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
                {/* Add Property Suggestion Modal */}
                {isReviewingPropertySuggestion && (
                    <div key="add-property-suggestion-modal" className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onClick={() => setIsReviewingPropertySuggestion(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="relative bg-background border border-border w-full max-w-4xl rounded-[2.5rem] p-10 shadow-2xl overflow-y-auto max-h-[90vh]"
                        >
                            <h2 className="font-serif text-3xl mb-2 flex items-center">
                                <Sparkles size={28} className="mr-3 text-primary" />
                                Revisar Alta de Activo - Alea Intelligence
                            </h2>
                            <p className="text-muted-foreground text-sm mb-8 font-light">
                                Confirme o modifique la información extraída automáticamente antes de registrar el activo en el sistema.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="md:col-span-2">
                                    <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Título del Activo</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Hotel Boutique en Centro"
                                        value={propertyForm.title}
                                        onChange={(e) => setPropertyForm({ ...propertyForm, title: e.target.value })}
                                        className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Descripción / Resumen IAI</label>
                                    <textarea
                                        placeholder="Descripción extraída del email..."
                                        value={propertyForm.description}
                                        onChange={(e) => setPropertyForm({ ...propertyForm, description: e.target.value })}
                                        className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium min-h-[120px] resize-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Tipo de Activo</label>
                                    <select
                                        value={propertyForm.type}
                                        onChange={(e) => setPropertyForm({ ...propertyForm, type: e.target.value })}
                                        className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium appearance-none"
                                    >
                                        <option value="">Selecciona Tipo</option>
                                        <option value="Hotel">Hotel</option>
                                        <option value="Edificio">Edificio Residencial</option>
                                        <option value="Suelo">Suelo / Parcela</option>
                                        <option value="Retail">Local Comercial / Retail</option>
                                        <option value="Oficinas">Oficinas</option>
                                        <option value="Logístico">Logística</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Precio Propuesto (€)</label>
                                    <input
                                        type="number"
                                        placeholder="Ej: 15000000"
                                        value={propertyForm.price || ""}
                                        onChange={(e) => setPropertyForm({ ...propertyForm, price: Number(e.target.value) })}
                                        className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Superficie Total (m²)</label>
                                    <input
                                        type="number"
                                        placeholder="Ej: 2500"
                                        value={propertyForm.meters || ""}
                                        onChange={(e) => setPropertyForm({ ...propertyForm, meters: Number(e.target.value) })}
                                        className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Ubicación</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Madrid, España"
                                        value={propertyForm.address}
                                        onChange={(e) => setPropertyForm({ ...propertyForm, address: e.target.value })}
                                        className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Vendedor / Referencia</label>
                                    <input
                                        type="text"
                                        placeholder="Nombre del Vendedor"
                                        value={propertyForm.vendor_name}
                                        onChange={(e) => setPropertyForm({ ...propertyForm, vendor_name: e.target.value })}
                                        className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                                    />
                                </div>
                            </div>

                            <div className="flex bg-primary/5 border border-primary/20 rounded-2xl p-6 items-center mb-8">
                                <Upload size={24} className="text-primary mr-4" />
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold text-foreground mb-1">Dossier / PDF del Activo</h4>
                                    <p className="text-xs text-muted-foreground mt-1 font-medium">Sube ahora el PDF original del correo para procesarlo y guardarlo de forma segura.</p>
                                </div>
                                <input type="file" className="block w-full max-w-xs text-xs text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:uppercase file:tracking-widest file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer transition-all" />
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-border">
                                <button
                                    onClick={() => setIsReviewingPropertySuggestion(false)}
                                    className="px-6 py-3 text-muted-foreground hover:bg-muted rounded-2xl text-[10px] uppercase tracking-widest font-black transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSubmitPropertySuggestion}
                                    className="px-8 py-3 bg-foreground text-background hover:scale-[1.02] shadow-xl rounded-2xl text-[10px] uppercase tracking-widest font-black transition-all flex items-center"
                                >
                                    <CheckCircle2 size={16} className="mr-2" />
                                    Confirmar y Crear Ficha
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
                {/* Add Investor Modal */}
                {isAddingInvestor && (
                    <div key="add-investor-modal" className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onClick={() => setIsAddingInvestor(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="relative bg-background border border-border w-full max-w-2xl rounded-[2.5rem] p-10 shadow-2xl overflow-y-auto max-h-[90vh]"
                        >
                            <h2 className="font-serif text-3xl mb-2">Alta de Nuevo Inversor</h2>
                            <p className="text-muted-foreground text-sm mb-8 font-light">Complete los datos para añadir al directorio confidencial.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Nombre Completo</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Eduardo Santacruz"
                                        value={investorForm.full_name}
                                        onChange={(e) => setInvestorForm({ ...investorForm, full_name: e.target.value })}
                                        className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Email Profesional</label>
                                    <input
                                        type="email"
                                        placeholder="eduardo@familyoffice.com"
                                        value={investorForm.email}
                                        onChange={(e) => setInvestorForm({ ...investorForm, email: e.target.value })}
                                        className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Compañía / Entidad</label>
                                    <input
                                        type="text"
                                        placeholder="Family Office ES"
                                        value={investorForm.company_name}
                                        onChange={(e) => setInvestorForm({ ...investorForm, company_name: e.target.value })}
                                        className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Perfil Inversor</label>
                                    <select
                                        value={investorForm.investor_type}
                                        onChange={(e) => setInvestorForm({ ...investorForm, investor_type: e.target.value })}
                                        className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium appearance-none"
                                    >
                                        <option value="">Seleccionar Perfil</option>
                                        <option value="HNWI">HNWI</option>
                                        <option value="Family Office">Family Office</option>
                                        <option value="Institutional">Institutional</option>
                                        <option value="Private Equity">Private Equity</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Teléfono</label>
                                    <input
                                        type="text"
                                        placeholder="+34 600 000 000"
                                        value={investorForm.phone}
                                        onChange={(e) => setInvestorForm({ ...investorForm, phone: e.target.value })}
                                        className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Ticket Mínimo (€)</label>
                                    <input
                                        type="number"
                                        value={investorForm.budget_min}
                                        onFocus={(e) => e.target.select()}
                                        onChange={(e) => setInvestorForm({ ...investorForm, budget_min: Number(e.target.value) })}
                                        className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Ticket Máximo (€)</label>
                                    <input
                                        type="number"
                                        value={investorForm.budget_max}
                                        onFocus={(e) => e.target.select()}
                                        onChange={(e) => setInvestorForm({ ...investorForm, budget_max: Number(e.target.value) })}
                                        className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-3 px-1">Etiquetas</label>
                                    <div className="flex flex-wrap gap-4 p-4 bg-muted/20 border border-border/40 rounded-2xl">
                                        {["Comprador", "Vendedor"].map((label) => (
                                            <label key={label} className="flex items-center space-x-3 cursor-pointer group">
                                                <div className="relative flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={(investorForm.labels || []).includes(label)}
                                                        onChange={(e) => {
                                                            const currentLabels = investorForm.labels || [];
                                                            const newLabels = e.target.checked
                                                                ? [...currentLabels, label]
                                                                : currentLabels.filter((l: string) => l !== label);
                                                            setInvestorForm({ ...investorForm, labels: newLabels });
                                                        }}
                                                        className="w-5 h-5 accent-primary rounded-lg border-border"
                                                    />
                                                </div>
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/70 group-hover:text-primary transition-colors">{label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 mt-10">
                                <button
                                    onClick={() => setIsAddingInvestor(false)}
                                    className="flex-1 px-6 py-4 border border-border rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-muted transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleCreateInvestor}
                                    className="flex-1 px-6 py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-90 shadow-xl shadow-primary/20 transition-all"
                                >
                                    Dar de Alta
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Add/Edit Mandatario Modal */}
                {(isAddingMandatario || selectedMandatarioToEdit) && (
                    <div key="add-mandatario-modal" className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onClick={() => { setIsAddingMandatario(false); setSelectedMandatarioToEdit(null); setMandatarioForm({ full_name: '', company_name: '', email: '', phone: '', mandatario_type: '', labels: [] }); }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="relative bg-background border border-border w-full max-w-xl rounded-[2.5rem] p-10 shadow-2xl overflow-y-auto max-h-[90vh]"
                        >
                            <h2 className="font-serif text-3xl mb-2">{selectedMandatarioToEdit ? 'Editar Mandatario' : 'Nuevo Mandatario'}</h2>
                            <p className="text-muted-foreground text-sm mb-8 font-light">{selectedMandatarioToEdit ? 'Modifica los datos del mandatario.' : 'Representantes y agentes de confianza.'}</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Nombre Completo</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Marc Planas"
                                        value={mandatarioForm.full_name}
                                        onChange={(e) => setMandatarioForm({ ...mandatarioForm, full_name: e.target.value })}
                                        className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Tipo de Mandatario</label>
                                    <select
                                        value={mandatarioForm.mandatario_type}
                                        onChange={(e) => setMandatarioForm({ ...mandatarioForm, mandatario_type: e.target.value })}
                                        className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                                    >
                                        <option value="">Seleccionar Tipo</option>
                                        <option value="Fiduciario">Fiduciario</option>
                                        <option value="Agente de Representación">Agente de Representación</option>
                                        <option value="Legal Representative">Legal Representative</option>
                                        <option value="Asesor Directo">Asesor Directo</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Email</label>
                                    <input
                                        type="email"
                                        placeholder="marc@office.com"
                                        value={mandatarioForm.email}
                                        onChange={(e) => setMandatarioForm({ ...mandatarioForm, email: e.target.value })}
                                        className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Compañía</label>
                                    <input
                                        type="text"
                                        placeholder="MP Associates"
                                        value={mandatarioForm.company_name}
                                        onChange={(e) => setMandatarioForm({ ...mandatarioForm, company_name: e.target.value })}
                                        className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Teléfono</label>
                                    <input
                                        type="text"
                                        placeholder="+34 ..."
                                        value={mandatarioForm.phone}
                                        onChange={(e) => setMandatarioForm({ ...mandatarioForm, phone: e.target.value })}
                                        className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 mt-10">
                                <button
                                    onClick={() => { setIsAddingMandatario(false); setSelectedMandatarioToEdit(null); setMandatarioForm({ full_name: '', company_name: '', email: '', phone: '', mandatario_type: '', labels: [] }); }}
                                    className="flex-1 px-6 py-4 border border-border rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-muted transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => {
                                        if (selectedMandatarioToEdit) {
                                            handleUpdateMandatario({ ...mandatarioForm, id: selectedMandatarioToEdit.id });
                                        } else {
                                            handleCreateMandatario();
                                        }
                                    }}
                                    className="flex-1 px-6 py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-90 shadow-xl shadow-primary/20 transition-all"
                                >
                                    {selectedMandatarioToEdit ? 'Guardar Cambios' : 'Guardar Mandatario'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Add/Edit Collaborator Modal */}
                {(isAddingCollaborator || editingCollaborator) && (
                    <div key="edit-mandatario-modal" className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onClick={() => { setIsAddingCollaborator(false); setEditingCollaborator(null); setCollaboratorForm({ full_name: '', company_name: '', email: '', phone: '', specialty: '' }); }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="relative bg-background border border-border w-full max-w-xl rounded-[2.5rem] p-10 shadow-2xl overflow-y-auto max-h-[90vh]"
                        >
                            <h2 className="font-serif text-3xl mb-2">{editingCollaborator ? 'Editar Colaborador' : 'Nuevo Colaborador'}</h2>
                            <p className="text-muted-foreground text-sm mb-8 font-light">{editingCollaborator ? 'Modifica los datos del colaborador.' : 'Intermediarios, arquitectos o asesores legales externos.'}</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Nombre Completo</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Marc Planas"
                                        value={collaboratorForm.full_name}
                                        onChange={(e) => setCollaboratorForm({ ...collaboratorForm, full_name: e.target.value })}
                                        className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Especialidad</label>
                                    <select
                                        value={collaboratorForm.specialty}
                                        onChange={(e) => setCollaboratorForm({ ...collaboratorForm, specialty: e.target.value })}
                                        className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                                    >
                                        <option value="">Seleccionar Tipo</option>
                                        <option value="Broker Inmobiliario">Broker Inmobiliario</option>
                                        <option value="Arquitecto">Arquitecto</option>
                                        <option value="Asesor Legal">Asesor Legal</option>
                                        <option value="Project Manager">Project Manager</option>
                                        <option value="Mandatario">Mandatario</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Compañía</label>
                                    <input
                                        type="text"
                                        placeholder="Luxury Group Barcelona"
                                        value={collaboratorForm.company_name}
                                        onChange={(e) => setCollaboratorForm({ ...collaboratorForm, company_name: e.target.value })}
                                        className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Email</label>
                                    <input
                                        type="email"
                                        placeholder="marc@luxurygroup.com"
                                        value={collaboratorForm.email}
                                        onChange={(e) => setCollaboratorForm({ ...collaboratorForm, email: e.target.value })}
                                        className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2 px-1">Teléfono</label>
                                    <input
                                        type="text"
                                        placeholder="+34 670 000 000"
                                        value={collaboratorForm.phone}
                                        onChange={(e) => setCollaboratorForm({ ...collaboratorForm, phone: e.target.value })}
                                        className="w-full bg-muted/30 border border-border/60 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 mt-10">
                                <button
                                    onClick={() => { setIsAddingCollaborator(false); setEditingCollaborator(null); setCollaboratorForm({ full_name: '', company_name: '', email: '', phone: '', specialty: '' }); }}
                                    className="flex-1 px-6 py-4 border border-border rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-muted transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={editingCollaborator ? handleUpdateCollaborator : handleCreateCollaborator}
                                    className="flex-1 px-6 py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-90 shadow-xl shadow-primary/20 transition-all"
                                >
                                    {editingCollaborator ? 'Guardar Cambios' : 'Registrar'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Select Investor for Opportunity Modal */}
                {isSelectingInvestorForLead && (
                    <div key="add-collab-modal" className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onClick={() => setIsSelectingInvestorForLead(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="relative bg-background border border-border w-full max-w-xl rounded-[2.5rem] p-10 shadow-2xl overflow-hidden"
                        >
                            <h2 className="font-serif text-2xl mb-2">Asignar Inversor</h2>
                            <p className="text-muted-foreground text-xs uppercase tracking-widest font-bold mb-6">Vincular propiedad a un potencial comprador</p>

                            {/* Search Bar */}
                            <div className="relative mb-6">
                                <div className="absolute inset-y-0 left-4 flex items-center text-muted-foreground pointer-events-none">
                                    <Search size={16} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre o empresa..."
                                    value={investorAssignSearch}
                                    onChange={(e) => setInvestorAssignSearch(e.target.value)}
                                    className="w-full bg-muted/40 border border-border/60 rounded-xl py-3 pl-12 pr-4 text-xs focus:outline-none focus:border-primary/50 transition-all font-medium"
                                />
                            </div>

                            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-4 custom-scrollbar">
                                {investors
                                    .filter((inv: any) =>
                                        inv.full_name?.toLowerCase().includes(investorAssignSearch.toLowerCase()) ||
                                        inv.company_name?.toLowerCase().includes(investorAssignSearch.toLowerCase())
                                    )
                                    .map((inv: any) => (
                                        <button
                                            key={inv.id}
                                            onClick={() => {
                                                handleCreateLead(inv.id, targetPropertyForLead?.id);
                                                setInvestorAssignSearch(""); // Reset search on select
                                            }}
                                            className="w-full text-left p-4 rounded-2xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group flex items-center justify-between"
                                        >
                                            <div>
                                                <p className="font-bold text-sm group-hover:text-primary transition-colors">{inv.full_name}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">{inv.company_name || 'Individual'}</p>
                                            </div>
                                            <ArrowUpRight size={16} className="text-muted-foreground group-hover:text-primary transition-all" />
                                        </button>
                                    ))}
                                {investors.length > 0 && investors.filter((inv: any) =>
                                    inv.full_name?.toLowerCase().includes(investorAssignSearch.toLowerCase()) ||
                                    inv.company_name?.toLowerCase().includes(investorAssignSearch.toLowerCase())
                                ).length === 0 && (
                                        <div className="text-center py-12 text-muted-foreground text-xs uppercase tracking-widest">No hay resultados para esta búsqueda</div>
                                    )}
                                {investors.length === 0 && (
                                    <div className="text-center py-12 text-muted-foreground text-xs uppercase tracking-widest">No hay inversores registrados</div>
                                )}
                            </div>

                            <button
                                onClick={() => setIsSelectingInvestorForLead(false)}
                                className="w-full mt-8 py-4 border border-border rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-muted transition-all"
                            >
                                Cancelar
                            </button>
                        </motion.div>
                    </div>
                )}
                {/* Global Opportunity Creation Modal */}
                {isCreatingGlobalLead && (
                    <div key="edit-collab-modal" className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onClick={() => {
                                setIsCreatingGlobalLead(false);
                                setAssetSearch("");
                                setInvestorAssignSearch("");
                            }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="relative bg-background border border-border w-full max-w-xl rounded-[2.5rem] p-10 shadow-2xl overflow-hidden"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="font-serif text-2xl">Generar Nueva Oportunidad</h2>
                                <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full">
                                    Paso {stepInGlobalLead} de 2
                                </span>
                            </div>
                            <p className="text-muted-foreground text-xs uppercase tracking-widest font-bold mb-8">
                                {stepInGlobalLead === 1 ? "Selecciona el activo para la operación" : "Selecciona el inversor interesado"}
                            </p>

                            {stepInGlobalLead === 1 ? (
                                <>
                                    <div className="relative mb-6">
                                        <div className="absolute inset-y-0 left-4 flex items-center text-muted-foreground pointer-events-none">
                                            <Search size={16} />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Buscar activo por título o dirección..."
                                            value={assetSearch}
                                            onChange={(e) => setAssetSearch(e.target.value)}
                                            className="w-full bg-muted/40 border border-border/60 rounded-xl py-3 pl-12 pr-4 text-xs focus:outline-none focus:border-primary/50 transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-4 custom-scrollbar">
                                        {properties
                                            .filter(p => !assetSearch ||
                                                p.title?.toLowerCase().includes(assetSearch.toLowerCase()) ||
                                                p.address?.toLowerCase().includes(assetSearch.toLowerCase())
                                            )
                                            .map((p: any) => (
                                                <button
                                                    key={p.id}
                                                    onClick={() => {
                                                        setTargetPropertyForLead(p);
                                                        setStepInGlobalLead(2);
                                                    }}
                                                    className="w-full text-left p-4 rounded-2xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group flex items-start space-x-4"
                                                >
                                                    <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden shrink-0">
                                                        <img src={p.images?.[0] || "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80"} className="w-full h-full object-cover" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm group-hover:text-primary transition-colors line-clamp-1">{p.title}</p>
                                                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">{p.address}</p>
                                                    </div>
                                                </button>
                                            ))}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="relative mb-6">
                                        <div className="absolute inset-y-0 left-4 flex items-center text-muted-foreground pointer-events-none">
                                            <Search size={16} />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Buscar inversor..."
                                            value={investorAssignSearch}
                                            onChange={(e) => setInvestorAssignSearch(e.target.value)}
                                            className="w-full bg-muted/40 border border-border/60 rounded-xl py-3 pl-12 pr-4 text-xs focus:outline-none focus:border-primary/50 transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-4 custom-scrollbar">
                                        {investors
                                            .filter(inv => !investorAssignSearch ||
                                                inv.full_name?.toLowerCase().includes(investorAssignSearch.toLowerCase()) ||
                                                inv.company_name?.toLowerCase().includes(investorAssignSearch.toLowerCase())
                                            )
                                            .map((inv: any) => (
                                                <button
                                                    key={inv.id}
                                                    onClick={() => {
                                                        handleCreateLead(inv.id, targetPropertyForLead?.id);
                                                        setIsCreatingGlobalLead(false);
                                                        setAssetSearch("");
                                                        setInvestorAssignSearch("");
                                                    }}
                                                    className="w-full text-left p-4 rounded-2xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group flex items-center justify-between"
                                                >
                                                    <div>
                                                        <p className="font-bold text-sm group-hover:text-primary transition-colors">{inv.full_name}</p>
                                                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">{inv.company_name || 'Individual'}</p>
                                                    </div>
                                                    <ArrowUpRight size={16} className="text-muted-foreground group-hover:text-primary transition-all" />
                                                </button>
                                            ))}
                                    </div>
                                    <button
                                        onClick={() => setStepInGlobalLead(1)}
                                        className="mt-4 text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                                    >
                                        ← Volver a seleccionar activo
                                    </button>
                                </>
                            )}

                            <button
                                onClick={() => {
                                    setIsCreatingGlobalLead(false);
                                    setAssetSearch("");
                                    setInvestorAssignSearch("");
                                }}
                                className="w-full mt-8 py-4 border border-border rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-muted transition-all"
                            >
                                Cancelar
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    );
}
