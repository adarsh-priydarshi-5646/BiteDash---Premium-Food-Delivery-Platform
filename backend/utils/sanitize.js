/**
 * Input Sanitization - Prevents ReDoS & NoSQL injection
 */
export const escapeRegex = (string) => {
  if (typeof string !== 'string') return '';
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const sanitizeQuery = (input) => {
  if (typeof input !== 'string') return '';
  return input.replace(/[${}]/g, '');
};
