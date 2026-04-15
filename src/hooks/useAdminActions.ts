"use client";

import { useCallback } from "react";
import { insforge } from "@/lib/insforge-client";
import { useAdmin } from "@/contexts/AdminContext";

export function useAdminActions() {
    const {
        leads,
        setLeads,
        investors,
        setInvestors,
        properties,
        setProperties,
        showToastMessage,
    } = useAdmin();

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

    const createLead = useCallback(async (investorId: string, propertyId: string) => {
        try {
            const { data, error } = await insforge.database
                .from("leads")
                .insert({
                    investor_id: investorId,
                    property_id: propertyId,
                    status: "prospect",
                })
                .select()
                .single();

            if (!error && data) {
                setLeads((prev: any[]) => [data, ...prev]);
                showToastMessage("Lead creado correctamente");
                return data;
            }
        } catch (err) {
            console.error("Error creating lead:", err);
        }
        return null;
    }, [setLeads, showToastMessage]);

    const updateLeadStatus = useCallback(async (leadId: string, status: string) => {
        try {
            const { data, error } = await insforge.database
                .from("leads")
                .update({ status, updated_at: new Date().toISOString() })
                .eq("id", leadId)
                .select()
                .single();

            if (!error && data) {
                setLeads((prev: any[]) =>
                    prev.map((l: any) => (l.id === leadId ? data : l))
                );
                showToastMessage("Lead actualizado");
                return data;
            }
        } catch (err) {
            console.error("Error updating lead:", err);
        }
        return null;
    }, [setLeads, showToastMessage]);

    const deleteLead = useCallback(async (leadId: string) => {
        try {
            const { error } = await insforge.database
                .from("leads")
                .delete()
                .eq("id", leadId);

            if (!error) {
                setLeads((prev: any[]) => prev.filter((l: any) => l.id !== leadId));
                showToastMessage("Lead eliminado", "success");
                return true;
            }
        } catch (err) {
            console.error("Error deleting lead:", err);
        }
        return false;
    }, [setLeads, showToastMessage]);

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

    const createInvestor = useCallback(async (investorData: any) => {
        try {
            const { data, error } = await insforge.database
                .from("investors")
                .insert(investorData)
                .select()
                .single();

            if (!error && data) {
                setInvestors((prev: any[]) => [data, ...prev]);
                showToastMessage("Inversor creado correctamente");
                return data;
            }
        } catch (err) {
            console.error("Error creating investor:", err);
        }
        return null;
    }, [setInvestors, showToastMessage]);

    const updateInvestor = useCallback(async (id: string, updates: any) => {
        try {
            const { data, error } = await insforge.database
                .from("investors")
                .update(updates)
                .eq("id", id)
                .select()
                .single();

            if (!error && data) {
                setInvestors((prev: any[]) =>
                    prev.map((inv: any) => (inv.id === id ? data : inv))
                );
                showToastMessage("Inversor actualizado");
                return data;
            }
        } catch (err) {
            console.error("Error updating investor:", err);
        }
        return null;
    }, [setInvestors, showToastMessage]);

    const deleteInvestor = useCallback(async (id: string) => {
        try {
            const { error } = await insforge.database
                .from("investors")
                .delete()
                .eq("id", id);

            if (!error) {
                setInvestors((prev: any[]) => prev.filter((inv: any) => inv.id !== id));
                showToastMessage("Inversor eliminado");
                return true;
            }
        } catch (err) {
            console.error("Error deleting investor:", err);
        }
        return false;
    }, [setInvestors, showToastMessage]);

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

    const createProperty = useCallback(async (propertyData: any) => {
        try {
            const { data, error } = await insforge.database
                .from("properties")
                .insert(propertyData)
                .select()
                .single();

            if (!error && data) {
                setProperties((prev: any[]) => [data, ...prev]);
                showToastMessage("Propiedad creada correctamente");
                return data;
            }
        } catch (err) {
            console.error("Error creating property:", err);
        }
        return null;
    }, [setProperties, showToastMessage]);

    const updateProperty = useCallback(async (id: string, updates: any) => {
        try {
            const { data, error } = await insforge.database
                .from("properties")
                .update(updates)
                .eq("id", id)
                .select()
                .single();

            if (!error && data) {
                setProperties((prev: any[]) =>
                    prev.map((prop: any) => (prop.id === id ? data : prop))
                );
                showToastMessage("Propiedad actualizada");
                return data;
            }
        } catch (err) {
            console.error("Error updating property:", err);
        }
        return null;
    }, [setProperties, showToastMessage]);

    const deleteProperty = useCallback(async (id: string) => {
        try {
            const { error } = await insforge.database
                .from("properties")
                .delete()
                .eq("id", id);

            if (!error) {
                setProperties((prev: any[]) => prev.filter((prop: any) => prop.id !== id));
                showToastMessage("Propiedad eliminada");
                return true;
            }
        } catch (err) {
            console.error("Error deleting property:", err);
        }
        return false;
    }, [setProperties, showToastMessage]);

    return {
        fetchLeads,
        createLead,
        updateLeadStatus,
        deleteLead,
        fetchInvestors,
        createInvestor,
        updateInvestor,
        deleteInvestor,
        fetchProperties,
        createProperty,
        updateProperty,
        deleteProperty,
    };
}
