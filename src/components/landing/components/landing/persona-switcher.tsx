import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Briefcase, CheckCircle2 } from "lucide-react";

export default function PersonaSwitcher() {
  const [activeTab, setActiveTab] = useState<"agent" | "manager">("agent");

  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-display font-bold mb-6 text-gray-900">
            Built for every role
          </h2>
          <div className="inline-flex bg-gray-100 p-1 rounded-full">
            <button
              onClick={() => setActiveTab("agent")}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 ${activeTab === "agent"
                ? "bg-white text-brand-purple shadow-sm"
                : "text-gray-500 hover:text-gray-900"
                }`}
            >
              For Telecallers
            </button>
            <button
              onClick={() => setActiveTab("manager")}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 ${activeTab === "manager"
                ? "bg-white text-brand-purple shadow-sm"
                : "text-gray-500 hover:text-gray-900"
                }`}
            >
              For Team Leaders
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto bg-gray-50 rounded-[2.5rem] p-8 md:p-12 border border-gray-200">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2">
              <AnimatePresence mode="wait">
                {activeTab === "agent" ? (
                  <motion.div
                    key="agent"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-brand-blue mb-8">
                      <User className="w-8 h-8" />
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-4">Focus on closing, not dialing</h3>
                    <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                      Shakti automates the boring stuff. No more manual dialing or updating spreadsheets. Just clear targets and rewards for hitting them.
                    </p>
                    <ul className="space-y-4">
                      {[
                        "Auto-dialer with click-to-call",
                        "Instant commission tracking",
                        "Smart reminders for follow-ups",
                        "Celebration animations for every payment"
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-gray-700 font-medium">
                          <CheckCircle2 className="w-5 h-5 text-brand-blue flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ) : (
                  <motion.div
                    key="manager"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center text-brand-purple mb-8">
                      <Briefcase className="w-8 h-8" />
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-4">Complete visibility, zero chaos</h3>
                    <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                      Stop chasing updates. Get a real-time bird's-eye view of your entire operation, from individual agent performance to overall recovery rates.
                    </p>
                    <ul className="space-y-4">
                      {[
                        "Live agent monitoring dashboard",
                        "Automated case distribution rules",
                        "Call recording & quality audits",
                        "Predictive recovery analytics"
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-gray-700 font-medium">
                          <CheckCircle2 className="w-5 h-5 text-brand-purple flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="lg:w-1/2 relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.4 }}
                  className="relative z-10"
                >
                  <div className="rounded-xl overflow-hidden shadow-2xl border border-gray-200 bg-white">
                    {/* Dynamic Image based on Tab - focusing on the generated one for Manager, could use another for Agent */}
                    <img
                      src={activeTab === 'manager' ? "/assets/generated_images/team_leader_analytics_dashboard.png" : "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80"}
                      alt="Dashboard View"
                      className="w-full h-auto object-cover aspect-[4/3]"
                    />

                    {/* Overlay UI Elements */}
                    <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md p-4 rounded-lg shadow-lg border border-white/50">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                            {activeTab === 'manager' ? 'Total Recovered' : 'Daily Target'}
                          </p>
                          <p className="text-2xl font-bold text-gray-900">
                            {activeTab === 'manager' ? '₹45,20,000' : '₹85,000'}
                          </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${activeTab === 'manager' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                          {activeTab === 'manager' ? '+12% this week' : '85% Achieved'}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Decorative Elements */}
              <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl -z-10 transition-colors duration-500 ${activeTab === 'manager' ? 'bg-brand-purple/30' : 'bg-brand-blue/30'}`}></div>
              <div className={`absolute -bottom-10 -left-10 w-40 h-40 rounded-full blur-3xl -z-10 transition-colors duration-500 ${activeTab === 'manager' ? 'bg-brand-orange/30' : 'bg-green-500/30'}`}></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
