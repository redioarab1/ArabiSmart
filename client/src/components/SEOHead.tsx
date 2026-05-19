import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
  noIndex?: boolean;
  language?: string;
  wordCount?: number;
}

const SITE_NAME = "ArabiSmart News - عربي سمارت";
const SITE_URL = "https://arabismart.vip";
const DEFAULT_IMAGE = `${SITE_URL}/icon-512x512.png`;
const DEFAULT_DESCRIPTION =
  "عربي سمارت للأخبار - تابع آخر الأخبار العربية والسويدية والعالمية في مكان واحد. أخبار عاجلة من أكثر من 20 مصدر موثوق مع ملخصات يومية بالذكاء الاصطناعي.";

export default function SEOHead({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  url,
  type = "website",
  publishedTime,
  modifiedTime,
  author,
  section,
  tags = [],
  noIndex = false,
  language = "ar",
  wordCount,
}: SEOHeadProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const canonicalUrl = url ? `${SITE_URL}${url}` : SITE_URL;
  const imageUrl = image?.startsWith("http") ? image : `${SITE_URL}${image}`;

  return (
    <Helmet>
      {/* ── Primary SEO ── */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="language" content={language} />
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta
          name="robots"
          content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
        />
      )}
      <link rel="canonical" href={canonicalUrl} />

      {/* ── hreflang for multilingual SEO ── */}
      <link rel="alternate" hrefLang="ar" href={canonicalUrl} />
      <link rel="alternate" hrefLang="x-default" href={SITE_URL} />

      {/* ── Open Graph ── */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title || SITE_NAME} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="ar_AR" />
      <meta property="og:locale:alternate" content="sv_SE" />
      <meta property="og:locale:alternate" content="en_US" />

      {/* ── Article-specific OG ── */}
      {type === "article" && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === "article" && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {type === "article" && author && (
        <meta property="article:author" content={author} />
      )}
      {type === "article" && section && (
        <meta property="article:section" content={section} />
      )}
      {type === "article" && (
        <meta property="article:publisher" content="https://www.facebook.com/share/1Dr2tHQcKM/" />
      )}
      {type === "article" &&
        tags.map((tag) => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}

      {/* ── Twitter / X Card ── */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@ArabiSmartNews" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:image:alt" content={title || SITE_NAME} />

      {/* ── GEO: Generative Engine Optimization ── */}
      {/* Signals for AI answer engines (Perplexity, ChatGPT, Gemini, etc.) */}
      {type === "article" && (
        <>
          {/* Content freshness signal */}
          {publishedTime && (
            <meta name="article:published_time" content={publishedTime} />
          )}
          {/* Word count helps AI judge content depth */}
          {wordCount && (
            <meta name="article:word_count" content={String(wordCount)} />
          )}
          {/* Content type signals */}
          <meta name="content-type" content="news-article" />
          <meta name="news-keywords" content={tags.join(", ") || section || "أخبار عربية"} />
        </>
      )}
      {/* Citation-friendly: clear authorship */}
      {author && <meta name="author" content={author} />}
      {/* Source credibility signal */}
      <meta name="publisher" content="ArabiSmart News - عربي سمارت" />
      <meta name="copyright" content="ArabiSmart News" />
    </Helmet>
  );
}
