import sanitizeHtml from 'sanitize-html';

/**
 * Sanitize user-supplied HTML content to prevent stored XSS.
 *
 * Allows basic formatting tags that product descriptions need
 * (bold, italic, lists, links) while stripping all scripts,
 * event handlers, and dangerous attributes.
 */
const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: [
    // Text formatting
    'b', 'i', 'em', 'strong', 'u', 's', 'del',
    // Structure
    'p', 'br', 'hr',
    // Headings
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    // Lists
    'ul', 'ol', 'li',
    // Links (with restrictions)
    'a',
    // Inline code / preformatted
    'code', 'pre', 'blockquote',
  ],
  allowedAttributes: {
    'a': ['href', 'title', 'target', 'rel'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  // Force safe link attributes
  transformTags: {
    'a': (tagName, attribs) => ({
      tagName,
      attribs: {
        ...attribs,
        target: '_blank',
        rel: 'noopener noreferrer nofollow',
      },
    }),
  },
  // Strip all content from dangerous tags (don't just remove the tag)
  disallowedTagsMode: 'discard',
};

/**
 * Sanitize a product description or any user-supplied rich text.
 * Returns safe HTML with only whitelisted tags/attributes.
 */
export function sanitizeProductContent(dirty: string): string {
  if (!dirty) return '';
  return sanitizeHtml(dirty, sanitizeOptions);
}

/**
 * Sanitize a plain text field (product name, short descriptions).
 * Strips ALL HTML — no tags allowed.
 */
export function sanitizePlainText(dirty: string): string {
  if (!dirty) return '';
  return sanitizeHtml(dirty, { allowedTags: [], allowedAttributes: {} });
}
