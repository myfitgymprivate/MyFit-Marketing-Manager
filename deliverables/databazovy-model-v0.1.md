# MyFit Marketing Manager – databázový model v0.1

Produkční databází bude PostgreSQL/Supabase. Google Sheet není vhodný jako produkční databáze, protože nezajišťuje potřebné transakce, bezpečné role, izolaci workspace ani spolehlivou ochranu před duplicitními změnami.

## Core tabulky

| Tabulka             | Účel                                                    |
| ------------------- | ------------------------------------------------------- |
| `profiles`          | profil Ownera a lokální nastavení                       |
| `workspaces`        | oddělení všech business dat                             |
| `workspace_members` | vazba Ownera na workspace                               |
| `content_items`     | Story, Reel a Post včetně stavu a verze                 |
| `story_frames`      | navazující obrazovky Story                              |
| `reel_scenes`       | časovaný scénář a shotlist Reelu                        |
| `task_series`       | opakovaná pravidla úkolů                                |
| `task_occurrences`  | konkrétní splnění a termíny                             |
| `campaigns`         | kampaně a explicitní potvrzení slevy                    |
| `audit_log`         | dohledatelnost ručních, systémových a budoucích AI změn |
| `idempotency_keys`  | ochrana před duplicitním provedením mutací              |

## Pevná pravidla

- Všechna business data jsou od začátku oddělena přes `workspace_id`.
- Navrženou slevu nelze aktivovat bez potvrzení Ownera.
- Editace obsahu a úkolů používá verzi proti nechtěnému přepsání.
- Denní kumulovaný úkol má nanejvýš jeden otevřený výskyt.
- Audit ukládá bezpečný diff a identifikátor požadavku, ne citlivé prompty.

RLS politiky a vazba na `auth.users` budou doplněny při založení konkrétního Supabase projektu. Zdrojové schéma a SQL migrace jsou součástí implementačního archivu.
