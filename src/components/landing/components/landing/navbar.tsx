import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Zap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Navbar() {
  const [clickCount, setClickCount] = useState(0);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [secretCode, setSecretCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (clickCount >= 5) {
      setShowLoginDialog(true);
      setClickCount(0);
    }

    const timer = setTimeout(() => setClickCount(0), 2000);
    return () => clearTimeout(timer);
  }, [clickCount]);

  const handleLogoClick = () => {
    setClickCount(prev => prev + 1);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (secretCode === "admin123") { // Simple secret code for demo
      // Set access flag in session storage
      sessionStorage.setItem('shakti_sa_access', 'true');
      // Use window.location.href for proper navigation
      window.location.href = "/superadmin-login";
      setShowLoginDialog(false);
    } else {
      setError("Invalid access code");
    }
  };

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-sm supports-[backdrop-filter]:bg-white/60"
      >
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={handleLogoClick}
          >
            {/* Logo matching login page design */}
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-full"></div>
                <Zap className="w-5 h-5 text-white relative z-10" strokeWidth={2.5} />
              </div>
            </div>
            <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-blue-600">
              Shakti
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 font-medium text-gray-600">
            <a href="#features" className="hover:text-sky-600 transition-colors">Features</a>
            <a href="#comparison" className="hover:text-sky-600 transition-colors">Why Shakti</a>
            <a href="#testimonials" className="hover:text-sky-600 transition-colors">Testimonials</a>
          </div>

          <div className="flex items-center gap-4">
            <Button className="bg-gradient-to-r from-sky-500 to-blue-600 hover:opacity-90 text-white font-medium shadow-lg shadow-sky-200 transition-all hover:shadow-sky-300 hover:-translate-y-0.5">
              Get Started Free
            </Button>
          </div>
        </div>
      </motion.nav>

      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Restricted Access</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <Input
                type="password"
                placeholder="Enter access code"
                value={secretCode}
                onChange={(e) => {
                  setSecretCode(e.target.value);
                  setError("");
                }}
                className={error ? "border-red-500" : ""}
              />
              {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
            </div>
            <Button type="submit" className="w-full bg-sky-600 hover:bg-sky-700">
              Access System
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
