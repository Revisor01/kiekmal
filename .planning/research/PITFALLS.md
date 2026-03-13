# Pitfalls Research

**Domain:** Church event discovery app with gamification (React Native + Expo, PostGIS, ChurchDesk sync)
**Researched:** 2026-03-13
**Confidence:** MEDIUM — Core platform pitfalls HIGH confidence (official docs + multiple sources), ChurchDesk API specifics LOW confidence (docs not publicly detailed)

---

## Critical Pitfalls

### Pitfall 1: Cold-Start-Problem — Leere Karte beim ersten Öffnen

**What goes wrong:**
Neue Nutzer öffnen die App, sehen eine leere oder fast leere Karte, und schließen sie sofort wieder. Ohne Gemeinden gibt es keine Events, ohne Events keinen Grund zum Check-in, ohne Check-ins kein Gamification-Feedback. Dieser Kreislauf verhindert organisches Wachstum.

**Why it happens:**
Das Discovery-Erlebnis hängt vollständig von Supply (Gemeinden mit Events) ab. Wird die App ohne vorab befüllte Daten gestartet, erfahren Früh-Nutzer keinen Mehrwert — sie sehen nur ein leeres Interface. Das Henne-Ei-Problem: Gemeinden tragen nur ein, wenn Nutzer da sind; Nutzer kommen nur, wenn Daten da sind.

**How to avoid:**
- Vor dem Launch manuell Seed-Daten einpflegen: Mindestens 20-30 Gemeinden mit Events in den Pilot-Regionen direkt anlegen (intern, ohne Warten auf Gemeinde-Admins)
- Soft-Launch in einer eng definierten Region oder Kirchenkreis starten, nicht deutschlandweit — damit ist die Karte in dieser Region dicht genug
- ChurchDesk-Sync-Gegenden priorisieren: Gemeinden die ChurchDesk bereits nutzen, können automatisch befüllt werden ohne Admin-Onboarding
- Fallback auf Kirchendaten aus öffentlichen Quellen (Kirchenkreis-Websites) als initiale Seed-Daten, auch ohne Events

**Warning signs:**
- Onboarding-Flow zeigt leere Karte für mehr als 3 Monate nach Launch
- Engagement-Metriken zeigen Drop-off direkt nach Map-Anzeige (0 Events sichtbar)
- Nur wenige Regionen haben mehr als 5 Gemeinden mit aktiven Events

**Phase to address:**
Launch-Vorbereitung / Pre-Alpha — Seed-Daten und erster ChurchDesk-Sync müssen vor dem ersten echten Nutzer-Test stehen.

---

### Pitfall 2: Geofencing als unzuverlässige Check-In-Grundlage

**What goes wrong:**
Nutzer versuchen sich einzuchecken, aber der Geofence triggert nicht — oder triggert an der falschen Stelle. iOS 18 hat die Zuverlässigkeit von Region Monitoring nachweislich verschlechtert. Android liefert Geofence-Events im Hintergrund nur noch gebündelt alle paar Minuten. Nutzer fühlen sich betrogen um Punkte, die sie verdient haben.

**Why it happens:**
- iOS begrenzt Geofences auf 20 pro App, liefert sie im Hintergrund nicht garantiert aus
- Android 8+ drosselt Background-Geofences auf batch-weise Auslieferung, nicht in Echtzeit
- Beide Plattformen erfordern "Immer erlauben"-Berechtigung — die viele Nutzer (zu Recht) verweigern
- Kirchen in dichten Stadtgebieten haben Geofence-Overlap-Probleme

**How to avoid:**
Geofencing als Komfort-Layer behandeln, **niemals als primären Check-in-Mechanismus**. QR-Code ist Primär-Mechanismus. Geofencing ist nur ein "Ich bin schon drin, soll ich einchecken?"-Prompt, kein automatischer Check-in.
- Geofence-Radius mindestens 100m (nicht kleiner) für Kirchengebäude
- Niemals Auto-Check-in beim Betreten des Geofence — immer Nutzer-Bestätigung einholen
- Explizit kommunizieren: "Geofencing ist optional und nicht auf allen Geräten verfügbar"
- Fallback: Check-in immer auch manuell über QR-Code möglich

