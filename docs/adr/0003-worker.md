# ADR 0003: Samostatný worker

**Stav:** Přijato

Dlouhé a opakovatelné operace poběží mimo HTTP request v samostatném Node.js workeru. Fronta bude používat PostgreSQL a idempotentní joby. Worker se přidá až po ručních core flow, aby nezvyšoval složitost první vertikály.
