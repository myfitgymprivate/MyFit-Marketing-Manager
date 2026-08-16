# ADR 0002: PostgreSQL a Supabase

**Stav:** Přijato

Produkční data budou v PostgreSQL provozovaném přes Supabase. Supabase poskytne Auth, privátní Storage a RLS. Drizzle drží explicitní schéma a verzované migrace. Google Sheet lze používat pro pracovní číselníky nebo testovací data, ne jako produkční databázi.