**Warning signs:**
- Support-Anfragen: "Ich war dort, aber keine Punkte"
- iOS-Tester berichten fehlende Geofence-Trigger nach iOS-Update
- Geofence-Prompts erscheinen 10-15 Minuten nach Verlassen einer Kirche

**Phase to address:**
Check-in-Feature-Phase — Geofencing von Anfang an als optionaler Layer designen, nicht retrofitted.

---

### Pitfall 3: QR-Code-Check-in ohne Missbrauchsschutz

**What goes wrong:**
Ein dauerhafter QR-Code pro Gemeinde (wie im Projekt vorgesehen) kann fotografiert, weitergeteilt oder online gestellt werden. Nutzer scannen ihn von zu Hause aus ohne jemals dort gewesen zu sein, sammeln Punkte für Gottesdienste die sie nicht besucht haben. Gamification verliert Integrität.

**Why it happens:**
Statische QR-Codes sind per Design shareable. Bei einem Community-App-Kontext (kirchliches Umfeld, hohes Vertrauen) wird das Missbrauchspotenzial zunächst unterschätzt.

**How to avoid:**
- Zeitfenster-Validierung: Check-in nur valide, wenn ein laufendes oder in den letzten 30-60 Minuten begonnenes Event in dieser Gemeinde existiert
- Rate-Limiting: Max. 1 Check-in pro Gemeinde pro Tag
- Geofence als Soft-Validierung: Wenn Geofence vorhanden und Nutzer ist eindeutig nicht dort, Check-in ablehnen (aber Geofence nicht als harten Blocker nutzen)
- QR-Codes per Gemeinde-Admin rotierbar machen (ohne Pflicht-Rotation — aber als Option bei Missbrauch)
- In Badges deutlich machen: "X Gottesdienste besucht" — Missbrauch schadet primär der eigenen Statistik, nicht anderen

**Warning signs:**
- Einzelne Nutzer haben unrealistisch viele Check-ins in sehr kurzer Zeit
- Nutzer checken in Gemeinden ein, ohne dass ein Event stattfindet
- Identische Check-in-Zeiten von Nutzern aus verschiedenen Städten in einer Gemeinde

**Phase to address:**
Check-in-Backend — Event-Zeitfenster-Validierung als Teil der Check-in-API-Logik einbauen, nicht nachträglich.

---

### Pitfall 4: Gamification die sich manipulativ oder unchristlich anfühlt

**What goes wrong:**
Punkte und Badges für Gottesdienstbesuche wirken auf einen Teil der Zielgruppe wie "Spiritualität wird zu einem Spiel gemacht" oder "Ich soll für Kirchenbesuche belohnt werden wie bei einem Loyalty-Programm". Ältere Kirchennutzer lehnen das Konzept aktiv ab. Leaderboards führen zu Kompetitionsdenken statt Gemeinschaft.

**Why it happens:**
Gamification-Mechaniken aus Consumer-Apps (Streaks, Rankings, Level-Up) sind für profane Kontexte designed. Im religiösen Kontext treffen sie auf intrinsische Motivation (Glaube, Gemeinschaft) die durch extrinsische Belohnungen untergraben werden kann — ein bekanntes Problem der Motivationspsychologie (Overjustification Effect).

**How to avoid:**
- Keine Leaderboards — Wettbewerb ist im kirchlichen Kontext kontraproduktiv
- Punkte und Badges als persönliches Erinnerungsbuch framen, nicht als Score: "Deine Reise" statt "Dein Ranking"
- Badges nicht als "Belohnung für Fleißige" designen, sondern als Erinnerung an besondere Momente ("Du warst bei Pastors Abschiedsgottesdienst", "Dein erster Weihnachtsgottesdienst in dieser Gemeinde")
- Keine negativen Konsequenzen für Inaktivität (kein Streak-Verlust)
- Nutzern erlauben, Gamification komplett auszublenden — die Kern-App (Karte + Events) funktioniert ohne Account
- Sprache sorgfältig wählen: "Prayback-Punkte" statt "Score", "Erinnerungen" statt "Achievements"

