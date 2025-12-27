import Head from 'next/head'
import Script from 'next/script'

type StructuredDataType = 'organization' | 'product' | 'breadcrumb'

interface StructuredDataProps {
  type: StructuredDataType
  data: any
}

export default function StructuredData({ type, data }: StructuredDataProps) {
  let schema = {}

  if (type === 'organization') {
    schema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'GreenChainz',
      url: 'https://greenchainz.com',
      logo: 'https://greenchainz.com/logo.png',
      sameAs: [
        'https://www.linkedin.com/company/greenchainz',
        'https://twitter.com/greenchainz'
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+1-434-359-2460',
        contactType: 'sales',
        email: 'founder@greenchainz.com'
      }
    }
  } else if (type === 'product') {
    schema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: data.name,
      image: data.image_url ? [data.image_url] : [],
      description: data.description,
      brand: {
        '@type': 'Brand',
        name: data.supplier_name
      },
      offers: {
        '@type': 'Offer',
        url: `https://greenchainz.com/products/${data.id}`,
        priceCurrency: 'USD',
        price: data.price || '0.00',
        availability: 'https://schema.org/InStock'
      },
      additionalProperty: [
        {
          '@type': 'PropertyValue',
          name: 'Embodied Carbon',
          value: `${data.embodied_carbon || 0} kgCO2e`
        }
      ]
    }
  }

  return (
    <Script
      id={`json-ld-${type}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
