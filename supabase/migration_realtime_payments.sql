-- Enable Realtime for the payments table so the UI auto-refreshes
-- when a payment_intent.succeeded webhook inserts a payment record.
ALTER PUBLICATION supabase_realtime ADD TABLE payments;
