import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Trophy,
  Zap,
  BarChart3,
  ShieldCheck
} from "lucide-react";

export default function BentoFeatures() {
  return (
    <section id="features" className="py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-display font-bold mb-6 text-gray-900">
            More than just a CRM. <br />
            <span className="text-brand-purple">It's your growth engine.</span>
          </h2>
          <p className="text-xl text-gray-600">
            We've rethought every step of the collection process to remove friction and add delight.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Large Card - Dashboard */}
          <motion.div
            whileHover={{ y: -5 }}
            className="md:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group"
          >
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-brand-purple flex items-center justify-center mb-6">
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Command Center</h3>
              <p className="text-gray-600 max-w-md">
                A unified view for agents to see their daily targets, active cases, and performance metrics without clicking away.
              </p>
            </div>
            <div className="absolute right-0 bottom-0 w-1/2 h-full bg-gradient-to-l from-purple-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            {/* Abstract UI decoration */}
            <div className="absolute -right-10 -bottom-10 w-64 h-48 bg-gray-100 rounded-tl-3xl border-t border-l border-gray-200 p-4 opacity-50 group-hover:translate-x-[-10px] group-hover:translate-y-[-10px] transition-transform duration-500">
              <div className="w-full h-4 bg-gray-300 rounded-full mb-3"></div>
              <div className="w-2/3 h-4 bg-gray-300 rounded-full mb-3"></div>
              <div className="flex gap-2 mt-4">
                <div className="w-8 h-8 rounded-full bg-brand-purple/20"></div>
                <div className="w-8 h-8 rounded-full bg-brand-blue/20"></div>
              </div>
            </div>
          </motion.div>

          {/* Tall Card - Gamification */}
          <motion.div
            whileHover={{ y: -5 }}
            className="md:row-span-2 bg-brand-purple text-white p-8 rounded-3xl shadow-xl shadow-brand-purple/20 relative overflow-hidden"
          >
            <div className="relative z-10 h-full flex flex-col">
              <div className="w-12 h-12 rounded-xl bg-white/20 text-white flex items-center justify-center mb-6">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Gamified Recovery</h3>
              <p className="text-purple-100 mb-8 flex-grow">
                Turn collections into a sport. Leaderboards, badges, and celebration animations keep morale high.
              </p>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-yellow-900 font-bold text-xs">1st</div>
                  <div className="text-sm font-medium">Top Performer</div>
                </div>
                <div className="w-full bg-black/20 h-2 rounded-full overflow-hidden">
                  <div className="bg-yellow-400 h-full w-3/4"></div>
                </div>
              </div>
            </div>
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-brand-blue rounded-full blur-3xl opacity-50"></div>
          </motion.div>

          {/* Small Card - One Click */}
          <motion.div
            whileHover={{ y: -5 }}
            className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 group"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-brand-blue flex items-center justify-center mb-6">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">One-Click Actions</h3>
            <p className="text-gray-600 text-sm">
              Call, WhatsApp, or Email instantly. No copy-pasting numbers.
            </p>
          </motion.div>

          {/* Small Card - Security */}
          <motion.div
            whileHover={{ y: -5 }}
            className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 group"
          >
            <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center mb-6">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">Compliance First</h3>
            <p className="text-gray-600 text-sm">
              Auto-call recording and audit logs keep you 100% compliant.
            </p>
          </motion.div>

          {/* Wide Card - Analytics */}
          <motion.div
            whileHover={{ y: -5 }}
            className="md:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-8"
          >
            <div className="flex-1">
              <div className="w-12 h-12 rounded-xl bg-orange-100 text-brand-orange flex items-center justify-center mb-6">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Live Analytics</h3>
              <p className="text-gray-600">
                Managers get real-time insights into team performance, recovery rates, and call quality. Spot bottlenecks before they become problems.
              </p>
            </div>
            <div className="flex-1 w-full bg-gray-50 rounded-xl p-4 border border-gray-100">
              {/* Mock Graph */}
              <div className="flex items-end gap-2 h-32 w-full justify-between px-2">
                {[40, 70, 50, 90, 60, 80, 95].map((h, i) => (
                  <div key={i} className="w-full bg-brand-purple/20 rounded-t-sm relative group-hover:bg-brand-purple transition-colors duration-500" style={{ height: `${h}% ` }}></div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
