# Feature Research

**Domain:** Church event discovery app with gamification (mobile, cross-platform)
**Researched:** 2026-03-13
**Confidence:** MEDIUM (competitor analysis via WebSearch; gamification patterns verified across multiple sources)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Karte mit Events in der Nähe | Jede Event-Discovery-App hat eine Kartenansicht (Eventbrite, Meetup, Foursquare) | MEDIUM | Clustering bei vielen Pins zwingend nötig; PostGIS radius-Queries |
| Event-Liste / Feed als Alternative zur Karte | Karte allein ist für 60+-Nutzer ungewohnt; Listenansicht ist barrierefreier | LOW | Parallel zur Karte; sortierbar nach Datum und Distanz |
| Event-Detailseite | Titel, Datum, Uhrzeit, Ort, Beschreibung, Bild — alles was Entscheidung ermöglicht | LOW | Inkl. "Was mitbringen", Preis, Anmeldung-Link wenn nötig |
| Kategoriefilter | Alle Event-Apps (Meetup, Eventbrite) haben Kategorisierung; Nutzer erwarten Filterung | LOW | Gottesdienst / Konzert / Jugend / Gemeindeleben / Lesung / Vortrag / Andacht |
| Navigation zu Event starten | Nutzer wollen direkt zu Google/Apple Maps weitergeleitet werden | LOW | Deep-Link zu externen Maps; kein eigenes Routing |
| Browsen ohne Account | Niedrige Einstiegshürde ist Standard für Discovery-Apps | LOW | Punkte/Check-In nur mit Account — aber Karte immer offen |
| Gemeindeprofil (minimal) | Nutzer wollen wissen, wer hinter dem Event steckt | LOW | Name, Adresse, Konfession, kommende Events, Link zur Website |
| Suche nach Ort / PLZ | Nutzer wollen nicht nur "um mich herum", sondern auch gezielt suchen | LOW | Geocoding nötig; Suchfeld mit Autosuggest |
| Bild-Fallback wenn kein Event-Bild | Leere Events wirken kaputt; Fallback auf Kategorie-Icon oder Kirchenfoto | LOW | Bereits im Datenmodell vorgesehen |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Prayback-Punkte & Check-In | Kein anderer kirchlicher Event-Aggregator gamifiziert Kirchenbesuche; schafft Wiederholungsanreiz | MEDIUM | QR-Code pro Gemeinde (dauerhaft); Punkte-Vergabe serverseitig |
| Badges / Achievements | Swarm-ähnliche Mechanik, aber mit kirchlichem Kontext (X Gottesdienste, X mit Pastor Y) | MEDIUM | Badge-Definitionen müssen erweiterbar sein ohne App-Update (konfigurierbar im Backend) |
| ChurchDesk-Synchronisation | Gemeinden ohne Datenpflege-Aufwand; ChurchDesk ist in Deutschland verbreitet | HIGH | API-Rate-Limits, Datenmapping, Delta-Sync; Fehlertolerant designen |
| Konfessionsübergreifende Aggregation | Kein bestehender Aggregator bündelt ev. + kath. + Freikirchen in einer Karte | MEDIUM | Gemeinde-Typen im Datenmodell, Konfessionsfilter optional |
| Geofencing als Komfort-Layer | QR allein reicht, Geofencing macht Check-In für 60+ einfacher | MEDIUM | Android-Geofencing hat bis zu 2 Min Latenz; als sekundäre Methode, nicht primäre |
| Ehrenamtlichen-Suche | Gemeinden finden Helfer direkt in der App; Nutzer können sich einbringen | HIGH | Komplexe Matching-Logik; In v1 nur einfaches "Hilfe anbieten" ohne Matching |
| Ansprechpartner-Verzeichnis | Nutzer finden nicht nur Events, sondern Personen (Pastor, Jugendleitung) | MEDIUM | Datenschutz-sensitiv: nur öffentlich freigegebene Kontakte anzeigen |
| Gemeinde-Admin-Verifizierung mit Einladungskodesystem | Verhindert Fake-Gemeinden; skalierbares Onboarding | MEDIUM | Erst Antrag + manuelle Prüfung; dann Admin kann weitere Admins einladen |
| Offline-Cache für Karte und Events | Für schlechte Verbindung in Kirchengebäuden | MEDIUM | React Native + lokale SQLite/Expo SQLite; Invalidierungs-Strategie nötig |
| Web-Panel für Sekretariate | Nicht jede Kirchensekretärin will eine App bedienen; Browserbasiertes CMS nötig | HIGH | Separates Next.js/React Web-Panel; Auth über selbes Backend |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| In-App-Chat / Messaging | Gemeindemitglieder wollen kommunizieren | Komplex, moderationsintensiv, rechtliche Fragen (Datenschutz, Minderjährige), ablenkt vom Kern | Ansprechpartner-Kontaktdaten verlinken; externe Messenger nutzen |
| Push-Benachrichtigungen (v1) | Nutzer wollen an Events erinnert werden | Hohe Permissions-Abbruchrate beim Onboarding; ohne Personalisierung werden sie als Spam empfunden | Nach v1 mit Account-Features und Opt-in einführen |
| Serientermine / Wiederkehrende Events | "Gottesdienst ist jeden Sonntag" — Nutzer wollen das sehen | ChurchDesk liefert Einzeltermine; eigene Serientermin-Logik verdoppelt Komplexität | Events einzeln eintragen; ChurchDesk-Sync liefert ohnehin Einzelinstanzen |
| Social Feed / Likes / Kommentare | Community-Aspekt stärken | Moderation nötig, rechtliche Risiken, Fokus verwässert | Prayback-Punkte und Badges erfüllen Community-Gefühl ohne UGC-Risiken |
| Echtzeit-Check-In-Zähler ("5 Personen sind hier") | Gamification-Verstärkung | Datenschutz (wer sieht dass ich in Kirche X bin?), Infrastruktur-Komplexität | Nur eigene Statistiken anzeigen, keine Echtzeit-Präsenz anderer |
| Ticketing / Bezahlung in App | Events mit Kosten abwickeln | PCI-Compliance, Steuerrecht, Gebühren, hohe Integration-Komplexität | Preis + Externer Ticket-Link; App verweist nach außen |
| Vollständige Web-App für Endnutzer | Größere Reichweite | Doppelter Entwicklungsaufwand; Fokus auf Mobile verlorengehen | Web-Panel nur für Admins; Endnutzer = Mobile |
| KI-Empfehlungen / Personalisierung | "Events die mich interessieren" | Requires extensive behavioral data, cold-start problem, algorithmic complexity | Kategoriefilter + Geo-Filter reichen für v1 aus |
| Leaderboards / Ranglisten | Natürliche Erweiterung der Punkte-Mechanik | Vergleich kann exkludierend wirken ("Wer geht am meisten in die Kirche?"), passt nicht zur inklusiven Positionierung | Nur persönliche Fortschrittsanzeige; keine öffentlichen Rankings |

