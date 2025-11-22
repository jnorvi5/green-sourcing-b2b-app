import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  name?: string;
  type?: string;
  image?: string;
  url?: string;
}

const SEO: React.FC<SEOProps> = ({
  title,
  description,
  name = 'GreenChainz',
  type = 'website',
  image = '/og-image.jpg', // Assuming a default OG image exists or will exist
  url,
}) => {
  const defaultTitle = 'GreenChainz - Verified Sustainable Sourcing';
  const defaultDescription = 'The B2B marketplace for the AEC industry. Source verified sustainable materials with EPDs and carbon data.';
  
  const metaTitle = title ? `${title} | ${name}` : defaultTitle;
  const metaDescription = description || defaultDescription;
  const metaUrl = url || window.location.href;

  return (
    <Helmet>
      {/* Standard metadata tags */}
      <title>{metaTitle}</title>
      <meta name='description' content={metaDescription} />
      <link rel="canonical" href={metaUrl} />

      {/* Open Graph tags (Facebook, LinkedIn) */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={metaUrl} />
      <meta property="og:site_name" content={name} />

      {/* Twitter Card tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={metaTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
};

export default SEO;
