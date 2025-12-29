import { ElementorElement, ParserResult, SectionPart, ElementorEnvelope } from '../types';

/**
 * Helper to create the mandatory Elementor JSON Envelope.
 * Without this, Elementor throws "Invalid Content".
 */
const wrapForElementor = (elements: ElementorElement[], title: string): ElementorEnvelope => {
  return {
    version: "0.4",
    title: title,
    type: "page",
    content: elements
  };
};

/**
 * Converts an HTML string into a sliced Elementor JSON structure.
 * Returns both the full site and individual sections wrapped in valid Elementor envelopes.
 */
export const convertHtmlToElementor = (htmlString: string): ParserResult => {
  // Create a sandboxed container to parse the HTML
  const parserContainer = document.createElement('div');
  parserContainer.style.position = 'absolute';
  parserContainer.style.top = '-9999px';
  parserContainer.style.width = '1200px'; // Desktop viewport simulation
  parserContainer.innerHTML = htmlString;
  document.body.appendChild(parserContainer);

  const stats = { widgets: 0, sections: 0, customCssInjected: false };
  let rootChildren = Array.from(parserContainer.children) as HTMLElement[];

  // UNWRAP LOGIC: If there is only one child and it is a generic wrapper (div/main), use its children
  if (rootChildren.length === 1 && ['DIV', 'MAIN'].includes(rootChildren[0].tagName)) {
    rootChildren = Array.from(rootChildren[0].children) as HTMLElement[];
  }

  const rawFullSiteElements: ElementorElement[] = [];
  const sectionsList: SectionPart[] = [];

  rootChildren.forEach((child) => {
    // Ignore non-visual elements
    if (['SCRIPT', 'STYLE', 'LINK', 'META'].includes(child.tagName)) return;

    const processedElement = processNode(child, stats);

    if (processedElement) {
      // Add to raw list for full site
      rawFullSiteElements.push(processedElement);

      // Create Individual Section Slice (Wrapped)
      const sectionName = getSectionName(child);
      const sectionId = child.id || `section-${stats.sections}`;
      
      sectionsList.push({
        name: sectionName,
        id: sectionId,
        json_content: wrapForElementor([processedElement], sectionName)
      });
    }
  });

  // Cleanup
  document.body.removeChild(parserContainer);

  return { 
    full_site: wrapForElementor(rawFullSiteElements, "Site Completo AI"),
    sections: sectionsList,
    stats 
  };
};

// PT-BR Naming Logic
const getSectionName = (el: HTMLElement): string => {
  const tag = el.tagName.toLowerCase();
  const id = el.id ? ` (${el.id})` : '';

  switch (tag) {
    case 'header': return 'Cabeçalho' + id;
    case 'footer': return 'Rodapé' + id;
    case 'nav': return 'Menu de Navegação' + id;
    case 'section': return 'Sessão' + id;
    case 'article': return 'Artigo' + id;
    case 'aside': return 'Lateral (Aside)' + id;
    default: return 'Container' + id;
  }
};

const generateId = () => Math.random().toString(36).substr(2, 7);

const getAppliedStyles = (el: HTMLElement) => {
  return window.getComputedStyle(el);
};

// Helper to extract complex CSS for Custom CSS injection
const extractCustomCss = (el: HTMLElement, styles: CSSStyleDeclaration): string => {
  let customCss = '';
  
  // Neon Glows / Complex Shadows
  if (styles.boxShadow && styles.boxShadow !== 'none' && styles.boxShadow.includes('rgba')) {
    customCss += `selector { box-shadow: ${styles.boxShadow}; } `;
  }
  
  // Glassmorphism / Backdrop Filter
  if ((styles as any).backdropFilter && (styles as any).backdropFilter !== 'none') {
    customCss += `selector { backdrop-filter: ${(styles as any).backdropFilter}; -webkit-backdrop-filter: ${(styles as any).backdropFilter}; } `;
  }

  // Complex Gradients
  if (styles.backgroundImage && styles.backgroundImage.includes('gradient')) {
    customCss += `selector { background-image: ${styles.backgroundImage} !important; } `;
  }

  // Border Radius
  if (styles.borderRadius && styles.borderRadius !== '0px') {
      customCss += `selector { border-radius: ${styles.borderRadius}; } `;
  }

  // Text Color fallback (if not handled by widget)
  if (styles.color && styles.color !== 'rgb(224, 224, 224)') { // default body color
      customCss += `selector { color: ${styles.color}; } `;
  }

  return customCss;
};

