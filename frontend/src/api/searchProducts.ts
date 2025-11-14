import { supabase } from '@/lib/supabase'
import type { Product, FilterState } from '@/types'

/**
 * Searches and filters products from the Supabase database.
 *
 * @param query - The search term to match against product names and descriptions.
 * @param filters - An object containing filters for material_type, certifications, and recycled_content_pct.
 * @returns A promise that resolves to an array of products.
 */
export const searchProducts = async (
  query: string,
  filters: FilterState
): Promise<Product[]> => {
  try {
    let queryBuilder = supabase.from('products').select('*')

    // 1. Full-text search for the query string
    if (query) {
      queryBuilder = queryBuilder.textSearch('name_description_fts', query, {
        type: 'websearch',
        config: 'english',
      })
    }

    // 2. Filter by material type (exact match in an array)
    if (filters.material_type && filters.material_type.length > 0) {
      queryBuilder = queryBuilder.in('material_type', filters.material_type)
    }

    // 3. Filter by certifications (array contains all specified certs)
    if (filters.certifications && filters.certifications.length > 0) {
      queryBuilder = queryBuilder.contains(
        'sustainability_data->certifications',
        filters.certifications
      )
    }

    // 4. Filter by recycled content percentage (greater than or equal to)
    if (
      filters.recycled_content_pct !== undefined &&
      filters.recycled_content_pct >= 0
    ) {
      queryBuilder = queryBuilder.gte(
        'sustainability_data->>recycled_content', // Use ->> to cast as text, then it's compared as a number
        filters.recycled_content_pct
      )
    }

    const { data, error } = await queryBuilder
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      throw error
    }

    return (data as Product[]) || []
  } catch (err: unknown) {
    const error = err as Error
    console.error('Error searching products:', error.message)
    // In a real app, you might want to use a more sophisticated logging service
    return [] // Return empty array on error to prevent UI crashes
  }
}
