/**
 * Resume Service
 * Convert Markdown to ATS-friendly HTML
 */

/**
 * Convert Markdown to HTML with ATS-friendly formatting
 * Uses Inter font and semantic HTML structure
 */
export function markdownToHTML(markdown) {
  // Simple Markdown parser - handles basics for now
  // For production, consider using a library like marked.js
  
  let html = markdown;

  // Convert headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Convert bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

  // Convert italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');

  // Convert links
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');

  // Convert lists
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

  // Convert numbered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
  // Note: This is simplified - in production, properly detect numbered lists

  // Convert paragraphs (lines separated by blank lines)
  html = html.split('\n\n').map(para => {
    if (para.startsWith('<h') || para.startsWith('<ul') || para.startsWith('<ol')) {
      return para;
    }
    if (para.trim()) {
      return `<p>${para.replace(/\n/g, '<br>')}</p>`;
    }
    return '';
  }).join('\n');

  // Wrap in full HTML document
  const fullHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resume</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #1a1a1a;
      max-width: 8.5in;
      margin: 0 auto;
      padding: 0.5in;
      background: white;
    }
    
    /* ATS-friendly: Clear hierarchy */
    h1 {
      font-size: 24pt;
      font-weight: 700;
      margin-bottom: 0.25in;
      color: #000;
      border-bottom: 2pt solid #000;
      padding-bottom: 0.1in;
    }
    
    h2 {
      font-size: 14pt;
      font-weight: 600;
      margin-top: 0.2in;
      margin-bottom: 0.1in;
      color: #000;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    h3 {
      font-size: 12pt;
      font-weight: 600;
      margin-top: 0.15in;
      margin-bottom: 0.05in;
      color: #1a1a1a;
    }
    
    p {
      margin-bottom: 0.1in;
    }
    
    /* ATS-friendly lists */
    ul, ol {
      margin-left: 0.25in;
      margin-bottom: 0.1in;
    }
    
    li {
      margin-bottom: 0.05in;
    }
    
    /* Links */
    a {
      color: #0066cc;
      text-decoration: none;
    }
    
    /* Strong emphasis */
    strong {
      font-weight: 600;
    }
    
    /* Print styles */
    @media print {
      body {
        padding: 0;
      }
      
      @page {
        margin: 0.5in;
      }
    }
    
    /* ATS: Avoid complex layouts */
    /* No flexbox, grid, or multi-column layouts */
    /* No background images */
    /* Semantic HTML only */
  </style>
</head>
<body>
  ${html}
</body>
</html>
  `.trim();

  return fullHTML;
}

/**
 * Validate that HTML is ATS-friendly
 */
export function validateATS(html) {
  const warnings = [];

  // Check for problematic elements
  if (html.includes('<table')) {
    warnings.push('Tables may not be ATS-friendly - consider using lists instead');
  }

  if (html.includes('background-image')) {
    warnings.push('Background images are not ATS-friendly');
  }

  if (html.includes('position: absolute') || html.includes('position: fixed')) {
    warnings.push('Absolute/fixed positioning may confuse ATS parsers');
  }

  return {
    isValid: warnings.length === 0,
    warnings,
  };
}
