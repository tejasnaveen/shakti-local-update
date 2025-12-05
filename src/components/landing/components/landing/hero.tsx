import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import Slider from "./slider";

export default function Hero() {
  const slides = [
    {
      id: 1,
      content: (
        <div className="w-full h-full relative">
          <img
            src="/assets/generated_images/telecaller_team_work.png"
            alt="Indian telecaller team working in modern office"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-sky-900/80 to-transparent flex items-end p-8">
            <div className="text-white">
              <h3 className="text-3xl font-bold mb-2">Smart Team Management</h3>
              <p className="text-sky-100">Efficiently manage and track your telecaller teams across India</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 2,
      content: (
        <div className="w-full h-full relative">
          <img
            src="/assets/generated_images/telecaller_analytics_dashboard.png"
            alt="Indian telecaller viewing analytics dashboard"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 to-transparent flex items-end p-8">
            <div className="text-white">
              <h3 className="text-3xl font-bold mb-2">Real-time Analytics</h3>
              <p className="text-blue-100">Track performance with powerful insights and metrics</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 3,
      content: (
        <div className="w-full h-full relative">
          <img
            src="/assets/generated_images/telecaller_success_celebration.png"
            alt="Indian telecaller team celebrating success"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-sky-900/80 to-transparent flex items-end p-8">
            <div className="text-white">
              <h3 className="text-3xl font-bold mb-2">Streamlined Workflows</h3>
              <p className="text-sky-100">Automate your collection process for maximum efficiency</p>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <section className="pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          <div className="lg:w-1/2 z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-md border border-sky-500/20 text-sky-600 text-sm font-semibold mb-8 shadow-sm hover:shadow-md transition-all cursor-default">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500"></span>
                </span>
                v2.0 is live
              </div>

              <h1 className="text-5xl lg:text-7xl font-display font-bold leading-[1.1] mb-6 text-gray-900">
                Supercharge Your <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600">
                  Debt Recovery
                </span>
              </h1>

              <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-xl">
                The intelligent CRM built for Indian collection agencies. Empower your telecallers, optimize allocation, and maximize collections through smart gamification.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="h-14 px-8 bg-gradient-to-r from-sky-500 to-blue-600 hover:opacity-90 text-white text-lg font-medium rounded-xl shadow-lg shadow-sky-500/25 transition-all hover:scale-105 hover:shadow-sky-500/40">
                  Get Started for Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>

                <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-medium rounded-xl border-2 hover:bg-gray-50">
                  <Play className="mr-2 w-5 h-5 fill-current" />
                  Book a Demo
                </Button>
              </div>

              <div className="mt-10 flex items-center gap-4 text-sm text-gray-500">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 overflow-hidden">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} alt="avatar" />
                    </div>
                  ))}
                </div>
                <p>Trusted by <span className="font-bold text-gray-900">500+</span> agencies across India</p>
              </div>
            </motion.div>
          </div>

          <div className="lg:w-1/2 relative h-[500px]">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
              animate={{ opacity: 1, scale: 1, rotate: -2 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative z-10 h-full"
            >
              <Slider slides={slides} autoPlayInterval={4000} />
            </motion.div>

            {/* Background decorative blobs */}
            <div className="absolute -top-20 -right-20 w-[500px] h-[500px] bg-sky-500/20 rounded-full blur-3xl -z-10 mix-blend-multiply animate-blob"></div>
            <div className="absolute -bottom-20 -left-20 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-3xl -z-10 mix-blend-multiply animate-blob animation-delay-2000"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-300/10 rounded-full blur-3xl -z-10 mix-blend-multiply animate-blob animation-delay-4000"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
