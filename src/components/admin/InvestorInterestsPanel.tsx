'use client';

import { useState, useEffect } from 'react';
import { Eye, Mail, Phone, MapPin, Building, DollarSign, Clock, Check, X, Send, Loader2 } from 'lucide-react';

interface InvestorInterest {
  id: string;
  investor_id: string;
  property_id: string | null;
  interest_type: 'property_view' | 'filter_search' | 'contact_request';
  status: string;
  filter_criteria: any;
  created_at: string;
  investor: {
    id: string;
    full_name: string;
    company_name: string;
    email: string;
    max_ticket_eur: number;
  };
  property: {
    id: string;
    title: string;
    address: string;
    asset_type: string;
    price: number;
    thumbnail_url: string;
  } | null;
}

interface InvestorInterestsPanelProps {
  onSendBlindListing?: (investorId: string, propertyIds: string[]) => void;
}

export default function InvestorInterestsPanel({ onSendBlindListing }: InvestorInterestsPanelProps) {
  const [interests, setInterests] = useState<InvestorInterest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedInvestor, setExpandedInvestor] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);

  useEffect(() => {
    fetchInterests();
    const interval = setInterval(fetchInterests, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchInterests = async () => {
    try {
      const res = await fetch('/api/investor-interests?status=new&limit=20');
      const data = await res.json();
      setInterests(data.interests || []);
    } catch (e) {
      console.error('Error fetching interests:', e);
    } finally {
      setLoading(false);
    }
  };

  const markAsViewed = async (interestId: string) => {
    try {
      await fetch('/api/investor-interests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interestId, status: 'viewed' })
      });
      setInterests(prev => prev.map(i => i.id === interestId ? { ...i, status: 'viewed' } : i));
    } catch (e) {
      console.error('Error marking as viewed:', e);
    }
  };

  const markAsContacted = async (interestId: string) => {
    try {
      await fetch('/api/investor-interests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interestId, status: 'contacted' })
      });
      setInterests(prev => prev.map(i => i.id === interestId ? { ...i, status: 'contacted' } : i));
    } catch (e) {
      console.error('Error marking as contacted:', e);
    }
  };

  const newInterests = interests.filter(i => i.status === 'new');
  const viewedInterests = interests.filter(i => i.status === 'viewed');

  const formatTime = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `hace ${hours}h`;
    return `hace ${Math.floor(hours / 24)}d`;
  };

  const formatTicket = (amount: number) => {
    if (!amount) return 'No definido';
    return `€${(amount / 1000000).toFixed(1)}M`;
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/3"></div>
          <div className="h-20 bg-muted rounded"></div>
          <div className="h-20 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium flex items-center gap-2">
              <Eye size={18} className="text-primary" />
              Intereses de Inversores
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {newInterests.length} nuevo(s), {viewedInterests.length} visto(s)
            </p>
          </div>
          <button
            onClick={fetchInterests}
            className="text-xs text-primary hover:underline"
          >
            Actualizar
          </button>
        </div>
      </div>

      {interests.length === 0 ? (
        <div className="p-12 text-center">
          <p className="text-muted-foreground">No hay intereses registrados</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {interests.map((interest) => {
            const isExpanded = expandedInvestor === interest.id;
            const inv = interest.investor;
            
            return (
              <div key={interest.id} className="p-4 hover:bg-muted/30 transition-colors">
                <div 
                  className="flex items-start justify-between cursor-pointer"
                  onClick={() => {
                    setExpandedInvestor(isExpanded ? null : interest.id);
                    if (interest.status === 'new') markAsViewed(interest.id);
                  }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {interest.status === 'new' && (
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                      )}
                      <span className="font-medium">
                        {inv.full_name || inv.company_name || 'Inversor'}
                      </span>
                      <span className="text-xs text-muted-foreground">{inv.email}</span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {interest.interest_type === 'property_view' && interest.property && (
                        <span className="flex items-center gap-1">
                          <Eye size={12} />
                          Vio: {interest.property.address?.split(',')[0] || 'Propiedad'}
                        </span>
                      )}
                      {interest.interest_type === 'filter_search' && (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} />
                          Búsqueda: {interest.filter_criteria?.search_term || 'Filtros'}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <DollarSign size={12} />
                        {formatTicket(inv.max_ticket_eur)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {formatTime(interest.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {interest.status === 'viewed' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsContacted(interest.id);
                        }}
                        className="px-3 py-1 bg-emerald-500/20 text-emerald-500 rounded-lg text-xs flex items-center gap-1 hover:bg-emerald-500/30"
                      >
                        <Phone size={12} />
                        Contactar
                      </button>
                    )}
                    {onSendBlindListing && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSendingEmail(interest.investor_id);
                          onSendBlindListing(
                            interest.investor_id,
                            interest.property_id ? [interest.property_id] : []
                          );
                          setSendingEmail(null);
                        }}
                        disabled={sendingEmail === interest.investor_id}
                        className="px-3 py-1 bg-primary/20 text-primary rounded-lg text-xs flex items-center gap-1 hover:bg-primary/30 disabled:opacity-50"
                      >
                        {sendingEmail === interest.investor_id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Send size={12} />
                        )}
                        Enviar listado
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && interest.property && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-xl">
                    <div className="flex gap-4">
                      <div className="w-24 h-16 bg-card rounded-lg overflow-hidden flex-shrink-0">
                        {interest.property.thumbnail_url ? (
                          <img 
                            src={interest.property.thumbnail_url} 
                            alt="" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-card flex items-center justify-center text-muted-foreground text-xs">
                            Sin img
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{interest.property.address}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {interest.property.asset_type} • €{((interest.property.price || 0) / 1000000).toFixed(1)}M
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
