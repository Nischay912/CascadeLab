export interface BadgeOptions {
  label: string;
  value: string;
  color?: string; // Hex color for value pill
  labelColor?: string; // Hex color for label pill
}

/**
 * Generates a clean, modern SVG badge suitable for embedding in GitHub READMEs.
 */
export function generateSvgBadge(options: BadgeOptions): string {
  const {
    label,
    value,
    color = '#10B981', // default emerald green
    labelColor = '#1F2937', // dark slate
  } = options;

  // Approximate character widths for crisp layout (assuming 11px sans-serif font)
  const labelWidth = Math.max(50, Math.round(label.length * 7 + 16));
  const valueWidth = Math.max(50, Math.round(value.length * 7.5 + 16));
  const totalWidth = labelWidth + valueWidth;
  const height = 20;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}" role="img" aria-label="${label}: ${value}">
  <title>${label}: ${value}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="${totalWidth}" height="${height}" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="${height}" fill="${labelColor}"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="${height}" fill="${color}"/>
    <rect width="${totalWidth}" height="${height}" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110">
    <text aria-hidden="true" x="${(labelWidth * 10) / 2}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)">${label}</text>
    <text x="${(labelWidth * 10) / 2}" y="140" transform="scale(.1)" fill="#fff">${label}</text>
    <text aria-hidden="true" x="${labelWidth * 10 + (valueWidth * 10) / 2}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)">${value}</text>
    <text x="${labelWidth * 10 + (valueWidth * 10) / 2}" y="140" transform="scale(.1)" fill="#fff">${value}</text>
  </g>
</svg>`;
}
