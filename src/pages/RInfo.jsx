import React from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RInfo() {
    return (
        <div className="min-h-screen bg-slate-900 text-slate-50 font-sans selection:bg-blue-500 selection:text-white py-20 px-6">
            <div className="max-w-4xl mx-auto">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors group"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Home
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-800/50 border border-white/5 rounded-2xl p-8 md:p-12 backdrop-blur-sm"
                >
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-red-500/10 rounded-xl">
                            <RotateCcw className="text-red-400" size={32} />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold">Refund & Cancellation Policy</h1>
                    </div>

                    <div className="space-y-6 text-slate-300 leading-relaxed">
                        <p className="text-sm text-slate-500 italic">Last Updated: February 2026</p>

                        <p>This refund and cancellation policy outlines how you can cancel or seek a refund for a product / service that you have purchased through the Platform. Under this policy:</p>

                        <ul className="list-disc pl-5 space-y-4">
                            <li>Cancellations will only be considered if the request is made 5 days of placing the order. However, cancellation requests may not be entertained if the orders have been communicated to such sellers / merchant(s) listed on the Platform and they have initiated the process of shipping them, or the product is out for delivery. In such an event, you may choose to reject the product at the doorstep.</li>
                            <li>Amarnath Gangurde does not accept cancellation requests for perishable items like flowers, eatables, etc. However, the refund / replacement can be made if the user establishes that the quality of the product delivered is not good.</li>
                            <li>In case of receipt of damaged or defective items, please report to our customer service team. The request would be entertained once the seller/ merchant listed on the Platform, has checked and determined the same at its own end. This should be reported within 5 days of receipt of products. In case you feel that the product received is not as shown on the site or as per your expectations, you must bring it to the notice of our customer service within 5 days of receiving the product. The customer service team after looking into your complaint will take an appropriate decision.</li>
                            <li>In case of complaints regarding the products that come with a warranty from the manufacturers, please refer the issue to them.</li>
                            <li>In case of any refunds approved by Amarnath Gangurde, it will take 10 days for the refund to be processed to you.</li>
                        </ul>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