**Warning signs:**
- Qualitatives Feedback in Pilot: "Das fühlt sich komisch an"
- Nutzungsdaten: Nutzer verwenden Karte, ignorieren Badge-Bereich
- Gemeinde-Admins beschweren sich über das Konzept gegenüber ihren Gemeinden

**Phase to address:**
UX-Design-Phase und User-Testing — vor Entwicklungsstart Gamification-Sprache und -Framing mit echten Nutzern der Zielgruppe testen, nicht nur intern.

---

### Pitfall 5: ChurchDesk-API-Abhängigkeit ohne Fallback-Strategie

**What goes wrong:**
ChurchDesk-Sync ist der primäre automatische Weg, Events in die App zu bekommen. Wenn die API offline ist, sich das Datenformat ändert, oder ChurchDesk seine API-Policy anpasst, bricht der gesamte Auto-Sync zusammen — ohne dass Nutzer oder Admins einen Hinweis bekommen.

**Why it happens:**
Externe APIs werden oft als stabil betrachtet und bekommen keine robuste Fehlerbehandlung. ChurchDesk-spezifische Rate-Limits und Breaking-Change-Policies sind nicht öffentlich dokumentiert (LOW confidence auf genaue Limits).

**How to avoid:**
- ChurchDesk-Sync als eigenständigen, isolierten Service mit eigenem Fehler-Logging implementieren
- Sync-Status pro Gemeinde tracken: Wann wurde zuletzt erfolgreich synchronisiert?
- Gemeinde-Admin bekommt Notification/Hinweis wenn Sync seit X Tagen fehlschlägt
- Exponential Backoff bei API-Fehlern, nicht hartes Retry-Loop
- Events aus ChurchDesk nie direkt überschreiben ohne Diff-Check — verhindert unnötige Writes bei API-Fluktuationen
- Architektur: ChurchDesk-Events und manuell eingetragene Events im selben Datenmodell, ChurchDesk ist eine Quelle von mehreren

**Warning signs:**
- Events aus ChurchDesk-Gemeinden verschwinden plötzlich aus der App
- Error-Rate im Sync-Service steigt, ohne Alert
- ChurchDesk ändert API-Version ohne Ankündigung (prüfe deren Changelog-Kommunikation)

