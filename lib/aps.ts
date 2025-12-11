/**
 * Autodesk Platform Services (APS) Integration
 * - 2-legged OAuth
 * - Model Derivative API (SVF2 translation + status)
 * - Cached carbon data lookups via MongoDB
 *
 * Zero `any` types; defensive error handling.
 */
import mongoose, { Model } from 'mongoose'

const CLIENT_ID = process.env['AUTODESK_CLIENT_ID']
const CLIENT_SECRET = process.env['AUTODESK_CLIENT_SECRET']
const AUTH_URL = 'https://developer.api.autodesk.com/authentication/v2/token'
const MONGODB_URI = process.env['MONGODB_URI']

type AutodeskTokenResponse = {
  access_token: string
  token_type: string
  expires_in: number
}

type CachedToken = {
  accessToken: string
  expiresAt: number
}

type LifecycleStages = {
  a1a3?: number
  [key: string]: number | undefined
}

type EmbodiedCarbon = {
  id: string
  name?: string
  category?: string
  gwp: number
  gwpUnit?: string
  declaredUnit?: string
  lifecycleStages?: LifecycleStages
  benchmarks?: unknown
  source: string
  methodology: string
  scope: string[]
  cached: boolean
  matchType?: 'category'
  last_updated?: Date
}

type CarbonFactor = {
  factorId?: string
  type: 'electricity' | 'transport' | 'fuel'
  country?: string
  region?: string
  subregion?: string
  mode?: string
  value: number
  unit: string
}

type LowCarbonAlternative = {
  name: string
  reduction?: number
  description?: string
  gwp?: number
  gwpUnit?: string
  declaredUnit?: string
}

type UnitConversion = {
  materialCategory: string
  density?: number
  conversions: Array<{
    fromUnit: string
    toUnit: string
    factor: number
  }>
}

let cachedToken: CachedToken | null = null

async function connectDB(): Promise<void> {
  if (!MONGODB_URI) return
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_URI)
  }
}

async function getModel<T>(name: string, importPath: string): Promise<Model<T>> {
  await connectDB()
  if (mongoose.models[name]) {
    return mongoose.models[name] as Model<T>
  }
  const importedModule = await import(importPath)
  return importedModule.default as Model<T>
}

