export interface DeliverableTemplate {
  id: string;
  name: string;
  description: string;
  links: Array<{
    title: string;
    link_type: string;
  }>;
}

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