**Phase to address:**
Backend-Phase (ChurchDesk-Sync-Service) — Monitoring und Fehlerbehandlung sind kein Afterthought, sondern Teil der initialen Implementierung.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| ST_Distance statt ST_DWithin für Radius-Queries | Einfacherer Query-Code | Kein Index-Lookup, volle Table-Scan bei Wachstum | Niemals |
| Kein GIST-Index auf Koordinaten-Spalten | Weniger Setup | Geo-Queries werden mit jeder Gemeinde exponentiell langsamer | Niemals |
| AsyncStorage für Offline-Queue statt SQLite | Schnelle Implementierung | Duplizierte Daten nach Netzwerk-Toggle, kein Transaktionsschutz | Nur kurzfristiger PoC |
| onRegionChange statt onRegionChangeComplete für Karten-Updates | Gefühlte Echtzeit | Permanente Re-Renders bei Pan/Zoom, Karte wird unbenutzbar | Niemals |
| Marker-Re-Render ohne Clustering für initiale Version | Kein Clustering-Setup nötig | Karte friert bei 50+ Markern ein, besonders auf Android | Nur wenn < 20 Gemeinden im MVP |
| QR-Code ohne Event-Zeitfenster-Validierung im MVP | Schnellere Entwicklung | Missbrauch von Anfang an möglich, Retrofit ist aufwändig | Nur für interne Tests, nie in Produktion |
| Geofencing als primärer Check-in statt QR | Keine QR-Infrastruktur nötig | Unzuverlässig auf iOS 18+, schlechte UX bei Berechtigungsverweigerung | Niemals |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| ChurchDesk API | Polling im Minuten-Takt ohne Rate-Limit-Berücksichtigung | Sync-Intervall auf Stunden-Basis, Exponential Backoff bei Fehlern, Sync-Status separat tracken |
| ChurchDesk API | Breaking Changes ignorieren, keine API-Version pinnen | API-Version explizit in Requests setzen, Changelog-Monitoring einrichten |
| Expo Location (Geofencing) | "When in Use"-Permission annehmen reicht | Geofencing im Hintergrund braucht "Always Allow" — erfordert besondere Berechtigungs-UI und Erklärung |
| react-native-maps Clustering | Custom Marker ohne coordinates-Prop | Clustering-Library erkennt Marker nur wenn coordinates-Prop explizit gesetzt ist |
| Expo Camera (QR-Scanner) | Bei Berechtigungsverweigerung leeren Screen zeigen | Explizite Fallback-UI mit Erklärung + Deep-Link zu App-Einstellungen |
| PostGIS | ST_Distance für "Events in der Nähe"-Query | ST_DWithin verwenden — nutzt GiST-Index, ST_Distance macht Full Table Scan |
| PostGIS | B-Tree Index auf Koordinaten anlegen | USING GIST angeben, sonst wird ein wertloser B-Tree-Index erstellt |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Zu viele unklustered Marker auf Karte | Karte friert beim Pan/Zoom ein, Frame-Drops | react-native-map-clustering von Anfang an einsetzen | Ab ~50 Marker auf dem Screen |
| onRegionChange statt onRegionChangeComplete | Ständige Re-Renders beim Karte-Verschieben, CPU-Last | onRegionChangeComplete verwenden, Cluster nur nach Geste neu berechnen | Sofort auf Low-End-Geräten |
| Geo-Query ohne ST_DWithin + GiST-Index | Nearby-Events-Query wird langsam bei wachsender DB | GIST-Index beim Schema-Setup anlegen, ST_DWithin im Query | Ab ~500 Gemeinden ohne Index |
| ChurchDesk-Sync als synchrone Request-Chain | Sync blockiert andere Anfragen, Timeouts bei vielen Gemeinden | Async Queue mit Job-Worker, nicht synchron im API-Handler | Ab ~20 ChurchDesk-Gemeinden |
| Offline-Cache ohne TTL | Nutzer sehen veraltete Events noch Tage nach Ablauf | TTL pro gecachtem Event, bei Netzwerkverbindung im Hintergrund refreshen | Sofort wahrnehmbar in Produktion |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Gemeinde-Admin-Rolle ohne manuelle Verifikation vergeben | Fake-Gemeinden erstellen Events, beschädigen Vertrauen in Plattform | Erstregistrierung immer manuell prüfen; Einladungscode-System erst nach verifizierten Admins |
| QR-Code-Check-in ohne Event-Zeitfenster validieren | Nutzer sammeln Punkte ohne Anwesenheit, Gamification-Integrität zerstört | Check-in-API prüft ob aktives/kürzlich gestartetes Event in Gemeinde existiert |
| Nutzer-Koordinaten (Geofence-Trigger) ohne Datenschutz-Konzept speichern | DSGVO-Risiko, Nutzer-Tracking ohne Einwilligung | Standort wird serverseitig niemals gespeichert — Geofencing ist rein client-seitig |
| ChurchDesk-API-Key im App-Bundle | Key kann aus APK/IPA extrahiert werden | API-Key nur im Backend, App kommuniziert mit eigenem Backend |
| Einladungscodes ohne Ablaufdatum | Codes werden geteilt, beliebige Admins können sich selbst autorisieren | Codes mit Ablaufdatum (7 Tage) und Single-Use-Flag |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Account-Registration vor Karten-Browse verlangen | Ältere Nutzer brechen sofort ab, Einstiegshürde zu hoch | Browse ohne Account — Karte und Events sind öffentlich, Account nur für Check-in/Punkte |
| Kamera-Berechtigung ohne Kontext-Erklärung anfordern | Nutzer verweigern Berechtigung reflexartig, QR-Scan funktioniert nie | Vor dem Berechtigungs-Dialog erklären: "Für den Check-in scannen wir den QR-Code deiner Gemeinde" |
| Zu kleine Tipp-Ziele (< 48px) | 60+-Nutzer tippen daneben, frustriert, verlässt App | Mindest-Tap-Target 48x48px, großzügige Abstände zwischen Elementen |
| Leaderboard oder "Wer ist am aktivsten" zeigen | Schafft Konkurrenzgefühl, alieniert Nutzer mit wenig Zeit | Keine vergleichenden Statistiken — nur eigene Fortschritte sichtbar |
| Event-Liste ohne Datum/Zeit-Filter | Abgelaufene Events sichtbar, Nutzer verwechselt vergangene mit zukünftigen | Default-Filter: Nur zukünftige Events, abgelaufene Events ausblenden oder deprioritisieren |
| Karte zeigt alle Marker weltweit | Bei Deutschland-weitem Launch sofort Cluster-Probleme | Viewport-basiertes Laden: Nur Gemeinden im sichtbaren Kartenausschnitt + Puffer laden |

