import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JoinForm from "@/components/JoinForm";
import { FiStar, FiUsers, FiTrendingUp, FiUnlock } from "react-icons/fi";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Join the Founding 50 | GreenChainz",
  description: "Become a founding member of the GreenChainz platform.",
};

export default function Founding50Page() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-24 px-4 overflow-hidden">
          {/* Background effects */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full opacity-30 pointer-events-none">
            <div className="absolute top-20 left-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-[100px]" />
            <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-[100px]" />
          </div>

          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm font-medium mb-8">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              Limited Availability: 12 spots remaining
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 bg-gradient-to-br from-white via-white to-slate-400 bg-clip-text text-transparent">
              Shape the Future of <br />
              <span className="text-teal-400">Green Sourcing</span>
            </h1>

            <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
              Join the &quot;Founding 50&quot; cohort of architects and suppliers. Get lifetime benefits, early access, and direct influence on our product roadmap.
            </p>

            <div className="max-w-md mx-auto">
              <JoinForm />
              <p className="text-xs text-slate-500 mt-4">
                No credit card required. Application subject to review.
              </p>
            </div>
          </div>
        </section>

        {/* Benefits Grid */}
        <section className="py-20 px-4 bg-slate-900/50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-16">Why Join the Founding 50?</h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <BenefitCard
                icon={<FiUnlock className="w-6 h-6 text-teal-400" />}
                title="Early Access"
                description="Get platform access 6 months before public launch. Secure your username and profile."
              />
              <BenefitCard
                icon={<FiStar className="w-6 h-6 text-purple-400" />}
                title="Lifetime Status"
                description="Permanent &apos;Founding Member&apos; badge on your company profile and priority support forever."
              />
              <BenefitCard
                icon={<FiTrendingUp className="w-6 h-6 text-emerald-400" />}
                title="Locked-in Pricing"
                description="Suppliers get 50% off commission fees for the first 2 years. Architects get free premium tools."
              />
              <BenefitCard
                icon={<FiUsers className="w-6 h-6 text-blue-400" />}
                title="Product Influence"
                description="Join monthly roadmap calls with the founder. Your feature requests get priority."
              />
            </div>
          </div>
        </section>

        {/* Testimonial / Social Proof */}
        <section className="py-24 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <blockquote className="text-2xl font-medium text-slate-300 mb-8 italic">
              &quot;Finally, a platform that understands the complexity of material certification. Being part of the Founding 50 gives us a chance to build the tool we&apos;ve always needed.&quot;
            </blockquote>
            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xl font-bold">
                JD
              </div>
              <div className="text-left">
                <div className="font-bold text-white">James D.</div>
                <div className="text-sm text-slate-500">Principal Architect, EcoBuild Studio</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function BenefitCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <Card className="bg-slate-900 border-slate-800 hover:border-teal-500/50 transition-colors">
      <CardContent className="p-6">
        <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center mb-4">
          {icon}
        </div>
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-400">{description}</p>
      </CardContent>
    </Card>
  );
}
