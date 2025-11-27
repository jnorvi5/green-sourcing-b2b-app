/**
 * Help & Support Center
 *
 * FAQ, documentation, and support tickets
 */
import { useState } from 'react';
import {
  MagnifyingGlassIcon,
  QuestionMarkCircleIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  PlayCircleIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

interface ArticleItem {
  id: string;
  title: string;
  description: string;
  category: string;
  readTime: string;
  type: 'article' | 'video';
}

const FAQ_DATA: FAQItem[] = [
  {
    category: 'Getting Started',
    question: 'How do I create an account?',
    answer:
      'Click the "Sign Up" button on the homepage. Choose whether you\'re a buyer or supplier, fill in your company details, and verify your email. You\'ll be able to start browsing products or listing your inventory immediately.',
  },
  {
    category: 'Getting Started',
    question: 'What is an EPD and why does it matter?',
    answer:
      'An Environmental Product Declaration (EPD) is a standardized document that reports a product\'s environmental impacts throughout its lifecycle. EPDs are essential for green building certifications like LEED and BREEAM, and help buyers make informed decisions about sustainable materials.',
  },
  {
    category: 'Buying',
    question: 'How do I request a quote (RFQ)?',
    answer:
      'Find a product you\'re interested in and click "Request Quote." Specify your quantity, delivery requirements, and any special needs. The supplier will receive your request and respond with pricing within their stated response time.',
  },
  {
    category: 'Buying',
    question: 'Can I compare products by carbon footprint?',
    answer:
      'Yes! Our platform allows you to add products to a comparison list and view side-by-side carbon footprint data. You can filter search results by carbon intensity and see how much CO2 you\'ll save by choosing different materials.',
  },
  {
    category: 'Buying',
    question: 'How is shipping handled?',
    answer:
      'Shipping is arranged directly with suppliers. Most quotes include shipping costs based on your location. You can track orders through your dashboard and receive notifications at each stage of delivery.',
  },
  {
    category: 'Selling',
    question: 'How do I list my products?',
    answer:
      'Go to your Supplier Dashboard and click "Add Product." Enter product details, upload EPD documentation, add images, and set your pricing. Products are reviewed before going live to ensure quality standards.',
  },
  {
    category: 'Selling',
    question: 'What certifications are accepted?',
    answer:
      'We accept EPDs conforming to ISO 14025, EN 15804, and ISO 21930 standards. We also recognize certifications including Cradle to Cradle, GREENGUARD, FSC, and regional equivalents. Contact us if you have questions about specific certifications.',
  },
  {
    category: 'Payments',
    question: 'What payment methods are accepted?',
    answer:
      'We support bank transfers, credit cards, and purchase orders for qualified buyers. Payment terms are negotiated between buyers and suppliers, with standard options including Net 30, Net 60, and milestone payments.',
  },
  {
    category: 'Payments',
    question: 'Is my payment information secure?',
    answer:
      'Yes. We use industry-standard encryption and comply with PCI DSS requirements. We never store complete credit card numbers, and all transactions are processed through certified payment processors.',
  },
];

const ARTICLES: ArticleItem[] = [
  {
    id: '1',
    title: 'Complete Guide to EPDs',
    description: 'Learn everything about Environmental Product Declarations and how they impact your projects.',
    category: 'Sustainability',
    readTime: '10 min',
    type: 'article',
  },
  {
    id: '2',
    title: 'LEED v4.1 Material Requirements',
    description: 'Understanding material credit requirements for LEED certification.',
    category: 'Certifications',
    readTime: '8 min',
    type: 'article',
  },
  {
    id: '3',
    title: 'Getting Started Video Tutorial',
    description: 'A walkthrough of the platform features for new users.',
    category: 'Platform',
    readTime: '5 min',
    type: 'video',
  },
  {
    id: '4',
    title: 'Carbon Accounting for Construction',
    description: 'How to track and report embodied carbon in your building projects.',
    category: 'Sustainability',
    readTime: '12 min',
    type: 'article',
  },
  {
    id: '5',
    title: 'Submitting Your First RFQ',
    description: 'Step-by-step guide to requesting quotes from suppliers.',
    category: 'Platform',
    readTime: '4 min',
    type: 'video',
  },
  {
    id: '6',
    title: 'Supplier Onboarding Guide',
    description: 'Everything suppliers need to know to list products and start selling.',
    category: 'Platform',
    readTime: '15 min',
    type: 'article',
  },
];

export function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(FAQ_DATA.map((f) => f.category)))];

  const filteredFAQs = FAQ_DATA.filter((faq) => {
    const matchesSearch =
      searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredArticles = ARTICLES.filter(
    (article) =>
      searchQuery === '' ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero */}
      <div className="bg-gradient-to-br from-emerald-900/50 to-gray-900 border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h1 className="text-4xl font-bold mb-4">How can we help?</h1>
          <p className="text-gray-400 mb-8">
            Search our knowledge base or browse categories below
          </p>

          {/* Search */}
          <div className="relative max-w-xl mx-auto">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for help..."
              className="w-full pl-12 pr-4 py-4 bg-gray-800 border border-gray-700 rounded-xl text-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <a
            href="#faq"
            className="flex items-center gap-4 p-6 bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-xl transition-colors group"
          >
            <div className="w-12 h-12 rounded-lg bg-emerald-900/50 flex items-center justify-center">
              <QuestionMarkCircleIcon className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-medium group-hover:text-emerald-400 transition-colors">
                FAQ
              </h3>
              <p className="text-sm text-gray-500">Quick answers to common questions</p>
            </div>
            <ChevronRightIcon className="w-5 h-5 text-gray-600 ml-auto" />
          </a>

          <a
            href="#docs"
            className="flex items-center gap-4 p-6 bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-xl transition-colors group"
          >
            <div className="w-12 h-12 rounded-lg bg-blue-900/50 flex items-center justify-center">
              <BookOpenIcon className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="font-medium group-hover:text-blue-400 transition-colors">
                Documentation
              </h3>
              <p className="text-sm text-gray-500">In-depth guides and tutorials</p>
            </div>
            <ChevronRightIcon className="w-5 h-5 text-gray-600 ml-auto" />
          </a>

          <a
            href="#contact"
            className="flex items-center gap-4 p-6 bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-xl transition-colors group"
          >
            <div className="w-12 h-12 rounded-lg bg-purple-900/50 flex items-center justify-center">
              <ChatBubbleLeftRightIcon className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="font-medium group-hover:text-purple-400 transition-colors">
                Contact Support
              </h3>
              <p className="text-sm text-gray-500">Get help from our team</p>
            </div>
            <ChevronRightIcon className="w-5 h-5 text-gray-600 ml-auto" />
          </a>
        </div>

        {/* FAQ Section */}
        <section id="faq" className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-full text-sm transition-colors ${
                  activeCategory === category
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* FAQ List */}
          <div className="space-y-3">
            {filteredFAQs.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No results found for "{searchQuery}"</p>
            ) : (
              filteredFAQs.map((faq, index) => {
                const key = `${faq.category}-${index}`;
                return (
                  <div
                    key={key}
                    className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedFAQ(expandedFAQ === key ? null : key)}
                      className="w-full flex items-center justify-between px-6 py-4 text-left"
                    >
                      <span className="font-medium pr-4">{faq.question}</span>
                      <ChevronDownIcon
                        className={`w-5 h-5 text-gray-500 transition-transform ${
                          expandedFAQ === key ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {expandedFAQ === key && (
                      <div className="px-6 pb-4">
                        <div className="pt-2 border-t border-gray-700">
                          <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Documentation Section */}
        <section id="docs" className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Documentation & Guides</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article) => (
              <a
                key={article.id}
                href="#"
                className="group block p-6 bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-xl transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center">
                    {article.type === 'video' ? (
                      <PlayCircleIcon className="w-5 h-5 text-red-400" />
                    ) : (
                      <DocumentTextIcon className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <ArrowTopRightOnSquareIcon className="w-4 h-4 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="font-medium mb-2 group-hover:text-emerald-400 transition-colors">
                  {article.title}
                </h3>
                <p className="text-sm text-gray-400 mb-3">{article.description}</p>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="px-2 py-0.5 bg-gray-700 rounded">{article.category}</span>
                  <span>{article.readTime}</span>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact">
          <h2 className="text-2xl font-bold mb-6">Still Need Help?</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Form */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h3 className="font-bold mb-4">Send us a message</h3>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Subject</label>
                  <select className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500">
                    <option>General Inquiry</option>
                    <option>Technical Support</option>
                    <option>Billing Question</option>
                    <option>Partnership Opportunity</option>
                    <option>Feature Request</option>
                    <option>Report a Bug</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Message</label>
                  <textarea
                    rows={4}
                    placeholder="Describe your issue or question..."
                    className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg resize-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Attachments (Optional)</label>
                  <div className="border-2 border-dashed border-gray-700 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-500">
                      Drag files here or{' '}
                      <span className="text-emerald-400 cursor-pointer">browse</span>
                    </p>
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium transition-colors"
                >
                  Submit Request
                </button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="space-y-6">
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <h3 className="font-bold mb-4">Contact Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center">
                      <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <a href="mailto:support@greenchainz.com" className="text-emerald-400">
                        support@greenchainz.com
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center">
                      <ChatBubbleLeftRightIcon className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Live Chat</p>
                      <p className="text-gray-300">Available Mon-Fri, 9am-6pm EST</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-900/20 border border-emerald-800 rounded-xl p-6">
                <h3 className="font-bold mb-2">Priority Support</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Professional and Enterprise plan members get priority support with guaranteed
                  response times.
                </p>
                <a href="/settings#billing" className="text-emerald-400 text-sm hover:underline">
                  Upgrade your plan →
                </a>
              </div>

              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <h3 className="font-bold mb-2">System Status</h3>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-sm text-gray-400">All systems operational</span>
                </div>
                <a
                  href="https://status.greenchainz.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-emerald-400 hover:underline mt-2 inline-block"
                >
                  View status page →
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default HelpCenter;
