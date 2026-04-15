"use client";

import { useCallback } from "react";
import { insforge } from "@/lib/insforge-client";
import { useAdmin } from "@/contexts/AdminContext";

export function useAdminData() {
    const {
        setLeads,
        setInvestors,
        setProperties,
        setMandatarios,
        setCollaborators,
        setAgents,
        setIaiSuggestions,
        setCurrentUser,
        setIsInitialLoading,
        setInteractions,
    } = useAdmin();

    const fetchAll = useCallback(async () => {
        setIsInitialLoading(true);
        try {
            await Promise.all([
                fetchLeads(),
                fetchInvestors(),
                fetchProperties(),
                fetchMandatarios(),
                fetchCollaborators(),
                fetchAgents(),
                fetchCurrentUser(),
                fetchIaiSuggestions(),
                fetchInteractions(),
            ]);
        } finally {
            setIsInitialLoading(false);
        }
    }, []);

    const fetchLeads = useCallback(async () => {
        try {
            const { data, error } = await insforge.database
                .from("leads")
                .select("*, investors(*), properties(*)")
                .order("created_at", { ascending: false });

            if (!error && data) {
                setLeads(data);
            }
        } catch (err) {
            console.error("Error fetching leads:", err);
        }
    }, [setLeads]);

    const fetchInvestors = useCallback(async () => {
        try {
            const { data, error } = await insforge.database
                .from("investors")
                .select("*")
                .order("full_name");

            if (!error && data) {
                setInvestors(data);
            }
        } catch (err) {
            console.error("Error fetching investors:", err);
        }
    }, [setInvestors]);

    const fetchProperties = useCallback(async () => {
        try {
            const { data, error } = await insforge.database
                .from("properties")
                .select("*")
                .order("created_at", { ascending: false });

            if (!error && data) {
                setProperties(data);
            }
        } catch (err) {
            console.error("Error fetching properties:", err);
        }
    }, [setProperties]);

    const fetchMandatarios = useCallback(async () => {
        try {
            const { data, error } = await insforge.database
                .from("mandatarios")
                .select("*")
                .order("full_name");

            if (!error && data) {
                setMandatarios(data);
            }
        } catch (err) {
            console.error("Error fetching mandatarios:", err);
        }
    }, [setMandatarios]);

    const fetchCollaborators = useCallback(async () => {
        try {
            const { data, error } = await insforge.database
                .from("collaborators")
                .select("*")
                .order("full_name");

            if (!error && data) {
                setCollaborators(data);
            }
        } catch (err) {
            console.error("Error fetching collaborators:", err);
        }
    }, [setCollaborators]);

    const fetchAgents = useCallback(async () => {
        try {
            const { data, error } = await insforge.database
                .from("agents")
                .select("*")
                .order("full_name");

            if (!error && data) {
                setAgents(data);
            }
        } catch (err) {
            console.error("Error fetching agents:", err);
        }
    }, [setAgents]);

    const fetchCurrentUser = useCallback(async () => {
        try {
            const res = await fetch('/api/auth/me');
            if (res.ok) {
                const data = await res.json();
                if (data.user) {
                    setCurrentUser(data.user);
                }
            }
        } catch (err) {
            console.error("Error fetching current user:", err);
        }
    }, [setCurrentUser]);

    const fetchIaiSuggestions = useCallback(async () => {
        try {
            const { data, error } = await insforge.database
                .from("iai_inbox_suggestions")
                .select("*")
                .order("created_at", { ascending: false });

            if (!error && data) {
                setIaiSuggestions(data);
            }
        } catch (err) {
            console.error("Error fetching IAI suggestions:", err);
        }
    }, [setIaiSuggestions]);

    const fetchInteractions = useCallback(async () => {
        try {
            const { data, error } = await insforge.database
                .from("interactions")
                .select("*")
                .order("created_at", { ascending: false });

            if (!error && data) {
                setInteractions(data);
            }
        } catch (err) {
            console.error("Error fetching interactions:", err);
        }
    }, [setInteractions]);

    return {
        fetchAll,
        fetchLeads,
        fetchInvestors,
        fetchProperties,
        fetchMandatarios,
        fetchCollaborators,
        fetchAgents,
        fetchCurrentUser,
        fetchIaiSuggestions,
        fetchInteractions,
    };
}
