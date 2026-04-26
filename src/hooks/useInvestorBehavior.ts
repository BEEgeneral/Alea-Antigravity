'use client';

import { useCallback } from 'react';

/**
 * Hook for tracking investor behavior events
 * Use this in components where investors interact with properties
 */
export function useInvestorBehavior() {
  const track = useCallback(async (
    investorId: string,
    eventType: string,
    targetType: string,
    metadata: Record<string, any> = {},
    source: string = 'direct'
  ) => {
    try {
      const response = await fetch('/api/investor-behavior/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          investor_id: investorId, 
          event_type: eventType, 
          target_type: targetType, 
          metadata, 
          source 
        })
      });
      
      if (!response.ok) {
        console.warn('Behavior tracking failed:', response.status);
      }
      
      return await response.json();
    } catch (error) {
      console.warn('Behavior tracking error:', error);
      return null;
    }
  }, []);

  return {
    /**
     * Track when an investor views a property
     */
    trackView: (investorId: string, propertyId: string, metadata: {
      price?: number;
      location?: string;
      property_type?: string;
      title?: string;
    }) => track(investorId, 'view', 'property', { property_id: propertyId, ...metadata }, 'direct'),
    
    /**
     * Track when an investor sends an inquiry about a property
     */
    trackInquiry: (investorId: string, propertyId: string, metadata: {
      price?: number;
      location?: string;
      property_type?: string;
    }) => track(investorId, 'inquiry', 'property', { property_id: propertyId, ...metadata }, 'direct'),
    
    /**
     * Track when an investor favorites a property
     */
    trackFavorite: (investorId: string, propertyId: string, metadata: {
      price?: number;
      location?: string;
    }) => track(investorId, 'favorite', 'property', { property_id: propertyId, ...metadata }, 'direct'),
    
    /**
     * Track when an investor visits a property
     */
    trackVisit: (investorId: string, propertyId: string, metadata: {
      price?: number;
      location?: string;
    }) => track(investorId, 'visit', 'property', { property_id: propertyId, ...metadata }, 'direct'),
    
    /**
     * Track when a match alert is sent to an investor
     */
    trackAlertSent: (investorId: string, opportunityId: string, metadata: {
      matchScore?: number;
      reason?: string;
    }) => track(investorId, 'alert_sent', 'opportunity', { opportunity_id: opportunityId, ...metadata }, 'system'),
    
    /**
     * Track when a match is shown to an investor
     */
    trackMatchShown: (investorId: string, opportunityId: string, metadata: {
      matchScore?: number;
    }) => track(investorId, 'match_shown', 'opportunity', { opportunity_id: opportunityId, ...metadata }, 'system'),
    
    /**
     * Track generic event
     */
    trackEvent: track
  };
}
