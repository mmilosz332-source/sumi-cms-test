import fs from 'node:fs';
import path from 'node:path';
import Image from '@11ty/eleventy-img';
import esbuild from 'esbuild';
import site from './src/_data/site.js';

const OUTPUT = '_site';
const NOINDEX = '<meta name="robots" content="noindex">';
const PHOTO = /\/zdjecia\/blog\/[^"'\s)]+/;

/* ---------- photos added through the CMS -> responsive WebP, max 1600 px ---------- */
async function photo(src) {
  const file = path.join('src', decodeURI(src));
  if (!fs.existsSync(file)) throw new Error(`Brak zdjęcia: ${file}`);
  const name = path.parse(file).name;
  const meta = await Image(file, {
    widths: [480, 800, 1200, 1600],
    formats: ['webp'],
    sharpWebpOptions: { quality: 75, effort: 6 },
    outputDir: `${OUTPUT}/img/blog`,
    urlPath: '/img/blog/',
    filenameFormat: (id, s, width, format) => `${name}-${width}.${format}`
  });
  return meta.webp; // smallest first
}
const atLeast = (list, width) => list.find(x => x.width >= width) || list.at(-1);
const srcset = list => list.map(x => `${x.url} ${x.width}w`).join(', ');

async function replaceAsync(text, regex, fn) {
  const parts = [];
  let last = 0;
  for (const m of text.matchAll(regex)) {
    parts.push(text.slice(last, m.index), await fn(...m));
    last = m.index + m[0].length;
  }
  return parts.join('') + text.slice(last);
}

async function blogPhotos(html) {
  // a Markdown image with a title becomes a photo with a caption
  html = html.replace(/<p>\s*(<img\b[^>]*>)\s*<\/p>/g, (m, img) => {
    const title = img.match(/\stitle="([^"]*)"/);
    return `<figure>${img.replace(/\stitle="[^"]*"/, '')}${title ? `<figcaption>${title[1]}</figcaption>` : ''}</figure>`;
  });

  html = await replaceAsync(html, /<img\b[^>]*>/g, async tag => {
    const src = tag.match(/\ssrc="([^"]*)"/)?.[1] || '';
    if (!src.startsWith('/zdjecia/blog/')) return tag;
    const list = await photo(src);
    const top = list.at(-1);
    const alt = tag.match(/\salt="([^"]*)"/)?.[1] || '';
    const sizes = tag.match(/\sdata-sizes="([^"]*)"/)?.[1] || '(max-width:760px) 92vw, 680px';
    const load = /\sdata-eager/.test(tag) ? 'fetchpriority="high"' : 'loading="lazy"';
    return `<img src="${atLeast(list, 800).url}" srcset="${srcset(list)}" sizes="${sizes}" width="${top.width}" height="${top.height}" alt="${alt}" ${load} decoding="async">`;
  });

  html = await replaceAsync(html, /<link rel="preload" as="image" data-photo="([^"]*)" data-sizes="([^"]*)">/g, async (m, src, sizes) => {
    const list = await photo(src);
    return `<link rel="preload" as="image" href="${atLeast(list, 800).url}" imagesrcset="${srcset(list)}" imagesizes="${sizes}" fetchpriority="high">`;
  });

  return replaceAsync(html, /<meta property="og:image" content="(\/zdjecia\/blog\/[^"]*)">/g, async (m, src) => {
    const og = atLeast(await photo(src), 1200);
    return `<meta property="og:image" content="${site.url}${og.url}">\n<meta property="og:image:width" content="${og.width}">\n<meta property="og:image:height" content="${og.height}">`;
  });
}

/* ---------- PageSpeed: font subset + minified inline CSS/JS, on every page ---------- */
function optimize(html) {
  // Japanese font: only the glyphs this page uses (345 KB of CSS -> about 4 KB)
  const jp = [...new Set([...html].filter(c => /[　-〿぀-ヿ一-鿿＀-￯]/.test(c)))].sort().join('');
  html = html.replace(/<link href="https:\/\/fonts\.googleapis\.com\/css2\?([^"]*)" rel="stylesheet">/, (m, query) => {
    const families = query.split('&').filter(p => p.startsWith('family='));
    const japanese = families.filter(f => f.includes('Shippori'));
    const latin = families.filter(f => !f.includes('Shippori'));
    return `<link href="https://fonts.googleapis.com/css2?${latin.join('&')}&display=swap" rel="stylesheet">\n` +
           `<link href="https://fonts.googleapis.com/css2?${japanese.join('&')}&display=swap&text=${encodeURIComponent(jp)}" rel="stylesheet">`;
  });
  html = html.replace(/<style>([\s\S]*?)<\/style>/g, (m, css) =>
    `<style>${esbuild.transformSync(css, { loader: 'css', minify: true }).code.trim()}</style>`);
  return html.replace(/<script>([\s\S]*?)<\/script>/g, (m, js) =>
    `<script>${esbuild.transformSync(js, { loader: 'js', minify: true, target: 'es2020' }).code.trim()}</script>`);
}

const htmlFiles = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
  const p = path.join(dir, e.name);
  return e.isDirectory() ? htmlFiles(p) : p.endsWith('.html') ? [p] : [];
});

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ 'src/img': 'img', 'src/admin': 'admin', 'src/_headers': '_headers' });
  eleventyConfig.ignores.add('src/admin/**'); // the CMS panel is copied as-is, it is not a site page
  eleventyConfig.addWatchTarget('src/assets/');

  eleventyConfig.addCollection('posts', api => api.getFilteredByGlob('src/blog/*.md').sort((a, b) => b.date - a.date));

  eleventyConfig.addFilter('plDate', d => new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d));
  eleventyConfig.addFilter('isoDate', d => d.toISOString().slice(0, 10));

  eleventyConfig.addTransform('photos-and-speed', async function (content) {
    if (!(this.page.outputPath || '').endsWith('.html')) return content;
    return optimize(await blogPhotos(content));
  });

  eleventyConfig.on('eleventy.after', () => {
    fs.mkdirSync(`${OUTPUT}/blog`, { recursive: true });
    fs.writeFileSync(`${OUTPUT}/blog/blog.css`,
      esbuild.transformSync(fs.readFileSync('src/assets/blog.css', 'utf8'), { loader: 'css', minify: true }).code);

    // fictional restaurant: a page without noindex must never go live
    const missing = htmlFiles(OUTPUT).filter(f => !fs.readFileSync(f, 'utf8').includes(NOINDEX));
    if (missing.length) throw new Error(`Brak noindex: ${missing.join(', ')}`);
  });

  return {
    dir: { input: 'src', output: OUTPUT, includes: '_includes', data: '_data' },
    templateFormats: ['md', 'njk', 'html'],
    // index.html is plain HTML with JS templates and CMS text may contain {{ }}: neither is a template
    htmlTemplateEngine: false,
    markdownTemplateEngine: false
  };
}
