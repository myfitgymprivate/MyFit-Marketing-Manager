# Databázový model v0.1

První migrace pokrývá nejnižší bezpečný základ pro ručně ovladatelnou aplikaci. Produkční databází je PostgreSQL/Supabase; Google Sheet není použit jako databáze, protože neposkytuje transakce, izolaci workspace, bezpečné role ani spolehlivou idempotenci.

## Zahrnuté tabulky

| Tabulka             | Účel                                                    |
| ------------------- | ------------------------------------------------------- |
| `profiles`          | profil Ownera a lokální nastavení                       |
| `workspaces`        | oddělení všech business dat                             |
| `workspace_members` | vazba uživatele na workspace                            |
| `content_items`     | Story, Reel a Post včetně stavu a verze                 |
| `story_frames`      | navazující obrazovky Story                              |
| `reel_scenes`       | časovaný scénář a shotlist Reelu                        |
| `task_series`       | opakovaná pravidla úkolů                                |
| `task_occurrences`  | konkrétní splnění a termíny                             |
| `campaigns`         | kampaně a explicitní potvrzení slevy                    |
| `audit_log`         | dohledatelnost ručních, systémových a budoucích AI změn |
| `idempotency_keys`  | ochrana před duplicitním provedením mutací              |

## Rozšíření pro AI marketingového juniora

| Tabulka                                      | Účel                                                                |
| -------------------------------------------- | ------------------------------------------------------------------- |
| `monthly_plans`                              | schvalované měsíční strategie a jejich verze                        |
| `content_variants`                           | tři a více textových variant, výběr a historie                      |
| `media_assets`, `content_assets`             | fotografie, generované podklady a finální vizuály navázané na obsah |
| `ai_conversations`, `ai_messages`            | samostatná komunikace s agentem u každé události                    |
| `ai_runs`                                    | model, prompt, stav, náklady a výsledek každé AI operace            |
| `marketing_memory`                           | ověřená fakta, brand pravidla, preference a odvozené vzorce         |
| `trend_signals`                              | trendy se zdrojem, relevancí, expirací a MyFit adaptací             |
| `reservation_snapshots`, `reservation_slots` | historická a budoucí vytíženost rezervačního kalendáře              |
| `notifications`                              | připomínky, chybějící grafiky a upozornění na obsazenost            |
| `automation_jobs`, `automation_job_runs`     | plánované hodinové, denní a týdenní kontroly s historií běhů        |

## Bezpečnostní invariants

- `workspace_id` je od začátku součástí všech business dat.
- Aktivace navržené slevy vyžaduje `financial_confirmed_at` i `financial_confirmed_by`.
- Editace obsahu a úkolů používá pole `version` pro optimistic locking.
- Denní carry-over úkol má nanejvýš jeden otevřený výskyt.
- Audit ukládá bezpečný diff a correlation ID, ne celé citlivé prompty.

RLS politiky a vazba na `auth.users` budou doplněny po založení konkrétního Supabase projektu, aby migrace odpovídala jeho auth schématu a deployment procesu.
