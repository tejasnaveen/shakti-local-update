# Database Migration Required

## Issue
The "Payment Received" button fails with error:
```
Failed to record payment log: new row for relation "case_call_logs" violates check constraint "case_call_logs_call_status_check"
```

## Root Cause
The `call_status` column in `case_call_logs` table has a CHECK constraint that doesn't include `'PAYMENT_RECEIVED'`.

## Solution
Run the migration to add `'PAYMENT_RECEIVED'` to the allowed values.

## How to Apply Migration

### Option 1: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste this SQL:

```sql
-- Drop the existing constraint
ALTER TABLE case_call_logs DROP CONSTRAINT IF EXISTS case_call_logs_call_status_check;

-- Add the new constraint with PAYMENT_RECEIVED included
ALTER TABLE case_call_logs ADD CONSTRAINT case_call_logs_call_status_check 
  CHECK (call_status IN ('WN', 'SW', 'RNR', 'BUSY', 'CALL_BACK', 'PTP', 'FUTURE_PTP', 'BPTP', 'RTP', 'NC', 'CD', 'INC', 'PAYMENT_RECEIVED'));
```

4. Click **Run** to execute

### Option 2: Using Local PostgreSQL
If you have PostgreSQL installed locally:

```bash
# Connect to your database
psql -h localhost -U postgres -d shakti_crm

# Then run:
ALTER TABLE case_call_logs DROP CONSTRAINT IF EXISTS case_call_logs_call_status_check;
ALTER TABLE case_call_logs ADD CONSTRAINT case_call_logs_call_status_check 
  CHECK (call_status IN ('WN', 'SW', 'RNR', 'BUSY', 'CALL_BACK', 'PTP', 'FUTURE_PTP', 'BPTP', 'RTP', 'NC', 'CD', 'INC', 'PAYMENT_RECEIVED'));
```

### Option 3: Using Supabase CLI
If you have Supabase CLI installed:

```bash
supabase db push
```

## After Migration
Once the migration is applied:
- ✅ **Status Update** button will work (already fixed)
- ✅ **Payment Received** button will work (will be able to create call logs)

## Files Updated
- [10_case_call_logs.sql](file:///c:/Users/yanavi/Documents/project/supabase/tables/10_case_call_logs.sql) - Updated schema
- [add_payment_received_status.sql](file:///c:/Users/yanavi/Documents/project/supabase/migrations/add_payment_received_status.sql) - Migration file