---

## Feature Dependencies

```
[Browse ohne Account]
    └──requires──> [Karte mit Events]
                       └──requires──> [Event-Daten im Backend]
                                          └──requires──> [Manuelle Eingabe ODER ChurchDesk-Sync]

[Check-In + Punkte]
    └──requires──> [User-Account-System]
    └──requires──> [QR-Code pro Gemeinde]
                       └──requires──> [Gemeinde verifiziert im System]

[Badges / Achievements]
    └──requires──> [Check-In + Punkte]
    └──requires──> [Badge-Definitionen im Backend]

[Geofencing Check-In]
    └──enhances──> [QR-Code Check-In]  (komplementär, nicht ersetzend)

[ChurchDesk-Sync]
    └──enhances──> [Manuelle Event-Eingabe]  (dieselbe Datenbasis, anderer Erfassungsweg)

[Web-Panel für Sekretariate]
    └──requires──> [Gemeinde-Admin-Verifizierung]
    └──requires──> [Event-Backend-API]

[Ehrenamtlichen-Suche]
    └──requires──> [User-Account-System]
    └──requires──> [Gemeindeprofil]

[Ansprechpartner-Verzeichnis]
    └──requires──> [Gemeindeprofil]

[Offline-Cache]
    └──enhances──> [Karte mit Events]
    └──enhances──> [Event-Detailseite]

[Leaderboards] ──conflicts──> [Inklusiver Community-Ansatz]
[In-App-Chat]  ──conflicts──> [Scope und Datenschutz-Anforderungen]
```

### Dependency Notes

