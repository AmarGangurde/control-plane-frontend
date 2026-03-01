import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MessageSquare, User, Send, ArrowLeft, Globe, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ContactUs() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const { name, email, message } = formData;
        const subject = encodeURIComponent(`Contact from Wrexer Website - ${name}`);
        const body = encodeURIComponent(
            `Name: ${name}\n` +
            `Email: ${email}\n\n` +
            `Message:\n${message}`
        );
        window.location.href = `mailto:founder.wrexer@gmail.com?subject=${subject}&body=${body}`;
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <div className="min-h-screen bg-[#020617] text-slate-50 font-sans selection:bg-blue-500 selection:text-white py-20 px-6">
            <div className="max-w-4xl mx-auto">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-12 transition-colors group"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Home
                </Link>

                <div className="grid md:grid-cols-2 gap-12">
                    {/* Left Side: Info */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-8"
                    >
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-wider mb-4">
                                <Zap size={12} />
                                Get in touch
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-6">Contact Us</h1>
                            <p className="text-lg text-slate-400 leading-relaxed font-medium">
                                Have questions about our high-performance cloud hosting? We're here to help you scale your infrastructure.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                                    <Globe className="text-blue-400" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold mb-1">About Wrexer.com</h3>
                                    <p className="text-slate-400 text-sm font-medium leading-relaxed">
                                        Wrexer.com provides high-performance application hosting on bare metal Kubernetes, built for developers who value speed and reliability.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                                    <User className="text-indigo-400" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold mb-1">Founder & Owner</h3>
                                    <p className="text-slate-400 text-sm font-medium">
                                        AMARNATH ASARAM GANGURDE
                                    </p>
                                    <p className="text-slate-500 text-[11px] mt-1 font-medium">
                                        Independent Developer & Architect
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                                    <Mail className="text-purple-400" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold mb-1">Direct Support</h3>
                                    <p className="text-slate-400 text-sm font-medium">
                                        founder.wrexer@gmail.com
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-white/5">
                            <p className="text-slate-500 text-xs font-medium leading-relaxed">
                                Office: Ho no 895, Suchakar nagar, satara parisar, Chh Sambhaji Nagar, India.
                            </p>
                        </div>
                    </motion.div>

                    {/* Right Side: Form */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-8 md:p-10 backdrop-blur-sm shadow-2xl shadow-black/50"
                    >
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <input
                                        required
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="John Doe"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <input
                                        required
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="john@example.com"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Your Message</label>
                                <div className="relative">
                                    <MessageSquare className="absolute left-4 top-4 text-slate-500" size={18} />
                                    <textarea
                                        required
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        rows="5"
                                        placeholder="How can we help you?"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium resize-none"
                                    ></textarea>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-3 group"
                            >
                                <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                Send Message
                            </button>

                            <p className="text-center text-slate-500 text-[10px] font-medium uppercase tracking-widest">
                                Opens your default email client
                            </p>
                        </form>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
