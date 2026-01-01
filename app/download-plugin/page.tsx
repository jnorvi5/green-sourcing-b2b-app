import Header from "@/components/Header";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import { FaWindows } from "react-icons/fa";

export const metadata = {
  title: "Download Revit Plugin | GreenChainz",
  description: "Get the AI-powered Revit plugin for sustainable material sourcing.",
};

export default function DownloadPluginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center py-24 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="inline-flex items-center justify-center p-4 bg-emerald-500/10 rounded-full mb-6">
            <FaWindows className="text-4xl text-emerald-400" />
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
            Download GreenChainz for Revit
          </h1>

          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Compatible with Revit 2023, 2024, and 2025.
            Start auditing your projects for carbon impact today.
          </p>

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 max-w-md mx-auto">
            <div className="text-left space-y-4 mb-8">
              <div className="flex items-center gap-3 text-slate-300">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>One-click installation</span>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Automatic updates</span>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Secure & verified by Autodesk</span>
              </div>
            </div>

            <button className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold text-lg transition-colors shadow-lg shadow-emerald-500/20">
              Download Installer (v1.0.2)
            </button>
            <p className="text-xs text-slate-500 mt-4">
              By downloading, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>

          <div className="pt-12">
            <Link href="/" className="text-emerald-400 hover:text-emerald-300 font-medium">
              ← Back to Home
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
