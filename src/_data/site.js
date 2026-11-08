// Address of the live site: used in sitemap.xml, canonical links and Open Graph.
// SITE_URL (a Cloudflare build variable) overrides this when the site moves to its own domain.
export default {
  url: (process.env.SITE_URL || 'https://innawita.com').replace(/\/$/, ''),
  name: 'SUMI 墨',
  phone: 'tel:+48221002030',
  nav: [
    ['/#filozofia', 'Filozofia'], ['/#omakase', 'Omakase'], ['/#karta', 'Karta'], ['/#wnetrze', 'Wnętrze'],
    ['/#szef', 'Szef kuchni'], ['/#dojazd', 'Dojazd'], ['/blog/', 'Blog']
  ]
};
