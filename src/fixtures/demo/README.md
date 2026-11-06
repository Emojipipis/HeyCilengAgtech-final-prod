# Demo fixtures — illustrative data only

Everything in this folder is **made-up sample data** for Demo Preview Mode (`VITE_DEMO_MODE=true`).
It does not describe real customers, businesses, transactions, payments, logistics partners or platform analytics.

Rules:

- Every record carries `isDemo: true`, and every view that renders demo data shows a `DemoBadge` / demo banner.
- No real logistics companies, tracking numbers or payment records. Partners are named "Demo Logistics Partner …",
  tracking references start with `DEMO-`, and payments are always `integration_pending`.
- Fixtures are only read by `src/services/demo/*`. Pages never import them directly, so replacing the demo services
  with Supabase-backed ones removes the fixtures from the app entirely.
