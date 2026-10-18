import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nirmansetu.in';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/admin/',
        '/supplier',
        '/supplier/',
        '/api/',
        '/account/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
