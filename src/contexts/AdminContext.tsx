"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Agent, Investor, Lead, Property, Mandatario, Collaborator, IAISuggestion, Interaction } from "@/types/admin";

interface ToastState {
    message: string;
    type: 'success' | 'error';
}

interface AdminState {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    leads: Lead[];
    setLeads: (leads: Lead[] | ((prev: Lead[]) => Lead[])) => void;
    investors: Investor[];
    setInvestors: (investors: Investor[] | ((prev: Investor[]) => Investor[])) => void;
    properties: Property[];
    setProperties: (properties: Property[] | ((prev: Property[]) => Property[])) => void;
    agents: Agent[];
    setAgents: (agents: Agent[] | ((prev: Agent[]) => Agent[])) => void;
    currentUser: any;
    setCurrentUser: (user: any) => void;
    selectedLead: Lead | null;
    setSelectedLead: (lead: Lead | null) => void;
    selectedProperty: Property | null;
    setSelectedProperty: (property: Property | null) => void;
    selectedInvestor: Investor | null;
    setSelectedInvestor: (investor: Investor | null) => void;
    draggingId: string | null;
    setDraggingId: (id: string | null) => void;
    showToast: boolean;
    toast: ToastState;
    showToastMessage: (message: string, type?: 'success' | 'error') => void;
    hideToast: () => void;
    isInitialLoading: boolean;
    setIsInitialLoading: (loading: boolean) => void;
    mandatarios: Mandatario[];
    setMandatarios: (mandatarios: Mandatario[] | ((prev: Mandatario[]) => Mandatario[])) => void;
    collaborators: Collaborator[];
    setCollaborators: (collaborators: Collaborator[] | ((prev: Collaborator[]) => Collaborator[])) => void;
    iaiSuggestions: IAISuggestion[];
    setIaiSuggestions: (suggestions: IAISuggestion[] | ((prev: IAISuggestion[]) => IAISuggestion[])) => void;
    interactions: Interaction[];
    setInteractions: (interactions: Interaction[] | ((prev: Interaction[]) => Interaction[])) => void;
}

const AdminContext = createContext<AdminState | null>(null);

export function useAdmin() {
    const context = useContext(AdminContext);
    if (!context) {
        console.warn("useAdmin must be used within AdminProvider, returning defaults");
        return {
            activeTab: "crm",
            setActiveTab: () => {},
            leads: [],
            setLeads: () => {},
            investors: [],
            setInvestors: () => {},
            properties: [],
            setProperties: () => {},
            agents: [],
            setAgents: () => {},
            currentUser: null,
            setCurrentUser: () => {},
            selectedLead: null,
            setSelectedLead: () => {},
            selectedProperty: null,
            setSelectedProperty: () => {},
            selectedInvestor: null,
            setSelectedInvestor: () => {},
            draggingId: null,
            setDraggingId: () => {},
            showToast: false,
            toast: { message: '', type: 'success' },
            showToastMessage: () => {},
            hideToast: () => {},
            isInitialLoading: true,
            setIsInitialLoading: () => {},
            mandatarios: [],
            setMandatarios: () => {},
            collaborators: [],
            setCollaborators: () => {},
            iaiSuggestions: [],
            setIaiSuggestions: () => {},
            interactions: [],
            setInteractions: () => {},
        } as AdminState;
    }
    return context;
}

interface AdminProviderProps {
    children: ReactNode;
}

export function AdminProvider({ children }: AdminProviderProps) {
    const [activeTab, setActiveTab] = useState<string>("crm");
    const [leads, setLeads] = useState<Lead[]>([]);
    const [investors, setInvestors] = useState<Investor[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [showToast, setShowToast] = useState(false);
    const [toast, setToast] = useState<ToastState>({ message: '', type: 'success' });
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [mandatarios, setMandatarios] = useState<Mandatario[]>([]);
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [iaiSuggestions, setIaiSuggestions] = useState<IAISuggestion[]>([]);
    const [interactions, setInteractions] = useState<Interaction[]>([]);

    const showToastMessage = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setShowToast(true);
        setTimeout(() => setShowToast(false), type === 'error' ? 5000 : 3000);
    }, []);

    const hideToast = useCallback(() => {
        setShowToast(false);
    }, []);

    const value: AdminState = {
        activeTab,
        setActiveTab,
        leads,
        setLeads,
        investors,
        setInvestors,
        properties,
        setProperties,
        agents,
        setAgents,
        currentUser,
        setCurrentUser,
        selectedLead,
        setSelectedLead,
        selectedProperty,
        setSelectedProperty,
        selectedInvestor,
        setSelectedInvestor,
        draggingId,
        setDraggingId,
        showToast,
        toast,
        showToastMessage,
        hideToast,
        isInitialLoading,
        setIsInitialLoading,
        mandatarios,
        setMandatarios,
        collaborators,
        setCollaborators,
        iaiSuggestions,
        setIaiSuggestions,
        interactions,
        setInteractions,
    };

    return (
        <AdminContext.Provider value={value}>
            {children}
        </AdminContext.Provider>
    );
}
