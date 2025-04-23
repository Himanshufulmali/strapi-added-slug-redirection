import { Context, Next } from 'koa';

// Utility function to format date to dd-mm-yyyy
const formatDate = (date: string | Date): string => {
  if (!date || typeof date !== 'string') {
    strapi.log.debug(`Skipping date formatting for non-string or empty value: ${date}`);
    return date as string || '';
  }
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      strapi.log.warn(`Invalid date encountered: ${date}`);
      return date; // Return original value if invalid
    }
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch (error) {
    strapi.log.error(`Error formatting date: ${date}`, error);
    return date; // Return original value on error
  }
};

// Utility function to recursively format date fields in an object
const formatObjectDates = (obj: any): any => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(formatObjectDates);

  const formatted = { ...obj };
  for (const key in formatted) {
    if (Object.prototype.hasOwnProperty.call(formatted, key)) {
      if (typeof formatted[key] === 'string' && key.match(/(At|Date|Time)$/i)) {
        formatted[key] = formatDate(formatted[key]);
      } else if (typeof formatted[key] === 'object' && formatted[key] !== null) {
        formatted[key] = formatObjectDates(formatted[key]);
      }
    }
  }
  return formatted;
};

export default (config: any, { strapi }: { strapi: any }) => {
  return async (ctx: Context, next: Next) => {
    try {
      // Skip middleware for admin routes to avoid breaking admin UI
      if (
        ctx.request.path.startsWith('/content-manager') ||
        ctx.request.path.startsWith('/dashboard') ||
        ctx.request.path.includes('/admin')
      ) {
        return await next();
      }

      await next();

      // Only format GET responses with a body
      if (ctx.method === 'GET' && ctx.body && typeof ctx.body === 'object') {
        // Handle Strapi v5 response structure: { data: [], meta: {} }
        if ('data' in ctx.body && 'meta' in ctx.body) {
          ctx.body = {
            data: formatObjectDates(ctx.body.data),
            meta: ctx.body.meta,
          };
        } else {
          // Handle other response formats
          ctx.body = formatObjectDates(ctx.body);
        }
      }
    } catch (error) {
      strapi.log.error('Date formatting middleware error:', error);
      // Prevent crash by continuing with original response
      ctx.body = ctx.body || { error: 'Internal server error' };
      ctx.status = ctx.status || 500;
    }
  };
};