---

## "Looks Done But Isn't" Checklist

- [ ] **ChurchDesk-Sync:** Testet nur den Happy Path — verifiziere Verhalten bei API-Timeout, leerer Response, und Datenformat-Änderung
- [ ] **Check-in:** QR-Code lässt sich scannen — verifiziere dass Event-Zeitfenster-Validierung aktiv ist, nicht nur technisches Scan-Feedback
- [ ] **Geofencing:** Trigger funktioniert in Tests — verifiziere auf echten Geräten mit "When in Use"-Berechtigung (nicht "Always") und im Hintergrund
- [ ] **Offline-Cache:** Events werden lokal gespeichert — verifiziere TTL-Verhalten und Sync-Konflikt-Auflösung bei gleichzeitiger Admin-Änderung
- [ ] **Karten-Clustering:** Clustering funktioniert mit Test-Daten — verifiziere mit 100+ Markern auf Low-End-Android-Gerät
- [ ] **Gemeinde-Verifizierung:** Antrag-Flow ist implementiert — verifiziere dass ohne manuelle Freigabe keine Admin-Rechte vergeben werden
- [ ] **Gamification:** Punkte werden vergeben — verifiziere dass Badges mit korrekten Zählern funktionieren und kein Double-Count bei mehrfachem Check-in möglich ist
- [ ] **PostGIS-Index:** Geo-Queries laufen — verifiziere mit EXPLAIN ANALYZE dass GiST-Index genutzt wird und kein Seq Scan

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Leere Karte nach Launch | MEDIUM | Intern Seed-Daten einpflegen, Gemeinden persönlich kontaktieren, Pilot-Region einschränken |
| Geofencing kaputt nach iOS-Update | LOW | Geofencing-Feature deaktivieren, QR-Code als alleinigen Check-in kommunizieren — Design erlaubt das |
| Missbrauch QR-Codes bekannt | MEDIUM | Event-Zeitfenster-Validierung nachrüsten, betroffene Punkte zurücksetzen, Kommunikation an Community |
| ChurchDesk API Breaking Change | MEDIUM | Sync-Service auf neue API-Version updaten, Gemeinden informieren dass Auto-Sync kurz pausiert |
| Gamification-Ablehnung durch Zielgruppe | HIGH | Framing und Sprache anpassen (erfordert App-Update), ggf. Feature optional machen — DSGVO-Abmeldung als "Kein Gamification"-Modus |
| PostGIS-Performance-Problem | LOW | Index nachrüsten ist ein SQL-Statement — kein App-Update nötig, sofort korrigierbar |
| Fake-Gemeinde-Admins | MEDIUM | Konten sperren, Events löschen, Verifizierungsprozess verschärfen — manuelle Prüfung bereits geplant |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Leere Karte (Cold Start) | Pre-Launch / Seed-Phase | Pilot-Region vor erstem Nutzer-Test mit Min. 20 Gemeinden befüllt |
| Geofencing-Unzuverlässigkeit | Check-in-Design-Phase | Architektur-Dokument zeigt QR als Primär, Geofencing als optionalen Layer |
| QR-Missbrauch | Check-in-Backend-Phase | Check-in-API-Test: Check-in ohne aktives Event wird abgelehnt |
| Gamification-Framing | UX/Design-Phase (vor Entwicklung) | Nutzertest mit 60+-Zielgruppe, qualitatives Feedback eingeholt |
| ChurchDesk-API-Ausfall | Backend/Sync-Phase | Sync-Service-Test mit simuliertem API-Ausfall, Monitoring-Alert vorhanden |
| Karten-Performance | Map-MVP-Phase | Performance-Test mit 100 Markern auf Low-End-Android |
| PostGIS-Query ohne Index | Datenbank-Schema-Phase | EXPLAIN ANALYZE bestätigt GiST-Index-Nutzung |
| Admin-Spam/Fake-Gemeinden | Authentifizierungs-Phase | Verifizierungs-Flow testet manuellen Freigabe-Schritt |
| DSGVO / Standort-Speicherung | Backend-Design-Phase | Architektur-Review: Kein Standort-Logging serverseitig |
| Offline-Sync-Konflikte | Offline-Cache-Phase | Test: Admin ändert Event während App offline ist, dann sync |

