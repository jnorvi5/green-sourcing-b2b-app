'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import BuyCleanActCountdown from '@/components/BuyCleanActCountdown'
import { FaSearch, FaMapMarkerAlt, FaLeaf, FaBalanceScale, FaPaperPlane, FaCheckSquare, FaSquare, FaTimes } from 'react-icons/fa'

// Types
interface Product {
  id: string
  name: string
  description?: string
  image_url?: string
  gwp?: number // Global Warming Potential
  specifications?: any
  supplier?: {
    company_name: string
    location?: string
  }
  certifications?: string[]
  supplier_id?: string
}

interface RFQ {
  id: string
  created_at: string
  message: string
  status: string
  profiles?: {
    company_name: string
  }
}

function ArchitectDashboardInner() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [sentRFQs, setSentRFQs] = useState<RFQ[]>([])
  const [loading, setLoading] = useState(true)
  const [isTestMode, setIsTestMode] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  // Search State
  const [searchTerm, setSearchTerm] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [carbonThreshold, setCarbonThreshold] = useState<number | ''>('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Compare State
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])
  const [showCompareModal, setShowCompareModal] = useState(false)

  // RFQ State
  const [rfqModalOpen, setRfqModalOpen] = useState(false)
  const [rfqTargetProduct, setRfqTargetProduct] = useState<Product | null>(null)
  const [rfqMessage, setRfqMessage] = useState('')
  const [rfqQuantity, setRfqQuantity] = useState('')

  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Mock Data for Test Mode
  const MOCK_PRODUCTS: Product[] = [
    {
      id: 'p1',
      name: 'Eco-Friendly Insulation Batts',
      description: 'Recycled glass insulation with low embodied carbon.',
      gwp: 1.2,
      supplier: { company_name: 'GreenBuild Supplies', location: 'Portland, OR' },
      certifications: ['LEED', 'Greenguard'],
      image_url: 'https://images.unsplash.com/photo-1599696846175-654877797745?auto=format&fit=crop&q=80&w=300&h=200'
    },
    {
      id: 'p2',
      name: 'Reclaimed Oak Flooring',
      description: 'Sustainably sourced reclaimed wood flooring.',
      gwp: 0.5,
      supplier: { company_name: 'Heritage Timbers', location: 'Austin, TX' },
      certifications: ['FSC Recycled'],
      image_url: 'https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?auto=format&fit=crop&q=80&w=300&h=200'
    },
    {
      id: 'p3',
      name: 'Low-Carbon Concrete Block',
      description: 'Concrete blocks made with fly ash and recycled aggregates.',
      gwp: 8.5,
      supplier: { company_name: 'CarbonCure Inc', location: 'Seattle, WA' },
      certifications: ['EPD Verified'],
      image_url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=300&h=200'
    },
    {
      id: 'p4',
      name: 'Hempcrete Panels',
      description: 'Carbon-negative wall panels made from hemp hurds.',
      gwp: -0.5,
      supplier: { company_name: 'HempBlock', location: 'Denver, CO' },
      certifications: ['C2C Silver'],
      image_url: 'https://images.unsplash.com/photo-1595846519845-68e298c2edd8?auto=format&fit=crop&q=80&w=300&h=200'
    }
  ]

  const loadDashboard = useCallback(async () => {
    try {
      // Check if using test token
      const token = localStorage.getItem('auth-token');
      const isTest = token?.startsWith('test_');
      setIsTestMode(isTest || false);

      if (isTest) {
        // Demo data for test mode
        const userType = localStorage.getItem('user-type');
        setUser({
          id: 'test-user',
          email: userType === 'supplier' ? 'demo@supplier.com' : 'demo@architect.com',
        });
        setProfile({
          id: 'test-user',
          full_name: userType === 'supplier' ? 'Demo Supplier' : 'Demo Architect',
          role: 'architect',
        });
        setSentRFQs([
          {
            id: '1',
            created_at: new Date().toISOString(),
            message: 'This is a demo RFQ in test mode',
            status: 'Pending',
            profiles: { company_name: 'Demo Supplier' },
          },
        ]);
        setSearchResults(MOCK_PRODUCTS); // Initial load of mock products
        setLoading(false);
        return;
      }

      // Production: Use real Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData?.role !== 'architect') {
        router.push('/');
        return;
      }
      setProfile(profileData);

      // Load sent RFQs
      const { data: rfqsData } = await supabase
        .from('rfqs')
        .select(`
          *,
          profiles!rfqs_supplier_id_fkey(company_name)
        `)
        .eq('architect_id', user.id)
        .order('created_at', { ascending: false });

      setSentRFQs(rfqsData || []);

      // Initial Product Load
      await handleSearch();

    } catch (error) {
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    loadDashboard();
    if (searchParams && searchParams.get('rfq') === 'created') {
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);
    }
  }, [loadDashboard, searchParams]);

  // Search Handler
  const handleSearch = async () => {
    setIsSearching(true);
    try {
      if (isTestMode) {
        // Filter mock products
        let results = [...MOCK_PRODUCTS];
        if (searchTerm) {
          const lower = searchTerm.toLowerCase();
          results = results.filter(p => p.name.toLowerCase().includes(lower) || p.description?.toLowerCase().includes(lower));
        }
        if (locationFilter) {
          results = results.filter(p => p.supplier?.location?.toLowerCase().includes(locationFilter.toLowerCase()));
        }
        if (carbonThreshold !== '') {
          results = results.filter(p => (p.gwp || 0) <= Number(carbonThreshold));
        }
        setSearchResults(results);
      } else {
        // Real Supabase Query
        // 1. Fetch Products
        let query = supabase.from('products').select('*');

        if (searchTerm) {
          query = query.ilike('name', `%${searchTerm}%`);
        }

        const { data: productData, error: productError } = await query;
        if (productError) throw productError;

        if (!productData || productData.length === 0) {
            setSearchResults([]);
            return;
        }

        // 2. Fetch Suppliers for these products
        // Collect supplier IDs (which are user IDs)
        const supplierIds = Array.from(new Set(productData.map((p: any) => p.supplier_id).filter(Boolean)));

        // Fetch from 'suppliers' table first, fall back to 'profiles'
        const { data: supplierData } = await supabase
            .from('suppliers')
            .select('id, company_name, location')
            .in('id', supplierIds);

        const supplierMap = new Map();
        supplierData?.forEach((s: any) => supplierMap.set(s.id, s));

        // Map data to Product interface
        let products: Product[] = productData.map((item: any) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            image_url: item.image_url,
            gwp: item.sustainability_data?.carbon_footprint || item.gwp || 0,
            specifications: item.specifications,
            supplier_id: item.supplier_id,
            supplier: {
                company_name: supplierMap.get(item.supplier_id)?.company_name || 'Unknown Supplier',
                location: supplierMap.get(item.supplier_id)?.location || 'Global'
            },
            certifications: item.certifications || []
        }));

        // Client-side carbon filter
        if (carbonThreshold !== '') {
            products = products.filter(p => (p.gwp || 0) <= Number(carbonThreshold));
        }

        // Client-side location filter
        if (locationFilter) {
            const lowerLoc = locationFilter.toLowerCase();
            products = products.filter(p => p.supplier?.location?.toLowerCase().includes(lowerLoc));
        }

        setSearchResults(products);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Comparison Logic
  const toggleCompare = (product: Product) => {
    if (selectedProducts.find(p => p.id === product.id)) {
      setSelectedProducts(prev => prev.filter(p => p.id !== product.id));
    } else {
      if (selectedProducts.length >= 3) {
        alert("You can compare up to 3 products.");
        return;
      }
      setSelectedProducts(prev => [...prev, product]);
    }
  };

  // RFQ Logic
  const openRfqModal = (product: Product) => {
    setRfqTargetProduct(product);
    setRfqMessage(`I am interested in ${product.name}. Please provide a quote for the following project.`);
    setRfqModalOpen(true);
  };

  const sendRfq = async () => {
    if (!rfqTargetProduct) return;

    // Simulate or Real Send
    if (isTestMode) {
      setSentRFQs(prev => [{
        id: Math.random().toString(),
        created_at: new Date().toISOString(),
        message: rfqMessage,
        status: 'Pending',
        profiles: { company_name: rfqTargetProduct.supplier?.company_name || 'Mock Supplier' }
      }, ...prev]);
      setRfqModalOpen(false);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
      return;
    }

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Insert into RFQs table
        const { error } = await supabase.from('rfqs').insert({
            architect_id: user.id,
            supplier_id: rfqTargetProduct.supplier_id, // This assumes we have this field from fetch
            product_id: rfqTargetProduct.id,
            message: `${rfqMessage}\n\nQuantity: ${rfqQuantity}`,
            status: 'Pending'
        });

        if (error) throw error;

        // Refresh Sent RFQs
        const { data: rfqsData } = await supabase
            .from('rfqs')
            .select(`
            *,
            profiles!rfqs_supplier_id_fkey(company_name)
            `)
            .eq('architect_id', user.id)
            .order('created_at', { ascending: false });

        setSentRFQs(rfqsData || []);

        setRfqModalOpen(false);
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);

    } catch (err) {
        console.error('Failed to send RFQ', err);
        alert('Failed to send RFQ');
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('auth-token');
    localStorage.removeItem('user-type');
    if (!isTestMode) {
      await supabase.auth.signOut();
    }
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
            <div className="inline-block w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white pb-20">
      <div className="container mx-auto px-4 py-8">

        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              Architect Dashboard
            </h1>
            <p className="text-gray-400">
              Welcome back, {profile?.full_name || user?.email}
            </p>
          </div>
          <div className="flex gap-3">
             <Link href="/architect/rfqs" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700">
                My RFQs
             </Link>
             <button onClick={handleLogout} className="px-4 py-2 bg-gray-800 hover:bg-red-900/50 rounded-lg transition-colors border border-gray-700 hover:border-red-800">
                Logout
            </button>
          </div>
        </div>

        {/* Compliance Countdown */}
        <BuyCleanActCountdown />

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/search"
            className="p-6 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 hover:border-teal-500 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-teal-500/10 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-teal-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white">Search Products</h3>
                <p className="text-sm text-gray-400">
                  Find green materials
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/architect/rfqs"
            className="p-6 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 hover:border-teal-500 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-teal-500/10 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-teal-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white">My RFQs</h3>
                <p className="text-sm text-gray-400">
                  View all requests
                </p>
              </div>
            </div>
          </Link>
        </div>
        {/* Success Toast */}
        {showSuccessMessage && (
          <div className="fixed top-4 right-4 z-50 p-4 bg-teal-500/10 border border-teal-500/30 rounded-lg text-teal-400 flex items-center gap-3 shadow-lg backdrop-blur-md">
            <FaCheckSquare />
            <span>Request sent successfully!</span>
          </div>
        )}

        {/* Search & Filter Section */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8 backdrop-blur-sm">
            <h2 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
                <FaSearch className="text-teal-400" /> Material Search
            </h2>
            <div className="grid md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                    <label className="block text-xs text-gray-400 mb-1">Material / Keyword</label>
                    <input
                        type="text"
                        placeholder="e.g. Insulation, Concrete, Flooring..."
                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 focus:border-teal-500 outline-none transition-colors"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-xs text-gray-400 mb-1">Location</label>
                    <div className="relative">
                        <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            placeholder="City or Region"
                            className="w-full bg-black/20 border border-white/10 rounded-lg pl-9 pr-4 py-2 focus:border-teal-500 outline-none transition-colors"
                            value={locationFilter}
                            onChange={(e) => setLocationFilter(e.target.value)}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs text-gray-400 mb-1">Max Carbon (kg CO2e)</label>
                    <div className="relative">
                        <FaLeaf className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="number"
                            placeholder="Threshold"
                            className="w-full bg-black/20 border border-white/10 rounded-lg pl-9 pr-4 py-2 focus:border-teal-500 outline-none transition-colors"
                            value={carbonThreshold}
                            onChange={(e) => setCarbonThreshold(e.target.value === '' ? '' : Number(e.target.value))}
                        />
                    </div>
                </div>
            </div>
            <div className="mt-4 flex justify-end">
                <button
                    onClick={handleSearch}
                    className="px-6 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                    {isSearching ? 'Searching...' : 'Find Materials'}
                </button>
            </div>
        </div>

        {/* Results Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {searchResults.map((product) => {
                const isSelected = !!selectedProducts.find(p => p.id === product.id);
                return (
                    <div key={product.id} className={`bg-gray-900 border ${isSelected ? 'border-teal-500' : 'border-gray-800'} rounded-xl overflow-hidden hover:border-gray-600 transition-colors flex flex-col`}>
                        <div className="h-48 bg-gray-800 relative">
                             {product.image_url ? (
                                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                             ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-600">No Image</div>
                             )}
                             {product.gwp !== undefined && (
                                 <div className="absolute top-2 right-2 bg-black/70 backdrop-blur text-white text-xs px-2 py-1 rounded flex items-center gap-1 border border-white/10">
                                     <FaLeaf className="text-emerald-400" /> {product.gwp} kg CO2e
                                 </div>
                             )}
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                            <h3 className="text-lg font-bold text-white mb-1">{product.name}</h3>
                            <p className="text-sm text-teal-400 mb-2">{product.supplier?.company_name}</p>
                            <p className="text-gray-400 text-sm mb-4 line-clamp-2">{product.description}</p>

                            <div className="mt-auto flex items-center justify-between gap-3 pt-4 border-t border-gray-800">
                                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer hover:text-white select-none">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-teal-500 border-teal-500' : 'border-gray-600 bg-transparent'}`}>
                                        {isSelected && <FaCheckSquare className="text-white text-xs" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={isSelected}
                                        onChange={() => toggleCompare(product)}
                                    />
                                    Compare
                                </label>
                                <button
                                    onClick={() => openRfqModal(product)}
                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Request Quote
                                </button>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>

        {searchResults.length === 0 && !isSearching && (
            <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10 border-dashed">
                <p className="text-gray-400">No products found. Try adjusting your search filters.</p>
            </div>
        )}

        {/* Floating Compare Action */}
        {selectedProducts.length > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 border border-teal-500/50 shadow-2xl rounded-full px-6 py-3 flex items-center gap-4 z-40 animate-fade-in-up">
                <span className="text-white font-medium flex items-center gap-2">
                    <FaBalanceScale className="text-teal-400" />
                    {selectedProducts.length} Selected
                </span>
                <button
                    onClick={() => setShowCompareModal(true)}
                    className="bg-teal-600 hover:bg-teal-500 text-white px-4 py-1.5 rounded-full text-sm font-bold transition-colors"
                >
                    Compare Now
                </button>
                <button
                    onClick={() => setSelectedProducts([])}
                    className="text-gray-400 hover:text-white transition-colors"
                >
                    <FaTimes />
                </button>
            </div>
        )}

        {/* Compare Modal */}
        {showCompareModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden shadow-2xl">
                    <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-850">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <FaBalanceScale className="text-teal-400" /> Product Comparison
                        </h2>
                        <button onClick={() => setShowCompareModal(false)} className="text-gray-400 hover:text-white">
                            <FaTimes size={24} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-auto p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 min-w-[800px]">
                            {selectedProducts.map(product => (
                                <div key={product.id} className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                                    <div className="h-40 bg-gray-700 rounded-lg mb-4 overflow-hidden">
                                         {product.image_url ? (
                                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                         ) : (
                                            <div className="flex items-center justify-center h-full text-gray-500">No Image</div>
                                         )}
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">{product.name}</h3>
                                    <p className="text-teal-400 mb-4">{product.supplier?.company_name}</p>

                                    <div className="space-y-4">
                                        <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700/50">
                                            <span className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Carbon Footprint</span>
                                            <span className="text-xl font-mono text-emerald-400 font-bold">{product.gwp ?? 'N/A'} <span className="text-sm text-gray-500 font-normal">kg CO2e</span></span>
                                        </div>

                                        <div>
                                            <span className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Location</span>
                                            <p className="text-gray-300">{product.supplier?.location || 'Unknown'}</p>
                                        </div>

                                        <div>
                                            <span className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Certifications</span>
                                            <div className="flex flex-wrap gap-2">
                                                {product.certifications?.map((cert, i) => (
                                                    <span key={i} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-gray-300">{cert}</span>
                                                ))}
                                                {(!product.certifications || product.certifications.length === 0) && <span className="text-gray-500 text-sm">-</span>}
                                            </div>
                                        </div>

                                        <div>
                                            <span className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Description</span>
                                            <p className="text-sm text-gray-400">{product.description}</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => { setShowCompareModal(false); openRfqModal(product); }}
                                        className="w-full mt-6 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-medium transition-colors"
                                    >
                                        Select & Request Quote
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* RFQ Modal */}
        {rfqModalOpen && rfqTargetProduct && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg p-6 shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-white">Request Quote</h3>
                        <button onClick={() => setRfqModalOpen(false)} className="text-gray-400 hover:text-white">
                            <FaTimes />
                        </button>
                    </div>

                    <div className="mb-6 bg-gray-800 p-4 rounded-lg flex items-start gap-4">
                        <div className="w-16 h-16 bg-gray-700 rounded overflow-hidden flex-shrink-0">
                             {rfqTargetProduct.image_url && <img src={rfqTargetProduct.image_url} className="w-full h-full object-cover" />}
                        </div>
                        <div>
                            <h4 className="font-bold text-white">{rfqTargetProduct.name}</h4>
                            <p className="text-sm text-teal-400">{rfqTargetProduct.supplier?.company_name}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Quantity / Area</label>
                            <input
                                type="text"
                                className="w-full bg-black/20 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-teal-500 outline-none"
                                placeholder="e.g. 500 sq ft"
                                value={rfqQuantity}
                                onChange={(e) => setRfqQuantity(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Message to Supplier</label>
                            <textarea
                                className="w-full bg-black/20 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-teal-500 outline-none h-32 resize-none"
                                value={rfqMessage}
                                onChange={(e) => setRfqMessage(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-8">
                        <button
                            onClick={() => setRfqModalOpen(false)}
                            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={sendRfq}
                            className="px-6 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                            <FaPaperPlane /> Send Request
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </main>
  );
}

export default function ArchitectDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>}>
      <ArchitectDashboardInner />
    </Suspense>
  );
}
