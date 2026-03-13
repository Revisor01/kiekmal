# Prayback

## What This Is

Eine Cross-Platform App (Android + iOS) die kirchliche Veranstaltungen in der Umgebung auf einer Karte anzeigt. Nutzer können Events entdecken, sich einchecken und "Prayback-Punkte" sammeln. Gemeinden — mit oder ohne ChurchDesk — können ihre Events einstellen. Die App richtet sich an die breite Gemeinde aller Altersgruppen und soll kirchliches Engagement sichtbar und spielerisch machen.

## Core Value

Menschen finden auf einen Blick, was in Kirchengemeinden um sie herum passiert — und werden durch Gamification motiviert, hinzugehen.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Karte mit Kirchen und Events in der Nähe
- [ ] Events aus ChurchDesk automatisch synchronisieren
- [ ] Events manuell eintragen (Gemeinden ohne ChurchDesk)
- [ ] Event-Detailseite mit allen relevanten Infos
- [ ] Navigation zu Events (Weiterleitung an Google/Apple Maps)
- [ ] Nutzung ohne Account (Karte browsen, Events sehen)
- [ ] User-Account mit Prayback-Punkten und Check-In
- [ ] QR-Code-basierter Check-In pro Gemeinde
- [ ] Geofencing als Komfort-Layer für Check-In
- [ ] Badges/Achievements (X Gottesdienste, X mit Pastor Y, X in Kategorie Z, etc.)
- [ ] Gemeinde-Admin-Rolle (Events verwalten in App + Web-Panel)
- [ ] Verifizierungssystem für Gemeinde-Admins (Antrag + Einladungscodes)
- [ ] Minimales Gemeindeprofil (Name, Adresse, Link, kommende Events)
- [ ] Offline-Cache für geladene Events und Karte
- [ ] Einfaches Web-Panel für Sekretariate zur Event-Verwaltung
- [ ] Ehrenamtlichen-Suche für Events
- [ ] Ansprechpartner finden

### Out of Scope

- Push-Benachrichtigungen — kommt nach v1 mit Account-Features
- Web-Version für Endnutzer — Fokus auf mobile App
- Wiederkehrende Events (Serientermine) — Events werden einzeln eingetragen
- Eigene In-App-Navigation/Routing — externe Maps-Apps reichen
- Echtzeit-Chat — nicht relevant für den Kern-Use-Case

## Context

### Datenquellen
- **ChurchDesk API**: Zugang vorhanden. Primäre automatische Datenquelle für Gemeinden die ChurchDesk nutzen. Nicht alle Gemeinden haben ChurchDesk — daher eigene Event-Erfassung nötig.
- **Manuelle Eingabe**: Gemeinde-Admins tragen Events über App oder Web-Panel ein.

### Event-Datenmodell
- Titel, Datum, Uhrzeit
- Ort (Kirche + Adresse + Koordinaten)
- Gemeinde
- Kategorie: Gottesdienst, Konzert/Musik, Jugend/Konfi, Gemeindeleben, Lesung, Diskussion/Vortrag, Andacht
- Personen (Pastor, Leitung, Musiker — nicht nur Pastoren)
- Beschreibungstext
- Bild (optional, Fallback auf Kategorie-Icon oder Kirchenfoto)
- Anmeldung erforderlich? → Ja/Nein, wenn ja: Telefon oder Website
- Was mitbringen
- Preis / Tickets (Link)

### Nutzungsebenen
1. **Ohne Account**: Karte browsen, Events sehen, Navigation starten
2. **Mit Account (User)**: Punkte sammeln, Check-In, Favoriten
3. **Mit Account (Gemeinde-Admin)**: Events eintragen/verwalten für eigene Gemeinde

### Check-In-Mechanik
- QR-Code pro Gemeinde (dauerhaft, nicht pro Event) — einmal scannen bestätigt Anwesenheit
- Geofencing als zusätzlicher Komfort-Layer
- Check-In löst Prayback-Punkte und Badge-Fortschritt aus

### Prayback-Punkte & Badges
- X Gottesdienste besucht (gesamt / in Gemeinde / im Kirchenkreis)
- X Veranstaltungen besucht (gesamt / in Gemeinde)
- X Gottesdienste mit Pastor XYZ
- X Gottesdienste in Kategorie XYZ
- Weitere Badges erweiterbar

### Gemeinde-Admin-Verifizierung
- Erstregistrierung: Antrag + manuelle Prüfung
- Danach: Admin kann weitere Admins per Einladungscode hinzufügen

### Infrastruktur
- Backend auf server.godsapp.de (Docker)
- Hybrid-Persistenz: Server ist Source of Truth, App cached lokal für Performance

### Design
- Warm, einladend, freundlich — kirchlicher Touch ohne kitschig
- Zugänglich für alle Altersgruppen (breite Gemeinde, inkl. 60+)

## Constraints

- **Tech-Stack Frontend**: React Native mit Expo (TypeScript) — Cross-Platform, großes Ökosystem
- **Tech-Stack Backend**: Node.js + PostgreSQL mit PostGIS — TypeScript durchgängig, Geo-Queries nativ
- **Hosting**: server.godsapp.de (Docker) — bestehende Infrastruktur
- **Scope**: Deutschlandweit offen, nicht auf einen Kirchenkreis beschränkt
- **Karten-Performance**: Clustering nötig bei vielen Gemeinden/Events auf der Karte
- **ChurchDesk-Abhängigkeit**: API-Sync muss Rate-Limits und Datenqualität berücksichtigen
- **Barrierefreiheit**: Breite Zielgruppe erfordert einfache, intuitive Bedienung

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| React Native + Expo statt Flutter | Keine Flutter/Dart-Erfahrung, TypeScript durchgängig nutzbar | — Pending |
| Node.js + PostgreSQL/PostGIS | Gleiche Sprache wie Frontend, PostGIS für Geo-Features | — Pending |
| QR-Code pro Gemeinde (nicht pro Event) | Einmal-Setup, kein wiederholtes Generieren nötig | — Pending |
| Eigenes Backend statt nur ChurchDesk | Nicht alle Gemeinden nutzen ChurchDesk, Punkte/Badges brauchen eigene Persistenz | — Pending |
| Browse ohne Account | Niedrige Einstiegshürde für breite Zielgruppe | — Pending |
| Events einzeln statt Serientermine | Einfachere Logik, ChurchDesk-Sync liefert ohnehin Einzeltermine | — Pending |
| Externe Navigation statt In-App-Routing | Weniger Komplexität, Google/Apple Maps sind besser | — Pending |

---
*Last updated: 2026-03-13 after initialization*
