import Header from "@/components/Header";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FiSearch, FiFileText, FiCheckCircle, FiUpload, FiBarChart2, FiMessageSquare } from "react-icons/fi";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "How It Works | GreenChainz",
  description: "See how GreenChainz connects architects and suppliers for sustainable construction.",
};

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-muted/30 py-20 px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-6">
            How GreenChainz Works
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            A unified platform for verified sustainable material sourcing.
            Choose your path below.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="#architects">For Architects</Link>
            </Button>
            <Button size="lg" variant="secondary" className="border border-input" asChild>
              <Link href="#suppliers">For Suppliers</Link>
            </Button>
          </div>
        </section>

        {/* Architects Flow */}
        <section id="architects" className="py-24 px-4 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row gap-12 items-center mb-16">
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold text-primary mb-2">For Architects & Developers</h2>
              <p className="text-2xl font-semibold text-foreground mb-6">Stop chasing PDFs. Start specifying with confidence.</p>
              <p className="text-muted-foreground text-lg mb-8">
                GreenChainz centralizes certification data, so you can find products that meet LEED, WELL, and local code requirements in seconds, not weeks.
              </p>
              <Button asChild>
                <Link href="/signup">Start Searching Free</Link>
              </Button>
            </div>
            <div className="md:w-1/2 grid grid-cols-1 gap-6">
              <FlowStep
                number="01"
                icon={<FiSearch />}
                title="Search & Filter"
                description="Find materials by performance specs AND sustainability criteria (GWP, Recycled Content, VOCs)."
              />
              <FlowStep
                number="02"
                icon={<FiFileText />}
                title="Verify Certifications"
                description="View verified EPDs, HPDs, and certifications directly on the product page. No expired documents."
              />
              <FlowStep
                number="03"
                icon={<FiMessageSquare />}
                title="Request Quotes"
                description="Send RFQs to multiple suppliers with one click. Manage all communication in one dashboard."
              />
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="border-t border-border max-w-7xl mx-auto" />

        {/* Suppliers Flow */}
        <section id="suppliers" className="py-24 px-4 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row-reverse gap-12 items-center">
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold text-teal-600 dark:text-teal-400 mb-2">For Suppliers & Manufacturers</h2>
              <p className="text-2xl font-semibold text-foreground mb-6">Get your green products in front of decision-makers.</p>
              <p className="text-muted-foreground text-lg mb-8">
                Don&apos;t let your sustainability investments go unnoticed. Showcase your verified data to architects actively looking for green solutions.
              </p>
              <Button variant="default" className="bg-teal-600 hover:bg-teal-700" asChild>
                <Link href="/signup">List Your Products</Link>
              </Button>
            </div>
            <div className="md:w-1/2 grid grid-cols-1 gap-6">
              <FlowStep
                number="01"
                icon={<FiUpload />}
                title="Upload Product Data"
                description="Import your catalog manually or via API. We support standard formats for technical and sustainability specs."
              />
              <FlowStep
                number="02"
                icon={<FiCheckCircle />}
                title="Get Verified"
                description="Our team verifies your certifications (EPDs, FSC, etc.) and awards the GreenChainz Verified badge."
              />
              <FlowStep
                number="03"
                icon={<FiBarChart2 />}
                title="Receive Leads"
                description="Get qualified RFQs from architects who have already vetted your product's performance and impact."
              />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-primary/5 text-center px-4">
          <h2 className="text-3xl font-bold mb-6">Ready to build better?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join the network of forward-thinking professionals transforming the construction industry.
          </p>
          <Button size="lg" className="px-8 text-lg" asChild>
            <Link href="/signup">Get Started Today</Link>
          </Button>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function FlowStep({ number, title, description }: { number: string, icon: React.ReactNode, title: string, description: string }) {
  return (
    <Card className="border border-border/50 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6 flex items-start gap-4">
        <div className="text-4xl font-black text-muted/20 leading-none select-none">
          {number}
        </div>
        <div>
          <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
