// Address of the live site: used in sitemap.xml, canonical links and Open Graph.
// Change the fallback after the first deploy, or set SITE_URL in Cloudflare (build variables).
export default {
  url: (process.env.SITE_URL || 'https://sumi-cms-test.TWOJA-SUBDOMENA.workers.dev').replace(/\/$/, ''),
  name: 'SUMI 墨',
  phone: 'tel:+48221002030',
  nav: [
    ['/#filozofia', 'Filozofia'], ['/#omakase', 'Omakase'], ['/#karta', 'Karta'], ['/#szef', 'Szef kuchni'],
    ['/#wnetrze', 'Wnętrze'], ['/#dojazd', 'Dojazd'], ['/blog/', 'Blog']
  ]
};
