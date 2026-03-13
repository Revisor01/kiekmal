# Requirements: Prayback

**Defined:** 2026-03-13
**Core Value:** Menschen finden auf einen Blick, was in Kirchengemeinden um sie herum passiert

## v1 Requirements

### Event Discovery

- [ ] **DISC-01**: User kann Karte mit Kirchen und Events in der Nähe sehen
- [ ] **DISC-02**: User kann Events nach Kategorie filtern (Gottesdienst, Konzert/Musik, Jugend/Konfi, Gemeindeleben, Lesung, Diskussion/Vortrag, Andacht)
- [ ] **DISC-03**: User kann Events nach Radius und Datum filtern
- [ ] **DISC-04**: User kann Event-Detailseite sehen (Titel, Datum, Zeit, Ort, Personen, Beschreibung, Bild, Anmeldung, Preis, Mitbringen)
- [ ] **DISC-05**: User kann Navigation zu einem Event starten (Weiterleitung an Google/Apple Maps)
- [ ] **DISC-06**: User kann zuletzt geladene Events und Karte auch offline sehen
- [ ] **DISC-07**: User kann minimales Gemeindeprofil sehen (Name, Adresse, Website-Link, kommende Events)

### Authentication

- [ ] **AUTH-01**: User kann App ohne Account nutzen (Karte browsen, Events sehen, navigieren)
- [ ] **AUTH-02**: User kann Account mit E-Mail und Passwort erstellen
- [ ] **AUTH-03**: User-Session bleibt über App-Neustart erhalten

### Admin & Datenpflege

- [ ] **ADMN-01**: Gemeinde-Admin kann Events über ein Web-Panel eintragen und verwalten
- [ ] **ADMN-02**: Gemeinde-Admin kann sein Gemeindeprofil pflegen
- [ ] **ADMN-03**: User kann Admin-Rolle für eine Gemeinde beantragen (manuelle Prüfung)
- [ ] **ADMN-04**: Bestehender Admin kann weitere Admins per Einladungscode hinzufügen
- [ ] **ADMN-05**: Events aus ChurchDesk werden automatisch synchronisiert

## v2 Requirements

### Gamification

- **GAME-01**: User kann sich per QR-Code bei einem Event einchecken
- **GAME-02**: User sammelt Prayback-Punkte für Check-Ins
- **GAME-03**: User erhält Badges/Achievements (X Gottesdienste, X mit Pastor Y, X in Kategorie Z)
- **GAME-04**: User kann Geofencing als Komfort-Check-In aktivieren

### Engagement

- **ENGM-01**: Gemeinde kann Ehrenamtliche für Events suchen
- **ENGM-02**: User kann Ansprechpartner in Gemeinden finden

### Komfort

- **COMF-01**: User erhält Push-Benachrichtigungen für Favoriten-Gemeinden
- **COMF-02**: User kann Gemeinden als Favoriten speichern
- **COMF-03**: Gemeinde-Admin kann Events direkt in der App eintragen

## Out of Scope

| Feature | Reason |
|---------|--------|
| Web-Version für Endnutzer | Fokus auf mobile App |
| Wiederkehrende Events (Serientermine) | Einfachere Logik, ChurchDesk liefert Einzeltermine |
| In-App-Navigation/Routing | Google/Apple Maps sind besser |
| Echtzeit-Chat | Nicht relevant für den Kern-Use-Case |
| Öffentliche Leaderboards | Passt nicht zur inklusiven kirchlichen Positionierung |
| Ticketing in der App | Rechtlich und technisch überdimensioniert |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DISC-01 | Phase 2 | Pending |
| DISC-02 | Phase 2 | Pending |
| DISC-03 | Phase 2 | Pending |
| DISC-04 | Phase 2 | Pending |
| DISC-05 | Phase 2 | Pending |
| DISC-06 | Phase 2 | Pending |
| DISC-07 | Phase 2 | Pending |
| AUTH-01 | Phase 2 | Pending |
| AUTH-02 | Phase 3 | Pending |
| AUTH-03 | Phase 3 | Pending |
| ADMN-01 | Phase 3 | Pending |
| ADMN-02 | Phase 3 | Pending |
| ADMN-03 | Phase 3 | Pending |
| ADMN-04 | Phase 3 | Pending |
| ADMN-05 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 15 total
- Mapped to phases: 15
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-13*
*Last updated: 2026-03-13 after roadmap creation*
