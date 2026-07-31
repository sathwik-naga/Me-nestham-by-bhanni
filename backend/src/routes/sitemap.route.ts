import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import logger from '../utils/logger';

const router = Router();

const SITE_URL = process.env.VITE_SITE_URL || 'https://www.menesthambybhanni.com';

router.get('/', async (_req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Static page definitions
    const staticPages = [
      { url: '/', priority: '1.0', changefreq: 'daily', lastmod: today },
      { url: '/shop', priority: '0.9', changefreq: 'daily', lastmod: today },
      { url: '/categories', priority: '0.8', changefreq: 'weekly', lastmod: today },
      { url: '/about', priority: '0.5', changefreq: 'monthly', lastmod: today },
      { url: '/contact', priority: '0.5', changefreq: 'monthly', lastmod: today },
      { url: '/faq', priority: '0.5', changefreq: 'monthly', lastmod: today },
    ];

    // Fetch categories
    let categories: { slug: string; updated_at?: string }[] = [];
    try {
      const { data } = await supabaseAdmin.from('categories').select('slug, updated_at');
      if (data) categories = data;
    } catch (catErr) {
      logger.warn(`Sitemap: failed to fetch categories: ${catErr}`);
    }

    // Fetch products
    let products: { slug?: string; id: string; updated_at?: string }[] = [];
    try {
      const { data } = await supabaseAdmin.from('products').select('slug, id, updated_at').eq('is_active', true);
      if (data) products = data;
    } catch (prodErr) {
      logger.warn(`Sitemap: failed to fetch products: ${prodErr}`);
    }

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Static pages XML
    staticPages.forEach((page) => {
      xml += `  <url>\n`;
      xml += `    <loc>${SITE_URL}${page.url}</loc>\n`;
      xml += `    <lastmod>${page.lastmod}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += `  </url>\n`;
    });

    // Category pages XML
    categories.forEach((cat) => {
      if (!cat.slug) return;
      const lastmod = cat.updated_at ? cat.updated_at.split('T')[0] : today;
      xml += `  <url>\n`;
      xml += `    <loc>${SITE_URL}/categories/${cat.slug}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;
    });

    // Product pages XML
    products.forEach((prod) => {
      const productSlug = prod.slug || prod.id;
      if (!productSlug) return;
      const lastmod = prod.updated_at ? prod.updated_at.split('T')[0] : today;
      xml += `  <url>\n`;
      xml += `    <loc>${SITE_URL}/products/${productSlug}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>daily</changefreq>\n`;
      xml += `    <priority>0.9</priority>\n`;
      xml += `  </url>\n`;
    });

    xml += `</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    res.status(200).send(xml);
  } catch (err) {
    logger.error(`Error generating sitemap XML: ${err}`);
    res.status(500).send('Error generating sitemap XML');
  }
});

export default router;
