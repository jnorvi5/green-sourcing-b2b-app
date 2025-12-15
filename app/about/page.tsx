'use client';

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FiTarget, FiAlertTriangle, FiTrendingUp, FiUser, FiMail } from "react-icons/fi";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-primary/5 py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-extrabold text-foreground mb-6 tracking-tight">
              About GreenChainz
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Building the trust layer for sustainable construction materials through verified certification data and transparent sourcing.
            </p>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto space-y-16">
            
            {/* Mission */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-6">
                  <FiTarget className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="text-3xl font-bold text-foreground mb-4">Our Mission</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  We are dedicated to simplifying the complex world of sustainable sourcing. By connecting architects directly with verified green suppliers, we eliminate the guesswork and greenwashing that plagues the industry.
                </p>
              </div>
              <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-none shadow-xl">
                <CardContent className="p-8 flex flex-col justify-center h-full min-h-[300px]">
                  <p className="text-2xl font-medium italic">
                    &quot;To accelerate the transition to sustainable construction by making green procurement the easiest choice.&quot;
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* The Problem */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
               <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900 order-2 md:order-1">
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold text-orange-700 dark:text-orange-400 mb-4 flex items-center gap-2">
                    <FiAlertTriangle /> The Current State
                  </h3>
                   <ul className="space-y-4 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 font-bold">•</span>
                      Architects spend 40+ hours per project verify materials manually
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 font-bold">•</span>
                      Fragmented databases with outdated EPDs
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 font-bold">•</span>
                      Supply chain opacity leading to compliance risks
                    </li>
                   </ul>
                </CardContent>
              </Card>
              <div className="order-1 md:order-2">
                <div className="w-16 h-16 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-6">
                  <FiAlertTriangle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                </div>
                <h2 className="text-3xl font-bold text-foreground mb-4">The Problem</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Sustainable sourcing is currently broken. Professionals waste countless hours cross-referencing PDFs, emailing suppliers for certifications, and worrying about compliance with regulations like Buy Clean.
                </p>
              </div>
            </div>

            {/* Market Opportunity */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-6">
                  <FiTrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-3xl font-bold text-foreground mb-4">Market Opportunity</h2>
                <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                  The green building materials market is exploding, driven by new regulations and consumer demand. GreenChainz is positioned to be the operating system for this growth.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <div className="text-2xl font-bold text-primary">$1T</div>
                    <div className="text-xs text-muted-foreground">Market by 2037</div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <div className="text-2xl font-bold text-primary">LEED v5</div>
                    <div className="text-xs text-muted-foreground">Driving Demand</div>
                  </div>
                   <div className="p-4 bg-muted rounded-lg text-center">
                    <div className="text-2xl font-bold text-primary">High</div>
                    <div className="text-xs text-muted-foreground">Growth Rate</div>
                  </div>
                </div>
              </div>
               <div className="h-full min-h-[300px] bg-muted/50 rounded-xl border border-border flex items-center justify-center relative overflow-hidden">
                  {/* Decorative graph placeholder */}
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-primary/20 to-transparent"></div>
                  <div className="text-muted-foreground font-medium">Market Growth Projection Chart</div>
               </div>
            </div>

            {/* Founder */}
            <Card className="overflow-hidden">
               <div className="grid md:grid-cols-3">
                 <div className="bg-muted p-8 flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full bg-slate-200 flex items-center justify-center">
                      <FiUser className="w-16 h-16 text-slate-400" />
                    </div>
                 </div>
                 <div className="md:col-span-2 p-8">
                   <h2 className="text-2xl font-bold text-foreground mb-2">Message from the Founder</h2>
                   <h3 className="text-lg text-primary font-medium mb-4">Jerit Norville</h3>
                   <p className="text-muted-foreground mb-6">
                     &quot;Coming from a background in military service and construction, I saw firsthand the inefficiencies in how we source materials. I built GreenChainz to bridge the gap between intent and action in sustainable construction.&quot;
                   </p>
                   <Button variant="outline" asChild>
                     <a href="mailto:founder@greenchainz.com" className="gap-2">
                       <FiMail className="w-4 h-4" /> Contact Founder
                     </a>
                   </Button>
                 </div>
               </div>
            </Card>

            {/* Team Section */}
            <div>
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-foreground mb-4">Meet the Team</h2>
                <p className="text-lg text-muted-foreground">
                  Experts in construction, sustainability, and technology.
                </p>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-card p-6 rounded-xl border border-border text-center">
                  <div className="w-24 h-24 mx-auto rounded-full bg-slate-200 flex items-center justify-center mb-4">
                    <span className="text-2xl font-bold text-slate-500">JN</span>
                  </div>
                  <h3 className="font-bold text-lg mb-1">Jerit Norville</h3>
                  <p className="text-sm text-primary font-medium mb-3">Founder & CEO</p>
                  <p className="text-sm text-muted-foreground">Visionary leader with deep roots in construction and a passion for sustainable innovation.</p>
                </div>
                <div className="bg-card p-6 rounded-xl border border-border text-center">
                  <div className="w-24 h-24 mx-auto rounded-full bg-slate-200 flex items-center justify-center mb-4">
                     <span className="text-2xl font-bold text-slate-500">AS</span>
                  </div>
                  <h3 className="font-bold text-lg mb-1">Alex Smith</h3>
                  <p className="text-sm text-primary font-medium mb-3">CTO</p>
                  <p className="text-sm text-muted-foreground">Tech veteran building scalable platforms for data-heavy industries.</p>
                </div>
                <div className="bg-card p-6 rounded-xl border border-border text-center">
                   <div className="w-24 h-24 mx-auto rounded-full bg-slate-200 flex items-center justify-center mb-4">
                     <span className="text-2xl font-bold text-slate-500">LM</span>
                   </div>
                  <h3 className="font-bold text-lg mb-1">Lisa Martinez</h3>
                  <p className="text-sm text-primary font-medium mb-3">Head of Sustainability</p>
                  <p className="text-sm text-muted-foreground">LEED Accredited Professional with 15+ years of experience in green building.</p>
                </div>
              </div>
            </div>

          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