const processNode = (node: HTMLElement, stats: any): ElementorElement | null => {
  if (['SCRIPT', 'STYLE'].includes(node.tagName)) return null;

  const styles = getAppliedStyles(node);
  const tagName = node.tagName.toLowerCase();
  const hasChildren = node.children.length > 0;

  // --- WIDGET DETECTION ---
  // Elements that are definitely widgets (End nodes)

  if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
    stats.widgets++;
    return createWidget('heading', {
      title: node.innerText,
      header_size: tagName,
      _custom_css: extractCustomCss(node, styles)
    });
  }

  if (tagName === 'p' || tagName === 'span' || tagName === 'label') {
     // Check if it's acting as a container (has significant children)
     if (hasChildren && node.innerText.length > 50) {
         // Fall through to Container Logic
     } else {
        stats.widgets++;
        return createWidget('text-editor', {
            editor: node.innerHTML,
            _custom_css: extractCustomCss(node, styles)
        });
     }
  }

  if (tagName === 'img') {
    stats.widgets++;
    return createWidget('image', {
      image: { url: (node as HTMLImageElement).src },
      _custom_css: extractCustomCss(node, styles)
    });
  }

  if (tagName === 'button' || (tagName === 'a' && node.classList.contains('btn'))) {
    stats.widgets++;
    return createWidget('button', {
      text: node.innerText,
      link: { url: (node as HTMLAnchorElement).href || '#' },
      _custom_css: extractCustomCss(node, styles)
    });
  }

  if (tagName === 'input' || tagName === 'textarea') {
      // Basic support for form fields as text (since Elementor Forms are Pro widgets)
      stats.widgets++;
      return createWidget('html', {
          html: node.outerHTML, // Fallback to raw HTML for inputs
      });
  }

  // --- CONTAINER LOGIC (The "Container Only" Protocol) ---
  // Everything else is a Container (div, section, nav, header, footer, article...)
  
  stats.sections++;
  
  // Determine layout direction based on CSS
  const isFlexRow = styles.display === 'flex' && styles.flexDirection === 'row';
  // If it's grid, we treat it as a container but might need custom CSS to enforce grid if Elementor doesn't support the specific grid spec natively in the basics.
  // For safety, we default to flex column unless it's explicitly a flex row.
  
  const element: ElementorElement = {
    id: generateId(),
    elType: 'container', // MANDATORY: Always 'container', never 'section' or 'column'
    isInner: false,
    settings: {
        content_width: 'full', // Default to full to allow nesting without arbitrary boxing
        flex_direction: isFlexRow ? 'row' : 'column',
        flex_wrap: styles.flexWrap === 'wrap' ? 'wrap' : 'nowrap',
        // Inject visual styles
        _custom_css: extractCustomCss(node, styles)
    },
    elements: []
  };

  // Map Background
  if (styles.backgroundColor && styles.backgroundColor !== 'rgba(0, 0, 0, 0)') {
      element.settings.background_background = 'classic';
      element.settings.background_color = styles.backgroundColor;
  }

  // Process Children recursively
  Array.from(node.children).forEach(child => {
    const processedChild = processNode(child as HTMLElement, stats);
    if (processedChild) {
      element.elements.push(processedChild);
    }
  });

  return element;
};

const createWidget = (type: string, settings: any): ElementorElement => {
  return {
    id: generateId(),
    elType: 'widget',
    widgetType: type,
    settings: settings,
    elements: []
  };
};
