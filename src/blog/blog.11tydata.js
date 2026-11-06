// Shared settings for every Markdown post in this folder.
export default {
  layout: 'layouts/post.njk',
  permalink: data => `/blog/${data.page.fileSlug}/`,
  eleventyComputed: {
    metaTitle: data => `${data.title} — SUMI 墨`,
    ogType: () => 'article'
  }
};