export async function getAutodeskToken(): Promise<string> {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('Autodesk client credentials are missing')
  }

  const bufferMs = 5 * 60 * 1000
  if (cachedToken && cachedToken.expiresAt > Date.now() + bufferMs) {
    return cachedToken.accessToken
  }

  const response = await fetch(AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'client_credentials',
      scope: 'data:read viewables:read',
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Autodesk auth failed: ${response.status} - ${errorText}`)
  }

  const data: AutodeskTokenResponse = await response.json()

  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }

  return data.access_token
}

export async function getEmbodiedCarbon(
  materialId: string,
  options?: { category?: string; name?: string }
): Promise<EmbodiedCarbon | null> {
  try {
    if (MONGODB_URI) {
      const Material = await getModel<{
        materialId: string
        epdId?: string
        ec3Id?: string
        autodeskId?: string
        name?: string
        category?: string
        gwp: number
        gwpUnit?: string
        declaredUnit?: string
        lifecycleStages?: LifecycleStages
        benchmarks?: unknown
        source?: string
        isActive: boolean
        tags?: string[]
        updatedAt?: Date
        createdAt?: Date
      }>('Material', '../models/Material')

      const cachedMaterial = await Material.findOne({
        isActive: true,
        $or: [
          { materialId },
          { epdId: materialId },
          { ec3Id: materialId },
          { autodeskId: materialId },
        ],
      }).lean()

      if (cachedMaterial) {
        return {
          id: cachedMaterial.materialId,
          name: cachedMaterial.name,
          category: cachedMaterial.category,
          gwp: cachedMaterial.gwp,
          gwpUnit: cachedMaterial.gwpUnit,
          declaredUnit: cachedMaterial.declaredUnit,
          lifecycleStages: cachedMaterial.lifecycleStages ?? { a1a3: cachedMaterial.gwp },
          benchmarks: cachedMaterial.benchmarks,
          source: cachedMaterial.source ?? 'GreenChainz cache',
          methodology: 'EN 15804',
          scope: ['A1-A3'],
          cached: true,
          last_updated: cachedMaterial.updatedAt ?? cachedMaterial.createdAt,
        }
      }

      if (options?.category || options?.name) {
        const query: Record<string, unknown> = { isActive: true }
        if (options.category) query['category'] = { $regex: options.category, $options: 'i' }
        if (options.name) {
          query['$or'] = [
            { name: { $regex: options.name, $options: 'i' } },
            { tags: { $in: [options.name.toLowerCase()] } },
          ]
        }

        const matched = await Material.findOne(query).lean()
        if (matched) {
          return {
            id: matched.materialId,
            name: matched.name,
            category: matched.category,
            gwp: matched.gwp,
            gwpUnit: matched.gwpUnit,
            declaredUnit: matched.declaredUnit,
            lifecycleStages: matched.lifecycleStages ?? { a1a3: matched.gwp },
            benchmarks: matched.benchmarks,
            source: `${matched.source ?? 'GreenChainz cache'} (category match)`,
            methodology: 'EN 15804',
            scope: ['A1-A3'],
            cached: true,
            matchType: 'category',
            last_updated: matched.updatedAt ?? matched.createdAt,
          }
        }
      }
    }

    // Fallback: mock while real API is not wired
    await getAutodeskToken()
    return {
      id: materialId,
      gwp: Math.random() * 10 + 2,
      source: 'Autodesk APS (mock)',
      methodology: 'EN 15804',
      scope: ['A1-A3'],
      cached: false,
    }
  } catch (error) {
    console.warn('Embodied carbon lookup failed:', error)
    return null
  }
}

export async function translateModel(urn: string): Promise<{ urn: string; status: string }> {
  const token = await getAutodeskToken()

  const response = await fetch(
    'https://developer.api.autodesk.com/modelderivative/v2/designdata/job',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-ads-force': 'true',
      },
      body: JSON.stringify({
        input: { urn },
        output: { formats: [{ type: 'svf2', views: ['2d', '3d'] }] },
      }),
    }
  )

  if (!response.ok) {
    throw new Error(`Translation failed: ${response.status}`)
  }

  const data = (await response.json()) as { urn: string; result: string }
  return { urn: data.urn, status: data.result }
}

export async function getTranslationStatus(
  urn: string
): Promise<{ status: string; progress: string }> {
  const token = await getAutodeskToken()

  const response = await fetch(
    `https://developer.api.autodesk.com/modelderivative/v2/designdata/${urn}/manifest`,
    { headers: { Authorization: `Bearer ${token}` } }
  )

  if (!response.ok) {
    throw new Error(`Status check failed: ${response.status}`)
  }

  const data = (await response.json()) as { status: string; progress?: string }
  return { status: data.status, progress: data.progress ?? '0%' }
}

export async function getCarbonFactor(
  type: 'electricity' | 'transport' | 'fuel',
  options: { country?: string; region?: string; subregion?: string; mode?: string }
): Promise<CarbonFactor | null> {
  if (!MONGODB_URI) return null

  try {
    const CarbonFactorModel = await getModel<CarbonFactor>('CarbonFactor', '../models/CarbonFactor')
    const query: Record<string, unknown> = { type, isActive: true }

    if (type === 'transport' && options.mode) {
      query['factorId'] = `transport-${options.mode.toLowerCase()}`
    } else {
      if (options.subregion) query['subregion'] = options.subregion.toUpperCase()
      if (options.country) query['country'] = options.country.toUpperCase()
      if (options.region) query['region'] = { $regex: options.region, $options: 'i' }
    }

    return (await CarbonFactorModel.findOne(query).lean()) as CarbonFactor | null
  } catch (error) {
    console.warn('getCarbonFactor error:', error)
    return null
  }
}

