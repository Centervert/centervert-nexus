import { supabase } from "@/integrations/supabase/client";

interface CSVOpportunity {
  id: string;
  opportunity_number: string;
  name: string;
  type: string;
  status: string;
  priority: string;
  description: string;
  estimated_value: string;
  issuing_organization: string;
  requestor_contact_id: string;
  requestor_organization_id: string;
  procurement_officer_name: string;
  procurement_officer_email: string;
  procurement_officer_phone: string;
  due_date: string;
  award_date: string;
  submission_location_type: string;
  submission_address: string;
  submission_link: string;
  submission_notes: string;
  conference_name: string;
  conference_date: string;
  conference_location: string;
  issue_date: string;
  questions_deadline: string;
  notes: string;
  owner_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

type OpportunityStatus = 'new' | 'in_talks' | 'working_on_proposal' | 'proposal_submitted' | 'approved' | 'declined' | 'see_activity';
type OpportunityType = 'private' | 'government';
type OpportunityPriority = 'low' | 'medium' | 'high' | 'critical';
type SubmissionLocationType = 'in_person' | 'online' | 'other';

const mapStatus = (oldStatus: string): OpportunityStatus => {
  const statusMap: Record<string, OpportunityStatus> = {
    'submitted': 'proposal_submitted',
    'working_on_rfp': 'working_on_proposal',
    'lead': 'new',
    'new': 'new',
    'in_talks': 'in_talks',
    'approved': 'approved',
    'declined': 'declined'
  };
  return statusMap[oldStatus] || 'new';
};

const mapType = (oldType: string): OpportunityType => {
  return oldType === 'government' ? 'government' : 'private';
};

const mapPriority = (oldPriority: string): OpportunityPriority | null => {
  const validPriorities: OpportunityPriority[] = ['low', 'medium', 'high', 'critical'];
  const normalized = oldPriority?.toLowerCase();
  return validPriorities.includes(normalized as OpportunityPriority) 
    ? (normalized as OpportunityPriority) 
    : null;
};

const mapSubmissionLocation = (oldLocation: string): SubmissionLocationType | null => {
  const validLocations: SubmissionLocationType[] = ['in_person', 'online', 'other'];
  const normalized = oldLocation?.toLowerCase();
  return validLocations.includes(normalized as SubmissionLocationType)
    ? (normalized as SubmissionLocationType)
    : null;
};

const buildEnhancedDescription = (row: CSVOpportunity): string => {
  const parts: string[] = [];
  
  // Original description
  if (row.description) {
    parts.push(row.description);
  }
  
  // Issuing organization
  if (row.issuing_organization) {
    parts.push(`\n\n**Issuing Organization:** ${row.issuing_organization}`);
  }
  
  // Procurement officer info
  if (row.procurement_officer_name || row.procurement_officer_email || row.procurement_officer_phone) {
    parts.push('\n\n**Procurement Officer:**');
    if (row.procurement_officer_name) parts.push(`Name: ${row.procurement_officer_name}`);
    if (row.procurement_officer_email) parts.push(`Email: ${row.procurement_officer_email}`);
    if (row.procurement_officer_phone) parts.push(`Phone: ${row.procurement_officer_phone}`);
  }
  
  // Conference info
  if (row.conference_name || row.conference_date || row.conference_location) {
    parts.push('\n\n**Conference:**');
    if (row.conference_name) parts.push(`Name: ${row.conference_name}`);
    if (row.conference_date) parts.push(`Date: ${row.conference_date}`);
    if (row.conference_location) parts.push(`Location: ${row.conference_location}`);
  }
  
  // Important dates
  if (row.issue_date) {
    parts.push(`\n\n**Issue Date:** ${row.issue_date}`);
  }
  if (row.questions_deadline) {
    parts.push(`\n**Questions Deadline:** ${row.questions_deadline}`);
  }
  
  // Additional notes
  if (row.notes) {
    parts.push(`\n\n**Notes:** ${row.notes}`);
  }
  
  return parts.join('\n');
};

export const importOpportunitiesFromCSV = async (csvData: CSVOpportunity[]) => {
  const opportunities = csvData.map(row => ({
    // Core fields
    type: mapType(row.type),
    name: row.name,
    description: buildEnhancedDescription(row),
    status: mapStatus(row.status),
    priority: mapPriority(row.priority),
    
    // New fields from migration
    opportunity_number: row.opportunity_number || null,
    estimated_value: row.estimated_value ? parseFloat(row.estimated_value) : null,
    
    // Requestor
    requestor_contact_id: row.requestor_contact_id || null,
    requestor_organization_id: row.requestor_organization_id || null,
    
    // Dates
    due_date: row.due_date || null,
    award_date: row.award_date || null,
    
    // Submission location
    submission_location_type: mapSubmissionLocation(row.submission_location_type),
    submission_address: row.submission_address || null,
    submission_link: row.submission_link || null,
    submission_notes: row.submission_notes || null,
    
    // Owner/creator (will use current user if not valid)
    owner_id: row.owner_id || null,
    created_by: row.created_by || null,
  }));
  
  const { data, error } = await supabase
    .from('opportunities')
    .insert(opportunities)
    .select();
    
  if (error) {
    console.error('Import error:', error);
    throw error;
  }
  
  return data;
};

// Helper to parse CSV file
export const parseCSVFile = (file: File): Promise<CSVOpportunity[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',');
      
      const data: CSVOpportunity[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(',');
        const row: any = {};
        
        headers.forEach((header, index) => {
          row[header.trim()] = values[index]?.trim() || '';
        });
        
        data.push(row as CSVOpportunity);
      }
      
      resolve(data);
    };
    
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
};