- **Check-In requires User-Account:** Punkte können nicht ohne Identität vergeben werden; Account-System muss vor Check-In-Feature stehen.
- **Badges require Check-In:** Badge-Fortschritt basiert auf Check-In-Events; kein Badge-System ohne funktionierenden Check-In.
- **ChurchDesk-Sync enhances manuelle Eingabe:** Beide landen im gleichen Datenmodell; Sync-Fehler dürfen manuelle Einträge nicht überschreiben — Quellen-Tracking nötig.
- **Web-Panel requires Admin-Verifizierung:** Das Panel darf nur verifizierten Admins zugänglich sein; Verifizierungs-Flow muss vorher stehen.
- **Geofencing enhances QR:** Geofencing ist unzuverlässig (bis 2 Min Latenz, 20-150m Ungenauigkeit in Innenräumen); darf QR-Code nicht ersetzen, nur ergänzen.

---

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [ ] Karte mit Events und Gemeinden in der Nähe — Kernwert der App, ohne sie gibt es nichts zu validieren
- [ ] Event-Liste als Listenansicht alternativ zur Karte — Barrierefreiheit für 60+-Zielgruppe
- [ ] Event-Detailseite (alle Felder aus Datenmodell) — Nutzer brauchen alle Infos um Entscheidung zu treffen
- [ ] Kategoriefilter — ohne Filter ist die Karte bei vielen Events unbrauchbar
- [ ] Navigation starten (Google/Apple Maps) — ohne das ist der Use-Case unvollständig
- [ ] Browse ohne Account — niedrige Einstiegshürde, oberste Priorität
- [ ] Gemeindeprofil (minimal) — Nutzer müssen wissen, wer das Event ausrichtet
- [ ] Manuelle Event-Eingabe durch Gemeinde-Admin — Primäre Datenbasis bevor ChurchDesk-Sync
- [ ] Gemeinde-Admin-Verifizierung (Antrag + Einladungscode) — ohne das sind Daten unzuverlässig
- [ ] User-Account mit Prayback-Punkten und QR-Code-Check-In — Kern-Differenziator; validiert ob Gamification funktioniert
- [ ] Badges / Achievements (Basis-Set: Gottesdienste, Kategorien) — Motivations-Layer für Wiederkehr
- [ ] Offline-Cache (geladene Events und Karte) — Kirchen haben oft schlechten Empfang
- [ ] ChurchDesk-Synchronisation — skaliert Datenbasis ohne manuelle Arbeit jeder Gemeinde

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] Geofencing als Komfort-Check-In — wenn QR-Code-Akzeptanz validiert ist und Geofencing-Zuverlässigkeit ausreicht
- [ ] Ehrenamtlichen-Suche (einfaches Hilfe-anbieten ohne Matching) — wenn Gemeinden aktiv das Web-Panel nutzen
- [ ] Ansprechpartner-Verzeichnis — wenn Gemeinden bereit sind Kontakte öffentlich zu pflegen
- [ ] Web-Panel für Sekretariate — wenn manuelle Eingabe via App für Sekretariate zu unkomfortabel ist
- [ ] Push-Benachrichtigungen (Opt-in) — wenn Nutzerbasis groß genug für sinnvolle Personalisierung

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] KI-Empfehlungen / Personalisierung — braucht ausreichend Nutzerdaten und Verhaltensdaten
- [ ] Konfessionsfilter in der Suche — wenn Nutzerfeedback zeigt, dass Konfession ein Suchkriterium ist
- [ ] Erweiterte Badge-Sets (Kirchenkreis-Badges, Jahres-Badges) — wenn Engagement-Daten zeigen, was Nutzer motiviert
- [ ] iOS- und Android-Widgets für "Event heute in der Nähe" — wenn App-Retention etabliert ist

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Karte mit Events | HIGH | MEDIUM | P1 |
| Event-Detailseite | HIGH | LOW | P1 |
| Browse ohne Account | HIGH | LOW | P1 |
| Kategoriefilter | HIGH | LOW | P1 |
| Navigation starten | HIGH | LOW | P1 |
| User-Account + QR-Check-In | HIGH | MEDIUM | P1 |
| Prayback-Punkte | HIGH | MEDIUM | P1 |
| Badges / Achievements | HIGH | MEDIUM | P1 |
| Manuelle Event-Eingabe | HIGH | MEDIUM | P1 |
| Gemeinde-Admin-Verifizierung | HIGH | MEDIUM | P1 |
| ChurchDesk-Sync | HIGH | HIGH | P1 |
| Offline-Cache | MEDIUM | MEDIUM | P1 |
| Gemeindeprofil minimal | MEDIUM | LOW | P1 |
| Event-Liste als Listenansicht | MEDIUM | LOW | P1 |
| Geofencing Check-In | MEDIUM | MEDIUM | P2 |
| Web-Panel für Sekretariate | MEDIUM | HIGH | P2 |
| Ehrenamtlichen-Suche | MEDIUM | HIGH | P2 |
| Ansprechpartner-Verzeichnis | MEDIUM | MEDIUM | P2 |
| Push-Benachrichtigungen | MEDIUM | MEDIUM | P2 |
| Erweiterte Badges | LOW | LOW | P3 |
| KI-Empfehlungen | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

