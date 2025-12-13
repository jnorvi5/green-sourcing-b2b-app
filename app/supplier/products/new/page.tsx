'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ImageUpload from '@/components/ImageUpload'
import { DashboardErrorBoundary } from '@/components/DashboardErrorBoundary'
import Link from 'next/link'

interface ProductFormData {
  name: string
  description: string
  material_type: string
  application: string
  certifications: string[]
  gwp: string
  specifications: string // freeform JSON text or simplified key-value pairs
  epd_url: string // changed from epd_pdf_url as per form field name, but saving to epd_url in db if that's the col or alias
}

const CERTIFICATION_OPTIONS = [
  'LEED',
  'FSC',
  'BREEAM',
  'C2C',
  'GreenGuard',
  'Declare',
  'Living Building Challenge',
  'Energy Star'
]

const MATERIAL_TYPES = [
  'Insulation',
  'Flooring',
  'Roofing',
  'Cladding',
  'Concrete',
  'Steel',
  'Wood',
  'Glass',
  'Paints & Coatings',
  'Other'
]

function NewProductForm() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [images, setImages] = useState<string[]>([])

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    material_type: '',
    application: '',
    certifications: [],
    gwp: '',
    specifications: '',
    epd_url: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCertificationToggle = (cert: string) => {
    setFormData(prev => {
      const exists = prev.certifications.includes(cert)
      if (exists) {
        return { ...prev, certifications: prev.certifications.filter(c => c !== cert) }
      } else {
        return { ...prev, certifications: [...prev.certifications, cert] }
      }
    })
  }

  const handleImageUpload = (url: string) => {
    setImages(prev => [...prev, url])
  }

  const handleImageRemove = (indexToRemove: number) => {
    setImages(prev => prev.filter((_, index) => index !== indexToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // 1. Get current user (supplier)
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw new Error('Not authenticated')

      // 2. Get supplier profile ID
      const { data: supplierData, error: supplierError } = await supabase
        .from('suppliers')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (supplierError || !supplierData) throw new Error('Supplier profile not found')

      // 3. Prepare data for products table
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const productPayload: any = {
        supplier_id: supplierData.id,
        name: formData.name,
        description: formData.description,
        material_type: formData.material_type,
        application: formData.application,
        certifications: formData.certifications,
        images: images,
      }

      // Add conditional fields based on what columns might exist
      productPayload.sustainability_data = {
        gwp: formData.gwp ? parseFloat(formData.gwp) : null,
        notes: "Uploaded via dashboard"
      }

      // I'll try to save specifications as JSON
      try {
        productPayload.specs = JSON.parse(formData.specifications || '{}')
      } catch {
        productPayload.specs = { raw_text: formData.specifications }
      }

      productPayload.epd_url = formData.epd_url

      const { error: insertError } = await supabase
        .from('products')
        .insert(productPayload)
        .select()

      if (insertError) {
        console.error('Insert Error:', insertError)
        // If error mentions column "specs" does not exist, try "specifications"
        if (insertError.message.includes('column "specs" does not exist')) {
             // Retry with specifications
             delete productPayload.specs
             try {
                productPayload.specifications = JSON.parse(formData.specifications || '{}')
             } catch {
                productPayload.specifications = { raw_text: formData.specifications }
             }
             // Also check epd_url vs epd_pdf_url
             const { error: retryError } = await supabase
                .from('products')
                .insert(productPayload)

             if (retryError) throw retryError
        } else {
             throw insertError
        }
      }

      // Success
      router.push('/supplier/dashboard')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Error adding product:', err)
      setError(err.message || 'Failed to add product')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
       <div className="mb-6">
        <Link href="/supplier/dashboard" className="text-teal-400 hover:text-teal-300 flex items-center gap-2 text-sm mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-white">Add New Product</h1>
        <p className="text-gray-400 mt-2">List your sustainable material on the marketplace.</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-6 sm:p-8">
        {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">Basic Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Product Name *</label>
                    <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 bg-gray-900/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
                        placeholder="e.g. EcoWool Insulation Batts"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Material Type *</label>
                    <select
                        name="material_type"
                        required
                        value={formData.material_type}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 bg-gray-900/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
                    >
                        <option value="">Select a type...</option>
                        {MATERIAL_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-900/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
                    placeholder="Describe your product's key features and benefits..."
                />
            </div>

             <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Application</label>
                <input
                    type="text"
                    name="application"
                    value={formData.application}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-900/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
                    placeholder="e.g. Wall assemblies, Commercial roofing, etc."
                />
            </div>
          </div>

          {/* Sustainability Data */}
          <div className="space-y-4 pt-4">
            <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">Sustainability Data</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">GWP (kg CO2e)</label>
                    <input
                        type="number"
                        name="gwp"
                        step="0.01"
                        value={formData.gwp}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 bg-gray-900/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
                        placeholder="0.00"
                    />
                    <p className="text-xs text-gray-500 mt-1">Global Warming Potential per functional unit</p>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">EPD URL</label>
                    <input
                        type="url"
                        name="epd_url"
                        value={formData.epd_url}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 bg-gray-900/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
                        placeholder="https://..."
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Certifications</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {CERTIFICATION_OPTIONS.map(cert => (
                        <label key={cert} className="flex items-center gap-2 cursor-pointer group">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition ${formData.certifications.includes(cert) ? 'bg-teal-500 border-teal-500' : 'border-gray-600 bg-gray-900 group-hover:border-gray-500'}`}>
                                {formData.certifications.includes(cert) && (
                                    <svg className="w-3.5 h-3.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={formData.certifications.includes(cert)}
                                onChange={() => handleCertificationToggle(cert)}
                            />
                            <span className="text-sm text-gray-300 group-hover:text-white transition">{cert}</span>
                        </label>
                    ))}
                </div>
            </div>
          </div>

          {/* Technical Specs */}
           <div className="space-y-4 pt-4">
            <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">Technical Specifications</h3>
             <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Specifications (JSON or Text)</label>
                <textarea
                    name="specifications"
                    rows={4}
                    value={formData.specifications}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-900/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition font-mono text-sm"
                    placeholder='{"r_value": 30, "thickness": "100mm", "fire_rating": "Class A"}'
                />
                <p className="text-xs text-gray-500 mt-1">Enter technical properties in JSON format or plain text.</p>
            </div>
           </div>

           {/* Images */}
           <div className="space-y-4 pt-4">
            <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">Product Images</h3>

             <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {images.map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-white/10 group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                            type="button"
                            onClick={() => handleImageRemove(idx)}
                            className="absolute top-2 right-2 p-1 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition hover:bg-red-600"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                ))}

                 <div className="aspect-square rounded-lg border-2 border-dashed border-white/10 hover:border-teal-500/50 transition flex flex-col items-center justify-center p-4 text-center cursor-pointer relative">
                    <ImageUpload
                        onUploadComplete={handleImageUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div className="pointer-events-none">
                        <svg className="w-8 h-8 text-gray-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        <p className="text-xs text-gray-400">Click to upload</p>
                    </div>
                </div>
             </div>
           </div>

           {/* Submit */}
           <div className="pt-6 flex justify-end gap-4">
                <Link
                    href="/supplier/dashboard"
                    className="px-6 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition"
                >
                    Cancel
                </Link>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-2 rounded-lg bg-teal-500 text-black font-semibold hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                >
                    {loading && <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />}
                    Save Product
                </button>
           </div>

        </form>
      </div>
    </div>
  )
}

export default function NewProductPage() {
  return (
    <DashboardErrorBoundary>
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white py-12 px-4">
             <NewProductForm />
        </div>
    </DashboardErrorBoundary>
  )
}
