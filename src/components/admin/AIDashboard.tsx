'use client';

import { useState, useEffect } from 'react';
import { 
    Brain, Bot, Play, Pause, Settings, Users, Activity, 
    Clock, DollarSign, Database, Network, Search, Plus,
    ChevronRight, Loader2, RefreshCw, CheckCircle, AlertCircle
} from 'lucide-react';
import MemoryPanel from './MemoryPanel';
import PaperclipDashboard from './PaperclipDashboard';

type Tab = 'overview' | 'memory' | 'paperclip';

interface SystemStatus {
    memory: {
        connected: boolean;
        wingsCount?: number;
        error?: string;
    };
    paperclip: {
        connected: boolean;
        agentsCount?: number;
        error?: string;
    };
    insforge: {
        connected: boolean;
    };
}

export default function AIDashboard() {
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [status, setStatus] = useState<SystemStatus>({
        memory: { connected: false },
        paperclip: { connected: false },
        insforge: { connected: true }
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkSystemStatus();
    }, []);

    const checkSystemStatus = async () => {
        setIsLoading(true);
        try {
            // Check Memory system (via InsForge)
            const memoryRes = await fetch('/api/memory?action=list_wings');
            const memoryData = await memoryRes.json();
            
            // Check Paperclip
            let paperclipConnected = false;
            try {
                const paperclipRes = await fetch('/api/paperclip?action=status');
                const paperclipData = await paperclipRes.json();
                paperclipConnected = paperclipData.connected;
            } catch {
                paperclipConnected = false;
            }

            setStatus({
                memory: {
                    connected: memoryRes.ok,
                    wingsCount: memoryData.wings?.length || 0
                },
                paperclip: {
                    connected: paperclipConnected
                },
                insforge: {
                    connected: true
                }
            });
        } catch (error) {
            console.error('Status check error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const renderOverview = () => (
        <div className="space-y-8">
            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* InsForge Status */}
                <div className="bg-card border border-border rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium flex items-center gap-2">
                            <Database size={18} className="text-primary" />
                            InsForge
                        </h3>
                        <span className={`flex items-center gap-1 text-xs ${
                            status.insforge.connected ? 'text-emerald-500' : 'text-red-500'
                        }`}>
                            {status.insforge.connected ? (
                                <CheckCircle size={14} />
                            ) : (
                                <AlertCircle size={14} />
                            )}
                            {status.insforge.connected ? 'Connected' : 'Disconnected'}
                        </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Database, Auth & Storage
                    </p>
                    <div className="mt-4 text-xs text-muted-foreground">
                        if8rkq6j.eu-central.insforge.app
                    </div>
                </div>

                {/* Memory System Status */}
                <div className="bg-card border border-border rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium flex items-center gap-2">
                            <Brain size={18} className="text-primary" />
                            Memory Palace
                        </h3>
                        <span className={`flex items-center gap-1 text-xs ${
                            status.memory.connected ? 'text-emerald-500' : 'text-amber-500'
                        }`}>
                            {status.memory.connected ? (
                                <CheckCircle size={14} />
                            ) : (
                                <AlertCircle size={14} />
                            )}
                            {status.memory.connected ? 'Active' : 'Setup Required'}
                        </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Wing → Room → Drawer storage
                    </p>
                    {status.memory.connected && status.memory.wingsCount !== undefined && (
                        <div className="mt-4 text-sm">
                            <span className="text-2xl font-serif">{status.memory.wingsCount}</span>
                            <span className="text-muted-foreground ml-2">wings</span>
                        </div>
                    )}
                </div>

                {/* Paperclip Status */}
                <div className="bg-card border border-border rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium flex items-center gap-2">
                            <Bot size={18} className="text-primary" />
                            Paperclip
                        </h3>
                        <span className={`flex items-center gap-1 text-xs ${
                            status.paperclip.connected ? 'text-emerald-500' : 'text-gray-400'
                        }`}>
                            {status.paperclip.connected ? (
                                <CheckCircle size={14} />
                            ) : (
                                <Pause size={14} />
                            )}
                            {status.paperclip.connected ? 'Online' : 'Offline'}
                        </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        AI Agent Orchestration
                    </p>
                    {!status.paperclip.connected && (
                        <div className="mt-4 text-xs text-muted-foreground">
                            Run: npx paperclipai dev
                        </div>
                    )}
                </div>
            </div>

            {/* Architecture Diagram */}
            <div className="bg-card border border-border rounded-2xl p-8">
                <h3 className="font-medium mb-6 flex items-center gap-2">
                    <Network size={18} className="text-primary" />
                    System Architecture
                </h3>
                
                <div className="flex flex-col items-center space-y-4">
                    {/* CEO */}
                    <div className="px-6 py-3 bg-primary/10 border border-primary/20 rounded-xl text-center">
                        <p className="font-medium">👤 CEO (Alberto Gala)</p>
                        <p className="text-xs text-muted-foreground">Strategic Oversight</p>
                    </div>
                    
                    <div className="w-px h-6 border-l-2 border-dashed border-border" />
                    
                    {/* Agents */}
                    <div className="flex gap-4">
                        <div className="px-5 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                            <p className="font-medium text-emerald-600">Pelayo</p>
                            <p className="text-xs text-muted-foreground">Sales Agent</p>
                        </div>
                        <div className="px-5 py-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-center">
                            <p className="font-medium text-blue-600">Centurion</p>
                            <p className="text-xs text-muted-foreground">Lead Intel</p>
                        </div>
                        <div className="px-5 py-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-center">
                            <p className="font-medium text-purple-600">Alea IAI</p>
                            <p className="text-xs text-muted-foreground">Email Inbox</p>
                        </div>
                    </div>
                    
                    <div className="w-px h-6 border-l-2 border-dashed border-border" />
                    
                    {/* Infrastructure */}
                    <div className="flex gap-4 flex-wrap justify-center">
                        <div className="px-5 py-3 bg-card border border-border rounded-xl text-center">
                            <p className="font-medium">📊 InsForge</p>
                            <p className="text-xs text-muted-foreground">DB + Auth + Storage</p>
                        </div>
                        <div className="px-5 py-3 bg-card border border-border rounded-xl text-center">
                            <p className="font-medium">🧠 Memory Palace</p>
                            <p className="text-xs text-muted-foreground">Wing → Room → Drawer</p>
                        </div>
                        <div className="px-5 py-3 bg-card border border-border rounded-xl text-center">
                            <p className="font-medium">🎯 Paperclip</p>
                            <p className="text-xs text-muted-foreground">Orchestration</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                    onClick={() => setActiveTab('memory')}
                    className="bg-card border border-border rounded-2xl p-6 text-left hover:border-primary/30 transition-all"
                >
                    <div className="flex items-center justify-between mb-4">
                        <Brain size={24} className="text-primary" />
                        <ChevronRight size={20} className="text-muted-foreground" />
                    </div>
                    <h3 className="font-serif text-lg font-medium mb-2">Memory Palace</h3>
                    <p className="text-sm text-muted-foreground">
                        Gestionar recuerdos, wings y Knowledge Graph
                    </p>
                </button>

                <button
                    onClick={() => setActiveTab('paperclip')}
                    className="bg-card border border-border rounded-2xl p-6 text-left hover:border-primary/30 transition-all"
                >
                    <div className="flex items-center justify-between mb-4">
                        <Bot size={24} className="text-primary" />
                        <ChevronRight size={20} className="text-muted-foreground" />
                    </div>
                    <h3 className="font-serif text-lg font-medium mb-2">Paperclip Dashboard</h3>
                    <p className="text-sm text-muted-foreground">
                        Control de agents AI y tasks
                    </p>
                </button>
            </div>

            {/* Setup Instructions */}
            {!status.memory.connected && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6">
                    <h3 className="font-medium text-amber-500 mb-4 flex items-center gap-2">
                        <AlertCircle size={18} />
                        Setup Required - Memory System
                    </h3>
                    <div className="text-sm space-y-2">
                        <p>1. Go to InsForge SQL Editor:</p>
                        <code className="block bg-muted p-2 rounded text-xs">
                            https://if8rkq6j.eu-central.insforge.app
                        </code>
                        <p>2. Execute the migration SQL:</p>
                        <code className="block bg-muted p-2 rounded text-xs">
                            scripts/memory-migration.sql
                        </code>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto w-full p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-serif font-medium flex items-center gap-3">
                        <Brain className="w-8 h-8 text-primary" />
                        Alea AI Control Center
                    </h2>
                    <p className="text-muted-foreground mt-2">
                        Memory Palace + Paperclip Orchestration
                    </p>
                </div>
                <button
                    onClick={checkSystemStatus}
                    disabled={isLoading}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium flex items-center gap-2"
                >
                    <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-border">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                        activeTab === 'overview' 
                            ? 'border-b-2 border-primary text-primary' 
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    Overview
                </button>
                <button
                    onClick={() => setActiveTab('memory')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                        activeTab === 'memory' 
                            ? 'border-b-2 border-primary text-primary' 
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    <Brain size={16} className="inline mr-2" />
                    Memory Palace
                </button>
                <button
                    onClick={() => setActiveTab('paperclip')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                        activeTab === 'paperclip' 
                            ? 'border-b-2 border-primary text-primary' 
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    <Bot size={16} className="inline mr-2" />
                    Paperclip
                </button>
            </div>

            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'memory' && <MemoryPanel />}
            {activeTab === 'paperclip' && <PaperclipDashboard />}
        </div>
    );
}