---

## Competitor Feature Analysis

| Feature | Church Center (Planning Center) | Subsplash / Tithe.ly | Eventbrite / Meetup | Prayback Ansatz |
|---------|--------------------------------|----------------------|---------------------|-----------------|
| Event-Discovery für Nicht-Mitglieder | Nur für Gemeinde-Mitglieder | Nur für Gemeinde-Mitglieder | Offen für alle | Offen, öffentliche Karte |
| Karte / Geo-Discovery | Keine Karte; nur eigene Gemeinde | Keine Karte | Karte bei Meetup, Liste bei Eventbrite | Karte als primäre UX |
| Konfessionsübergreifend | Nein (pro Gemeinde) | Nein (pro Gemeinde) | Nicht relevant | Ja, alle Konfessionen |
| Gamification / Punkte | Keine | Keine | Keine | Prayback-Punkte + Badges |
| Check-In | Self-Check-In für Registrierungen | Kind Check-In | QR-Code (Organizer-App) | QR + Geofencing |
| Admin Web-Panel | Ja (umfangreich, komplex) | Ja (kostenpflichtig) | Ja | Einfaches Panel für Sekretariate |
| API-Sync (ChurchDesk) | Nicht relevant | Nicht relevant | Nicht relevant | ChurchDesk als primäre Auto-Datenquelle |
| Zielgruppe | Bestehende Gemeindeglieder | Bestehende Gemeindeglieder | Allgemein / Stadtpublikum | Alle, auch Kirchendistanzierte |
| Kosten für Gemeinden | Kostenpflichtig | Kostenpflichtig | Kostenpflichtig | Kostenlos (Freemium geplant) |

**Kernbeobachtung:** Kein bestehender Wettbewerber kombiniert (1) konfessionsübergreifende Event-Aggregation, (2) kartenbasierte Discovery für Außenstehende und (3) Gamification. Church Center, Subsplash und Tithe.ly sind interne Gemeinde-Tools, keine Discovery-Apps. Eventbrite/Meetup sind säkular und nicht kirchenspezifisch. Prayback besetzt eine unbesetzte Nische.

---

## Sources

- [Church Center App (Planning Center)](https://www.planningcenter.com/church-center) — Feature-Beschreibung Event-Discovery und Check-In
- [Self Check-In with Church Center App](https://www.planningcenter.com/blog/2020/04/self-check-in-with-the-church-center-app) — Check-In-Mechanik
- [Subsplash Church Engagement Platform](https://www.subsplash.com) — Community- und Event-Features
- [Tithe.ly Best Church Apps 2025](https://get.tithe.ly/best/church-apps) — Marktübersicht Kirchen-Apps
- [ChurchDesk Calendar Feature](https://churchdesk.com/en/product/calendar/) — Event-Management inkl. Deutschland-Sync
- [Foursquare Swarm Gamification](https://centrical.com/resources/with-swarm-foursquare-goes-full-circle-with-its-gamification-mechanics/) — Badges, Punkte, Mayorships-Mechanik
- [Foursquare Swarm Badges & Mayorships](https://geoawesome.com/foursquare-brings-back-badges-and-mayorships-to-swarm-app/) — Rückkehr der Gamification-Features
- [Event App Gamification Patterns](https://www.x-cd.com/blog/event-technology/event-app-gamification/) — Punkte, Badges, Leaderboards in Event-Apps
- [Eventbrite Attendee Check-In](https://www.eventbrite.com/help/en-us/articles/741083/how-to-check-in-attendees-at-the-event-with-eventbrite-organizer/) — QR-Check-In UX
- [Meetup Search Filters](https://www.meetup.com/blog/new-search-filters-on-meetup/) — Kategorien, Venue-Filter
- [Android Geofencing Best Practices](https://developer.android.com/develop/sensors-and-location/location/geofencing) — Latenz, Radius, Einschränkungen
- [Geofencing Accuracy and Pitfalls](https://bugfender.com/blog/android-geofencing/) — Technische Einschränkungen Geofencing

---

*Feature research for: Prayback — church event discovery app with gamification*
*Researched: 2026-03-13*
