/**
 * custom article route for slug filter
 */

export default {
    routes: [
      {
        method: 'GET',
        path: '/articles/:slug',
        handler: 'article.findOneBySlug',
        config: {
          auth: false,
        },
      },
    ],
  };