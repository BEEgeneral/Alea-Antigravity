import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/auth/', '/login', '/onboarding', '/praetorium', '/radar', '/profile'],
    },
    sitemap: 'https://aleasignature.com/sitemap.xml',
  };
}
