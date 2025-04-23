/**
 *  article controller, added slug redirection logic.
 */

import { factories } from '@strapi/strapi';
import { Context } from 'koa';

export default factories.createCoreController('api::article.article', ({ strapi }) => ({
  async findOneBySlug(ctx: Context) {
    const { slug } = ctx.params;

    const redirectEntry = await strapi.db.query('api::redirect.redirect').findOne({
      where: { oldSlug: slug },
    });

    if (redirectEntry) {
      ctx.status = 301;
      ctx.redirect(`/api/articles/${redirectEntry.newSlug}`);
      return;
    }

    // Find the article by slug.
    const entity = await strapi.db.query('api::article.article').findOne({
      where: { slug },
      populate: ['categories', 'image'],
    });

    if (!entity) {
      ctx.status = 404;
      ctx.body = { error: 'Article not found' };
      return;
    }

    ctx.body = await this.sanitizeOutput(entity, ctx);
  },

  async find(ctx: Context) {
    const { filters } : any = ctx.query;

    // Checking if slug filter is used.
    if (filters?.slug?.$eq) {
      const slug = filters.slug.$eq;

      // Check for redirect.
      const redirectEntry = await strapi.db.query('api::redirect.redirect').findOne({
        where: { oldSlug: slug },
      });

      if (redirectEntry) {
        ctx.query.filters = {
          ...filters,
          slug: { $eq: redirectEntry.newSlug },
        };
      }
    }

    // Call the default find controller.
    return await super.find(ctx);
  },
}));