export async function getLowCarbonAlternatives(
  category: string,
  options?: { minReduction?: number; maxResults?: number }
): Promise<LowCarbonAlternative[]> {
  if (!MONGODB_URI) return []

  try {
    const CarbonAlternative = await getModel<{
      originalMaterial: { category: string }
      alternatives: LowCarbonAlternative[]
      isActive: boolean
    }>('CarbonAlternative', '../models/CarbonAlternative')

    const doc = await CarbonAlternative.findOne({
      'originalMaterial.category': { $regex: category, $options: 'i' },
      isActive: true,
    }).lean()

    if (!doc) return []

    let alternatives = doc.alternatives ?? []

    if (options?.minReduction !== undefined) {
      const minReduction = options.minReduction;
      alternatives = alternatives.filter((a) => (a.reduction ?? 0) >= minReduction)
    }

    if (options?.maxResults !== undefined) {
      alternatives = alternatives.slice(0, options.maxResults)
    }

    return alternatives
  } catch (error) {
    console.warn('getLowCarbonAlternatives error:', error)
    return []
  }
}

export async function searchMaterials(
  query: string,
  options?: { category?: string; maxGwp?: number; limit?: number }
): Promise<unknown[]> {
  if (!MONGODB_URI) return []

  try {
    const Material = await getModel('Material', '../models/Material')

    const searchQuery: Record<string, unknown> = {
      isActive: true,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } },
        { subcategory: { $regex: query, $options: 'i' } },
        { tags: { $in: [query.toLowerCase()] } },
      ],
    }

    if (options?.category) {
      searchQuery['category'] = { $regex: options.category, $options: 'i' }
    }

    if (options?.maxGwp) {
      searchQuery['gwp'] = { $lte: options.maxGwp }
    }

    return Material.find(searchQuery)
      .sort({ gwp: 1 })
      .limit(options?.limit ?? 20)
      .lean()
  } catch (error) {
    console.warn('searchMaterials error:', error)
    return []
  }
}

export async function convertUnits(
  category: string,
  value: number,
  fromUnit: string,
  toUnit: string
): Promise<{
  inputValue: number
  inputUnit: string
  outputValue: number
  outputUnit: string
  factor: number
} | null> {
  if (!MONGODB_URI) return null

  try {
    const UnitConversionModel = await getModel<UnitConversion>('UnitConversion', '../models/UnitConversion')

    const conversionDoc = await UnitConversionModel.findOne({
      materialCategory: { $regex: category, $options: 'i' },
    }).lean()

    if (!conversionDoc) return null

    const conversions = conversionDoc.conversions

    let conversion = conversions.find(
      (c) =>
        c.fromUnit.toLowerCase() === fromUnit.toLowerCase() &&
        c.toUnit.toLowerCase() === toUnit.toLowerCase()
    )

    if (!conversion) {
      const reverse = conversions.find(
        (c) =>
          c.fromUnit.toLowerCase() === toUnit.toLowerCase() &&
          c.toUnit.toLowerCase() === fromUnit.toLowerCase()
      )
      if (reverse) {
        conversion = { fromUnit, toUnit, factor: 1 / reverse.factor }
      }
    }

    if (!conversion && conversionDoc.density) {
      if (fromUnit.toLowerCase() === 'm³' && toUnit.toLowerCase() === 'kg') {
        conversion = { fromUnit, toUnit, factor: conversionDoc.density }
      } else if (fromUnit.toLowerCase() === 'kg' && toUnit.toLowerCase() === 'm³') {
        conversion = { fromUnit, toUnit, factor: 1 / conversionDoc.density }
      }
    }

    if (!conversion) return null

    return {
      inputValue: value,
      inputUnit: fromUnit,
      outputValue: value * conversion.factor,
      outputUnit: toUnit,
      factor: conversion.factor,
    }
  } catch (error) {
    console.warn('convertUnits error:', error)
    return null
  }
}
