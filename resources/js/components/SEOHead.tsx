import { Head } from "@inertiajs/react";

interface SEOHeadProps {
  title: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
}

const SEOHead = ({
  title,
  description,
  keywords = "athleon, toko olahraga, perlengkapan futsal, sepatu basket, raket padel, jersey olahraga, bola futsal, aksesori olahraga",
  image = "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&h=630&fit=crop",
  url,
  type = "website",
}: SEOHeadProps) => {
  const APP_NAME = import.meta.env.VITE_APP_NAME || 'Athleon';
  const normalizeWhitespace = (value: string) => value.replace(/\s+/g, " ").trim();
  const normalizedAppName = normalizeWhitespace(APP_NAME);
  const normalizedAppNameLower = normalizedAppName.toLowerCase();
  const normalizedTitle = normalizeWhitespace(title);

  const baseSegments = normalizedTitle
    .split('-')
    .map((segment) => normalizeWhitespace(segment))
    .filter(
      (segment) => segment.length > 0 && segment.toLowerCase() !== normalizedAppNameLower
    );

  if (!baseSegments.length && normalizedTitle.length > 0 && normalizedTitle.toLowerCase() !== normalizedAppNameLower) {
    baseSegments.push(normalizedTitle);
  }

  const fullTitle = baseSegments.length
    ? `${baseSegments.join(' - ')} - ${normalizedAppName}`
    : normalizedAppName;
  
  // Use dynamic APP_NAME in default description
  const defaultDescription = `${APP_NAME} - Toko perlengkapan olahraga terlengkap dengan produk berkualitas untuk futsal, basket, padel, dan olahraga lainnya. Gratis ongkir, garansi resmi, dan harga terbaik.`;
  const finalDescription = description || defaultDescription;
  
  const defaultUrl =
    import.meta.env.VITE_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "http://localhost");
  const resolvedUrl = url ?? defaultUrl;

  return (
    <Head>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={APP_NAME} />
      <meta name="robots" content="index, follow" />
      <meta name="language" content="Indonesian" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={resolvedUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={APP_NAME} />
      <meta property="og:locale" content="id_ID" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={resolvedUrl} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={finalDescription} />
      <meta property="twitter:image" content={image} />

      {/* Additional SEO */}
      <link rel="canonical" href={resolvedUrl} />
      <meta name="theme-color" content="#1E293B" />
    </Head>
  );
};

export default SEOHead;
