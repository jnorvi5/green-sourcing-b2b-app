import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Licensing | GreenChainz Market Intelligence",
  description: "Access aggregated, anonymized market intelligence on sustainable building materials demand. Quarterly reports with search trends, certification demand, and geographic analysis.",
};

export default function DataLicensingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Sustainable Building Materials
            <span className="block text-green-600">Market Intelligence</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Aggregated, anonymized data on architect search behavior, certification demand, 
            and market trends. Power your product development, marketing, and research 
            with real market signals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#pricing"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
            >
              View Pricing
            </a>
            <a
              href="#sample"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-green-700 bg-white border-2 border-green-600 rounded-lg hover:bg-green-50 transition-colors"
            >
              Request Sample Report
            </a>
          </div>
        </div>
      </section>

      {/* Data Points Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            What You&apos;ll Get
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <DataPointCard
              icon="🔍"
              title="Search Trends"
              description="Top 100 searched materials with volume, category, and trend direction"
            />
            <DataPointCard
              icon="📜"
              title="Certification Demand"
              description="Which certifications architects prioritize: FSC, LEED, C2C, EPD, and more"
            />
            <DataPointCard
              icon="🗺️"
              title="Geographic Analysis"
              description="Demand heatmaps showing market opportunities by region"
            />
            <DataPointCard
              icon="💰"
              title="Price Sensitivity"
              description="Budget ranges and price points architects are searching for"
            />
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-green-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Who Benefits
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <UseCaseCard
              icon="🏭"
              title="Material Manufacturers"
              items={[
                "Identify product development opportunities",
                "Benchmark certification ROI",
                "Understand regional demand patterns",
                "Optimize pricing strategies"
              ]}
            />
            <UseCaseCard
              icon="📊"
              title="EPD & Certification Bodies"
              items={[
                "Track adoption trends",
                "Identify high-value certifications",
                "Measure market penetration",
                "Plan outreach campaigns"
              ]}
            />
            <UseCaseCard
              icon="🔬"
              title="Research & Analytics Firms"
              items={[
                "Enhance market reports",
                "Validate research hypotheses",
                "Track sustainability adoption",
                "Inform industry forecasts"
              ]}
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Data Licensing Plans
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Quarterly reports delivered on Jan 1, Apr 1, Jul 1, Oct 1. 
            Enterprise customers get real-time API access.
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <PricingCard
              title="Basic Report"
              price="$5,000"
              period="per quarter"
              features={[
                "Top 100 searched keywords",
                "Certification demand trends",
                "Geographic demand heatmap",
                "PDF & CSV delivery",
                "Quarterly email updates"
              ]}
              cta="Get Started"
              ctaHref="mailto:data@greenchainz.com?subject=Basic%20Data%20License%20Inquiry"
            />
            <PricingCard
              title="Premium Report"
              price="$10,000"
              period="per quarter"
              features={[
                "Everything in Basic",
                "RFQ conversion analysis",
                "Certification win rates",
                "Competitive benchmarking",
                "Price premium analysis",
                "API access to raw data"
              ]}
              cta="Contact Sales"
              ctaHref="mailto:data@greenchainz.com?subject=Premium%20Data%20License%20Inquiry"
              highlighted={true}
            />
            <PricingCard
              title="Enterprise License"
              price="$50,000"
              period="per year"
              features={[
                "Everything in Premium",
                "Real-time API access",
                "Custom data queries",
                "Quarterly strategy call",
                "Dedicated account manager",
                "Custom report generation"
              ]}
              cta="Schedule Demo"
              ctaHref="mailto:data@greenchainz.com?subject=Enterprise%20Data%20License%20Inquiry"
            />
          </div>
        </div>
      </section>

      {/* Sample Report Section */}
      <section id="sample" className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Request a Sample Report
          </h2>
          <p className="text-gray-600 mb-8">
            See the quality and depth of our market intelligence before you commit. 
            We&apos;ll send you a redacted sample from last quarter.
          </p>
          <form 
            className="max-w-md mx-auto space-y-4"
            action="https://formspree.io/f/data@greenchainz.com"
            method="POST"
          >
            <input type="hidden" name="_subject" value="Sample Report Request - Data Licensing" />
            <input
              type="text"
              name="name"
              placeholder="Your Name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Work Email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
            <input
              type="text"
              name="company"
              placeholder="Company Name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
            <select
              name="interest"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
              required
            >
              <option value="">What&apos;s your interest?</option>
              <option value="manufacturer">Material Manufacturer</option>
              <option value="epd-body">EPD/Certification Body</option>
              <option value="research">Research/Analytics Firm</option>
              <option value="other">Other</option>
            </select>
            <button
              type="submit"
              className="w-full px-8 py-4 text-lg font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
            >
              Request Sample
            </button>
            <p className="text-sm text-gray-500 text-center">
              Or email us directly at{" "}
              <a href="mailto:data@greenchainz.com" className="text-green-600 hover:underline">
                data@greenchainz.com
              </a>
            </p>
          </form>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Trusted by Industry Leaders
          </h2>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-60">
            <span className="text-xl font-semibold text-gray-500">EPD International</span>
            <span className="text-xl font-semibold text-gray-500">EPD Hub</span>
            <span className="text-xl font-semibold text-gray-500">Building Transparency</span>
            <span className="text-xl font-semibold text-gray-500">Dodge Data Analytics</span>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <FAQItem
              question="How is the data collected?"
              answer="Data is collected from architect and contractor search and filter behavior on the GreenChainz platform. All data is anonymized and aggregated—we never share individual user information."
            />
            <FAQItem
              question="How often is data updated?"
              answer="Quarterly reports are generated on Jan 1, Apr 1, Jul 1, and Oct 1. Enterprise customers with API access receive daily data updates."
            />
            <FAQItem
              question="Can I request custom reports?"
              answer="Yes! Enterprise license customers can request custom data queries and reports. Contact us to discuss your specific needs."
            />
            <FAQItem
              question="What format is the data delivered in?"
              answer="Basic and Premium reports are delivered as PDF reports and CSV data files. Premium and Enterprise tiers also include JSON API access."
            />
            <FAQItem
              question="Is this data exclusive?"
              answer="The data insights are not exclusive—we license to multiple customers. However, we limit the number of customers per industry vertical to maintain value."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-green-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Access Market Intelligence?
          </h2>
          <p className="text-green-100 text-lg mb-8">
            Join leading EPD bodies, manufacturers, and research firms who use 
            GreenChainz data to inform their strategies.
          </p>
          <a
            href="mailto:data@greenchainz.com?subject=Data%20Licensing%20Inquiry"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-green-600 bg-white rounded-lg hover:bg-green-50 transition-colors"
          >
            Contact Sales
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto text-center">
          <p>© 2024-2025 GreenChainz, Inc. All rights reserved.</p>
          <p className="mt-2 text-sm">
            All data is aggregated and anonymized. No individual user data is shared.
          </p>
        </div>
      </footer>
    </div>
  );
}

function DataPointCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="text-center p-6 rounded-lg bg-green-50 hover:bg-green-100 transition-colors">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function UseCaseCard({ icon, title, items }: { icon: string; title: string; items: string[] }) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-4">{title}</h3>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span className="text-gray-600">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PricingCard({
  title,
  price,
  period,
  features,
  cta,
  ctaHref,
  highlighted = false
}: {
  title: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  ctaHref: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-8 ${
        highlighted
          ? "bg-green-600 text-white ring-4 ring-green-300 scale-105"
          : "bg-white border-2 border-gray-200"
      }`}
    >
      <h3 className={`text-xl font-semibold mb-2 ${highlighted ? "text-white" : "text-gray-900"}`}>
        {title}
      </h3>
      <div className="mb-6">
        <span className={`text-4xl font-bold ${highlighted ? "text-white" : "text-gray-900"}`}>
          {price}
        </span>
        <span className={`text-sm ${highlighted ? "text-green-100" : "text-gray-500"}`}>
          {" "}{period}
        </span>
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <span className={`mr-2 ${highlighted ? "text-green-200" : "text-green-500"}`}>✓</span>
            <span className={highlighted ? "text-green-50" : "text-gray-600"}>{feature}</span>
          </li>
        ))}
      </ul>
      <a
        href={ctaHref}
        className={`block w-full text-center py-3 px-6 rounded-lg font-semibold transition-colors ${
          highlighted
            ? "bg-white text-green-600 hover:bg-green-50"
            : "bg-green-600 text-white hover:bg-green-700"
        }`}
      >
        {cta}
      </a>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{question}</h3>
      <p className="text-gray-600">{answer}</p>
    </div>
  );
}
