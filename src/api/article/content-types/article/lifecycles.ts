/**
 *  checking if slug is updated and create redirect entry for it.
 */

export default {
    async beforeUpdate(event) {
      const { data, where } = event.params;
  
      const existingArticle = await strapi.db.query('api::article.article').findOne({
        where,
      });
  
      // Checking if slug is being updated.
      if (existingArticle && data.slug && existingArticle.slug !== data.slug) {
        // Create a Redirect entry.
        await strapi.entityService.create('api::redirect.redirect', {
          data: {
            oldSlug: existingArticle.slug,
            newSlug: data.slug,
          },
        });
      }
    },
  };