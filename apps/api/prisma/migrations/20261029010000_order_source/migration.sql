-- Issue 237: where a buyer came from (UTM, referrer, landing page), like Lead.source. Additive.
ALTER TABLE "Order" ADD COLUMN "source" JSONB;
