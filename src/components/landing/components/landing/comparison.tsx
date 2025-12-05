import { Check, X } from "lucide-react";
import { motion } from "framer-motion";

export default function Comparison() {
  return (
    <section id="comparison" className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-block px-4 py-1 rounded-full bg-brand-orange/10 text-brand-orange text-sm font-bold mb-4">
            WHY UPGRADE?
          </div>
          <h2 className="text-4xl font-display font-bold mb-6 text-gray-900">
            Stop managing debts with spreadsheets
          </h2>
          <p className="text-xl text-gray-600">
            Move from chaos to clarity. See how Shakti transforms your collection process.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Old Way */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="p-8 rounded-3xl bg-gray-50 border border-gray-200"
          >
            <h3 className="text-2xl font-bold text-gray-500 mb-8 flex items-center gap-3">
              <span className="w-2 h-8 bg-gray-300 rounded-full"></span>
              The Old Way
            </h3>
            <ul className="space-y-6">
              <li className="flex items-start gap-4 text-gray-600">
                <div className="min-w-6 min-h-6 w-6 h-6 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                  <X className="w-4 h-4 text-red-500" />
                </div>
                Manual Excel sheets & chaos leading to data loss
              </li>
              <li className="flex items-start gap-4 text-gray-600">
                <div className="min-w-6 min-h-6 w-6 h-6 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                  <X className="w-4 h-4 text-red-500" />
                </div>
                Blind spots in agent performance and daily targets
              </li>
              <li className="flex items-start gap-4 text-gray-600">
                <div className="min-w-6 min-h-6 w-6 h-6 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                  <X className="w-4 h-4 text-red-500" />
                </div>
                Low morale, high attrition, and burnout
              </li>
              <li className="flex items-start gap-4 text-gray-600">
                <div className="min-w-6 min-h-6 w-6 h-6 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                  <X className="w-4 h-4 text-red-500" />
                </div>
                Missed follow-ups and lost revenue opportunities
              </li>
            </ul>
          </motion.div>

          {/* Shakti Way */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="p-8 rounded-3xl bg-brand-purple/5 border-2 border-brand-purple/20 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-purple/10 rounded-bl-full -mr-10 -mt-10"></div>
            
            <h3 className="text-2xl font-bold text-brand-purple mb-8 flex items-center gap-3 relative z-10">
              <span className="w-2 h-8 bg-brand-purple rounded-full"></span>
              The Shakti Way
            </h3>
            <ul className="space-y-6 relative z-10">
              <li className="flex items-start gap-4 text-gray-900 font-medium">
                <div className="min-w-6 min-h-6 w-6 h-6 rounded-full bg-brand-purple/20 flex items-center justify-center mt-0.5">
                  <Check className="w-4 h-4 text-brand-purple" />
                </div>
                Automated, smart case distribution and tracking
              </li>
              <li className="flex items-start gap-4 text-gray-900 font-medium">
                <div className="min-w-6 min-h-6 w-6 h-6 rounded-full bg-brand-purple/20 flex items-center justify-center mt-0.5">
                  <Check className="w-4 h-4 text-brand-purple" />
                </div>
                Real-time tracking, leaderboards, and live analytics
              </li>
              <li className="flex items-start gap-4 text-gray-900 font-medium">
                <div className="min-w-6 min-h-6 w-6 h-6 rounded-full bg-brand-purple/20 flex items-center justify-center mt-0.5">
                  <Check className="w-4 h-4 text-brand-purple" />
                </div>
                Gamified rewards & celebrations to boost motivation
              </li>
              <li className="flex items-start gap-4 text-gray-900 font-medium">
                <div className="min-w-6 min-h-6 w-6 h-6 rounded-full bg-brand-purple/20 flex items-center justify-center mt-0.5">
                  <Check className="w-4 h-4 text-brand-purple" />
                </div>
                Smart reminders & PTP (Promise to Pay) tracking
              </li>
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
