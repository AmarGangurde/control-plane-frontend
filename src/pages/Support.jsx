import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare,
    Plus,
    Send,
    History,
    ChevronRight,
    AlertCircle,
    CheckCircle2,
    Clock,
    User,
    ShieldCheck
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const TicketStatus = ({ status }) => {
    const styles = {
        open: 'bg-green-500/10 text-green-400 border-green-500/20',
        closed: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
        pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    };
    return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${styles[status] || styles.open}`}>
            {status}
        </span>
    );
};

export default function Support() {
    const { user } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [newTicket, setNewTicket] = useState({ subject: '', message: '' });
    const [reply, setReply] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            const data = await api.support.listTickets();
            setTickets(data);
        } catch (err) {
            console.error('Failed to fetch tickets', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectTicket = async (ticket) => {
        setSelectedTicket(ticket);
        setLoadingMessages(true);
        try {
            const data = await api.support.getTicketMessages(ticket.id);
            setMessages(data);
        } catch (err) {
            console.error('Failed to fetch messages', err);
        } finally {
            setLoadingMessages(false);
        }
    };

    const handleCreateTicket = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const ticket = await api.support.createTicket(newTicket);
            setTickets([ticket, ...tickets]);
            setShowCreate(false);
            setNewTicket({ subject: '', message: '' });
            handleSelectTicket(ticket);
        } catch (err) {
            alert(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleSendReply = async (e) => {
        e.preventDefault();
        if (!reply.trim()) return;
        setSubmitting(true);
        try {
            const newMessage = await api.support.replyTicket(selectedTicket.id, reply);
            setMessages([...messages, newMessage]);
            setReply('');
        } catch (err) {
            alert(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="space-y-8">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-white mb-2">Support Center</h1>
                    <p className="text-slate-400 font-medium">Get help from our technical team</p>
                </div>
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-xl shadow-blue-500/20"
                >
                    {showCreate ? <History size={18} /> : <Plus size={18} />}
                    {showCreate ? 'View Tickets' : 'New Ticket'}
                </button>
            </header>

            <div className="grid lg:grid-cols-12 gap-8">
                {/* Left: Ticket List / Create Form */}
                <div className="lg:col-span-12">
                    {showCreate ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="max-w-2xl mx-auto bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-8"
                        >
                            <h2 className="text-2xl font-black text-white mb-6">Create Support Ticket</h2>
                            <form onSubmit={handleCreateTicket} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Subject</label>
                                    <input
                                        required
                                        type="text"
                                        value={newTicket.subject}
                                        onChange={e => setNewTicket({ ...newTicket, subject: e.target.value })}
                                        placeholder="Brief description of the issue"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Detailed Message</label>
                                    <textarea
                                        required
                                        rows="6"
                                        value={newTicket.message}
                                        onChange={e => setNewTicket({ ...newTicket, message: e.target.value })}
                                        placeholder="Explain what's going on..."
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium resize-none"
                                    ></textarea>
                                </div>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-blue-500/20 transition-all disabled:opacity-50"
                                >
                                    {submitting ? 'Creating...' : 'Create Ticket'}
                                </button>
                            </form>
                        </motion.div>
                    ) : (
                        <div className="grid lg:grid-cols-3 gap-8">
                            {/* Ticket List */}
                            <div className="lg:col-span-1 space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 px-2">Your Tickets</h3>
                                <div className="space-y-3">
                                    {tickets.length === 0 ? (
                                        <div className="text-center py-12 bg-white/[0.02] border border-white/5 rounded-3xl">
                                            <MessageSquare className="mx-auto text-slate-700 mb-3" size={32} />
                                            <p className="text-sm text-slate-500 font-medium">No tickets yet</p>
                                        </div>
                                    ) : (
                                        tickets.map(ticket => (
                                            <button
                                                key={ticket.id}
                                                onClick={() => handleSelectTicket(ticket)}
                                                className={`w-full text-left p-5 rounded-3xl border transition-all group ${selectedTicket?.id === ticket.id
                                                        ? 'bg-blue-600/10 border-blue-500/40'
                                                        : 'bg-white/[0.02] border-white/5 hover:border-white/20'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <TicketStatus status={ticket.status} />
                                                    <span className="text-[10px] text-slate-500 font-bold">{new Date(ticket.updated_at).toLocaleDateString()}</span>
                                                </div>
                                                <h4 className="text-sm font-bold text-white truncate group-hover:text-blue-400 transition-colors">
                                                    {ticket.subject}
                                                </h4>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Chat View */}
                            <div className="lg:col-span-2">
                                {selectedTicket ? (
                                    <div className="bg-[#0b1121] border border-white/10 rounded-[2.5rem] flex flex-col h-[600px] overflow-hidden shadow-2xl shadow-black/50">
                                        <div className="p-6 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
                                            <div>
                                                <h3 className="text-lg font-black text-white">{selectedTicket.subject}</h3>
                                                <p className="text-xs text-slate-500 font-medium tracking-wide">TICKET ID: {selectedTicket.id}</p>
                                            </div>
                                            <TicketStatus status={selectedTicket.status} />
                                        </div>

                                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                            {loadingMessages ? (
                                                <div className="flex items-center justify-center h-full">
                                                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                                </div>
                                            ) : (
                                                messages.map((msg, i) => (
                                                    <div
                                                        key={msg.id}
                                                        className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                                                    >
                                                        <div className={`max-w-[80%] space-y-2`}>
                                                            <div className={`flex items-center gap-2 mb-1 ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                                {msg.sender_type === 'admin' && <ShieldCheck size={14} className="text-purple-400" />}
                                                                <span className={`text-[10px] font-black uppercase tracking-widest ${msg.sender_type === 'user' ? 'text-blue-400' : 'text-purple-400'}`}>
                                                                    {msg.sender_type === 'user' ? 'You' : 'Founder / Support'}
                                                                </span>
                                                            </div>
                                                            <div className={`p-4 rounded-3xl text-sm font-medium leading-relaxed ${msg.sender_type === 'user'
                                                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                                                    : 'bg-white/5 text-slate-200 border border-white/10 rounded-tl-none'
                                                                }`}>
                                                                {msg.message}
                                                            </div>
                                                            <div className={`text-[9px] text-slate-600 font-bold uppercase tracking-tighter ${msg.sender_type === 'user' ? 'text-right' : 'text-left'}`}>
                                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>

                                        {selectedTicket.status !== 'closed' && (
                                            <div className="p-6 bg-white/[0.02] border-t border-white/10">
                                                <form onSubmit={handleSendReply} className="relative">
                                                    <input
                                                        type="text"
                                                        value={reply}
                                                        onChange={e => setReply(e.target.value)}
                                                        placeholder="Type your reply here..."
                                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-6 pr-16 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                                                    />
                                                    <button
                                                        type="submit"
                                                        disabled={submitting || !reply.trim()}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 p-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                                                    >
                                                        <Send size={18} className="text-white" />
                                                    </button>
                                                </form>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="h-[600px] bg-white/[0.02] border border-dashed border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center p-12 text-center">
                                        <div className="p-6 bg-blue-500/10 rounded-full mb-6">
                                            <MessageSquare size={48} className="text-blue-400" />
                                        </div>
                                        <h3 className="text-2xl font-black text-white mb-2">Select a Ticket</h3>
                                        <p className="text-slate-500 font-medium max-w-sm">
                                            Choose a conversation from the list or create a new ticket to get started with our support team.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
