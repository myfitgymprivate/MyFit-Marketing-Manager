# ADR 0005: Potvrzování AI akcí

**Stav:** Přijato

AI nemá přímý přístup k databázi. Čtení, vratné drafty, explicitní změny a finanční či nevratné akce mají oddělené rizikové úrovně. Finanční akce vždy vyžadují samostatné serverové potvrzení Ownera; všechny změny používají doménovou validaci, audit a podle rizika Undo.
