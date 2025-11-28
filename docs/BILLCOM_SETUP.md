# Bill.com Integration Setup Guide

## Overview

This integration syncs invoices from Bill.com to your application. The data flow is **one-way**: Bill.com → Your App.

## How It Works

### Data Flow
1. You create invoices in Bill.com (manually or via their API in the future)
2. Invoices are synced to your app **ONLY IF**:
   - The Bill.com customer exists as an organization in your system
   - The organization has `billcom_customer_id` set (linked)
3. Invoices appear in your billing dashboard
4. Clients receive invoice emails from Bill.com and pay through Bill.com's portal

### ⚠️ Important: Invoice Sync Rules

**What Gets Synced:**
✅ Invoices for Bill.com customers that are linked to organizations in your system
✅ Organization must have `billcom_customer_id` field populated

**What Does NOT Get Synced:**
❌ Invoices for Bill.com customers NOT in your system
❌ Invoices for organizations without `billcom_customer_id`

**Example:**
- You have Organization "Acme Corp" in your app
- Acme Corp is linked to Bill.com Customer ID "abc-123"
- You create an invoice in Bill.com for customer "abc-123"
- ✅ Invoice syncs to your app and appears under Acme Corp

**If customer doesn't exist in your system:**
- You invoice Bill.com customer "xyz-789" 
- No organization in your system has `billcom_customer_id = "xyz-789"`
- ❌ Invoice does NOT sync to your app
- Invoice still exists in Bill.com, just not visible in your app

### Sync Behavior

**Automated Hourly Sync:**
- Runs every hour at :00
- Loops through ALL organizations with `billcom_customer_id`
- Syncs invoices for each linked organization
- Skips organizations without Bill.com customer ID

**Manual Sync:**
- "Sync Invoices" button: Syncs ALL linked organizations
- Organization-specific sync: Syncs only that organization's invoices

### Organization Linking

**Critical**: Organizations must be linked to Bill.com customers using the `billcom_customer_id` field.

**Three ways to link:**

#### 1. Automatic Matching (Recommended)
Click "Link Customers" button in billing dashboard:
- Fetches all customers from Bill.com
- Matches by billing email
- Links organizations automatically

#### 2. Manual Linking
Edit organization → Set "Bill.com Customer ID" field:
1. Find customer ID in Bill.com
2. Copy it
3. Paste into organization's `billcom_customer_id` field

#### 3. First Invoice Auto-Link
When an invoice syncs:
- If organization has matching billing email
- Automatically links on first sync

## Setup Steps

### 1. Prerequisites
✅ Bill.com Production account
✅ API credentials configured (already done):
   - `BILLCOM_ORG_ID`
   - `BILLCOM_DEV_KEY`
   - `BILLCOM_PASSWORD`

### 2. Link Organizations to Bill.com Customers

**Option A: Bulk Auto-Link (Easiest)**
1. Go to `/billing` in your app
2. Click "Link Customers" button
3. System matches organizations by billing email
4. Check results in toast notification

**Option B: Manual Per-Organization**
1. Get customer ID from Bill.com
2. Edit organization in your app
3. Set "Bill.com Customer ID" field
4. Save

### 3. Initial Invoice Sync
1. Create test invoice in Bill.com for a linked customer
2. Click "Sync Invoices" in your billing dashboard
3. Invoice should appear in the table

### 4. Automated Sync (Already Configured)
✅ Cron job runs every hour at :00
✅ Automatically syncs new/updated invoices
✅ No action needed

## Testing the Integration

### Test Customer Linking
```bash
# Call the customer sync function
curl -X POST https://tcuxcnszolrkozktpilz.supabase.co/functions/v1/sync-billcom-customers \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json"
```

### Test Invoice Sync
```bash
# Sync all invoices
curl -X POST https://tcuxcnszolrkozktpilz.supabase.co/functions/v1/sync-billcom-invoices \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'

# Sync specific organization
curl -X POST https://tcuxcnszolrkozktpilz.supabase.co/functions/v1/sync-billcom-invoices \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"organization_id": "org-uuid-here"}'
```

## Troubleshooting

### No Invoices Appearing
1. **Check Organization Linking**:
   - Does organization have `billcom_customer_id`?
   - Click "Link Customers" button
   
2. **Check Bill.com Customer**:
   - Is customer active in Bill.com?
   - Does billing email match?

3. **Check Edge Function Logs**:
   - Go to Cloud → Edge Functions → `sync-billcom-invoices`
   - Look for errors in logs

### Invoice Not Syncing
1. **Verify customer ID**: Organization's `billcom_customer_id` must match Bill.com customer
2. **Check invoice status**: Invoice must exist in Bill.com
3. **Try manual sync**: Click "Sync Invoices" button
4. **Check logs**: View edge function logs for errors

### Authentication Errors
- Verify Bill.com credentials in secrets
- Check if Bill.com account is active
- Ensure you're using Production credentials (not Sandbox)

## Bill.com Workflow

### For MCP Clients (Recurring)
1. Set up recurring invoice in Bill.com
2. Bill.com auto-generates monthly invoices
3. Invoices sync hourly to your app
4. Client receives email from Bill.com
5. Client pays via Bill.com portal

### For Dev Clients (One-Time)
1. Create manual invoice in Bill.com
2. Add line items for sprint work
3. Send invoice
4. Syncs to your app within an hour (or click "Sync Invoices")
5. Client receives email and pays via Bill.com

## Future Enhancements

- **Option B**: Create invoices from your app (pushes to Bill.com)
- **Recurring templates**: Manage MCP subscriptions from your app
- **Payment notifications**: Real-time payment updates
- **Invoice creation UI**: Build invoices without leaving your app

## Support

If you encounter issues:
1. Check edge function logs in Cloud → Edge Functions
2. Verify Bill.com API credentials
3. Test with a simple invoice in Bill.com first
4. Check organization linking status
