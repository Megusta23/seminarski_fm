# Formalne metode - Seminarski rad 2025/26

[![GitHub](https://img.shields.io/badge/GitHub-Repository-blue?logo=github)](https://github.com/Megusta23/seminarski_fm)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-green?logo=node.js)](https://nodejs.org/)
[![Selenium](https://img.shields.io/badge/Selenium-WebDriver-orange?logo=selenium)](https://www.selenium.dev/)
[![Mocha](https://img.shields.io/badge/Mocha-Test%20Framework-brown?logo=mocha)](https://mochajs.org/)

---

## 👥 Tim

| Student | GitHub | Doprinos |
|---------|--------|----------|
| **Duško Savić** | [@rokymoi](https://github.com/rokymoi) | Test automation, documentacija |
| **Ajdin Mehmedović** | [@Aydhiny](https://github.com/Aydhiny) | Test case design, bug tracking |
| **Hasan Brkić** | [@Megusta23](https://github.com/Megusta23) | Test framework setup, reporting |

---
---

## Pregled projekta

U ovom seminarskom radu testirali smo **2 web aplikacije** koristeći 8 različitih tehnika testiranja:

### 1. Wikipedia (en.wikipedia.org)
- **Testirana funkcionalnost:** Search funkcija
- **Tehnologija:** Selenium WebDriver + Mocha + Chai
- **Test cases:** 12 testova
- **Fokus:** Osnovne funkcionalnosti, autocomplete, edge cases

### 2. Hithouse (hithouse.ba)
- **Testirana funkcionalnost:** Pretraga proizvoda
- **Tehnologija:** Selenium WebDriver + Mocha + Chai
- **Test cases:** 25 testova
- **Fokus:** Security, boundary testing, robustness, responsive design

---

## Instalacija i pokretanje

### Preduvjeti
- Node.js (v18+)
- Chrome browser
- npm ili yarn

### Setup

```bash
# Clone repository
git clone https://github.com/Megusta23/seminarski_fm.git
cd seminarski_fm

# Install dependencies
npm install

# Install Selenium ChromeDriver
npm install chromedriver --save-dev
```

### Pokretanje testova

```bash
# Pokretanje Wikipedia testova
npm run test:wikipedia

# Pokretanje Hithouse testova
npm run test:hithouse

# Pokretanje svih testova
npm test
```

---

## Rezultati testiranja

### Wikipedia
- **Total tests:** 12
- **Passed:** 12
- **Failed:** 0
- **Coverage:** 100% funkcionalnosti

### Hithouse
- **Total tests:** 25
- **Passed:** 10
- **Failed:** 15
- **Bugs identified:** 15 kritičnih defekata

---

## Identificirani defekti (Hithouse)

Tokom testiranja hithouse.ba identifikovano je **15 bugova**:

1. **BUG-001** - Neresponzivna search bar i prijava/registracija sekcija
2. **BUG-002** - Opcije filtriranja se ne prikazuju korektno
3. **BUG-003** - Dugački string u search probija margine sajta
4. **BUG-004** - Slike proizvoda fale
5. **BUG-005** - Neadekvatan kontrast teksta
6. **BUG-006** - Duplikacija mega menua
7. **BUG-007** - Broken aktivna sekcija
8. **BUG-008** - Footer nije zalijepljen na dno
9. **BUG-009** - Nepotpun prikaz naručivanja
10. **BUG-010** - Navbar slomi tablet prikaz
11. **BUG-011** - Klik na tab probija sajt
12. **BUG-012** - Gramatička greška u tekstu
13. **BUG-013** - Karakter "d\\" uništava sajt (KRITIČAN)
14. **BUG-014** - Whitespace validacija nedostaje
15. **BUG-015** - Neresponzivna stranica na mobilnim uređajima

---

## Dokumentacija

Kompletan izvještaj sa svim tehnikama testiranja, tabelama i dijagramima dostupan je u:

- `docs/FM_DU_AJ_HA_Zadatak_1_WIKIPEDIA.docx`
- `docs/FM_DU_AJ_HA_Zadatak_1_HITHOUSE_KOMPLETNO.docx`

Svaki dokument sadrži:
- Detaljne tabele za svaku tehniku
- Pseudo kod za statement/decision coverage
- Dijagrame tranzicije stanja
- Liste identificiranih defekata
- Test case specifikacije

---
