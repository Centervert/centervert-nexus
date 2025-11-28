# Bill.com Webhook Handler

This edge function receives webhook notifications from Bill.com and syncs invoice and payment data to the local database.

## Setup

1. **Configure secrets** (already done):
   - `BILLCOM_ORG_ID`
   - `BILLCOM_DEV_KEY`
   - `BILLCOM_PASSWORD`

2. **Configure webhook in Bill.com**:
   - Go to your Bill.com account settings
   - Navigate to Webhooks/API section
   - Add a new webhook endpoint: `https://tcuxcnszolrkozktpilz.supabase.co/functions/v1/billcom-webhook`
   - Subscribe to these events:
     - `invoice.created`
     - `invoice.updated`
     - `invoice.sent`
     - `invoice.viewed`
     - `invoice.paid`
     - `payment.created`
     - `payment.updated`
     - `customer.created`
     - `customer.updated`

## Supported Events

- **Invoice Events**: Creates/updates local invoice records when invoices are created, updated, sent, viewed, or paid in Bill.com
- **Payment Events**: Records payments when made in Bill.com
- **Customer Events**: Links organizations to Bill.com customers automatically

## Testing

You can test the webhook using curl:

```bash
curl -X POST https://tcuxcnszolrkozktpilz.supabase.co/functions/v1/billcom-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "invoice.created",
    "data": {
      "invoice": {
        "id": "test-123",
        "customerId": "cust-123",
        "invoiceNumber": "INV-001",
        "status": "Sent",
        "amount": "1000.00",
        "amountDue": "1000.00",
        "invoiceDate": "2025-01-15",
        "dueDate": "2025-02-15"
      }
    }
  }'
```