---

## Sources

- [Geofencing iOS Limitations — Radar.com](https://radar.com/blog/limitations-of-ios-geofencing)
- [Geofencing Limitations (Android & iOS) — Mapp](https://docs.mapp.com/docs/limitations)
- [iOS Geofencing clarification (iOS 18 regression) — Apple Developer Forums](https://developer.apple.com/forums/thread/768373)
- [React Native Maps Clustering — Upsilon IT](https://www.upsilonit.com/blog/how-to-do-map-clustering-with-react-native)
- [Map Clustering with React Native Expo — Medium](https://medium.com/@chris00hernandez/map-clustering-with-react-native-expo-32644a41b399)
- [react-native-maps Performance Tips — GitHub Issue #369](https://github.com/react-native-maps/react-native-maps/issues/369)
- [PostGIS Performance: Indexing and EXPLAIN — Crunchy Data](https://www.crunchydata.com/blog/postgis-performance-indexing-and-explain)
- [PostGIS ST_DWithin for Radius Search — Official Docs](https://postgis.net/documentation/faq/radius-search/)
- [Offline-First SQLite Sync in Expo — DEV Community](https://dev.to/sathish_daggula/how-to-build-offline-first-sqlite-sync-in-expo-1lli)
- [When Gamification Is Harmful — Medium/Bootcamp](https://medium.com/design-bootcamp/when-and-how-is-gamification-harmful-8e37c076d4f5)
- [Gamification and Game Mechanics in the Church — Medium](https://medium.com/@digitalchurchcc/gamification-and-game-mechanics-in-the-church-8bb577e7c809)
- [Cold Start Problem for Social Products — Andrew Chen](https://andrewchen.com/how-to-solve-the-cold-start-problem-for-social-products/)
- [UI Design for Older Adults — Toptal](https://www.toptal.com/designers/ui/ui-design-for-older-adults)
- [QR Code Attendance Tracking 2025 — VerifyEd](https://www.verifyed.io/blog/qr-code-attendance)
- [ChurchDesk API Documentation](https://docs.churchdesk.com/public/)

---
*Pitfalls research for: Church Event Discovery App with Gamification (Prayback)*
*Researched: 2026-03-13*
