export interface ElementorElement {
  id: string;
  elType: 'section' | 'column' | 'widget' | 'container';
  isInner?: boolean;
  settings: Record<string, any>;
  elements: ElementorElement[];
  widgetType?: string; // Only for widgets
}

export interface ElementorEnvelope {
  version: string;
  title: string;
  type: string;
  content: ElementorElement[];
}

export interface GenerationRequest {
  prompt: string;
  image?: File | null;
}

export interface SectionPart {
  name: string;
  id: string;
  json_content: ElementorEnvelope; // Must be the enveloped object, not raw array
}

export interface ParserResult {
  full_site: ElementorEnvelope; // Must be the enveloped object
  sections: SectionPart[];
  stats: {
    widgets: number;
    sections: number;
    customCssInjected: boolean;
  };
}
