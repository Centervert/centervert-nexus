export interface DeliverableTemplate {
  id: string;
  name: string;
  description: string;
  links: Array<{
    title: string;
    link_type: string;
  }>;
}

export const LINK_TYPES = [
  { value: 'demo', label: 'Demo URL' },
  { value: 'production', label: 'Production URL' },
  { value: 'staging', label: 'Staging URL' },
  { value: 'branding_guide', label: 'Branding Guide' },
  { value: 'google_drive', label: 'Google Drive' },
  { value: 'dropbox', label: 'Dropbox' },
  { value: 'documentation', label: 'Documentation' },
  { value: 'asset_library', label: 'Asset Library' },
  { value: 'reference', label: 'Reference Material' },
  { value: 'figma', label: 'Figma Design' },
  { value: 'other', label: 'Other' },
] as const;

export const DELIVERABLE_TEMPLATES: DeliverableTemplate[] = [
  {
    id: 'website',
    name: 'Website/Landing Page',
    description: 'Standard website project deliverables',
    links: [
      { title: 'Demo URL', link_type: 'demo' },
      { title: 'Production URL', link_type: 'production' }
    ]
  }
];
