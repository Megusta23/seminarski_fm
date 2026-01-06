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
cd selenium-tests-b2b-house

# Install dependencies
npm install

# Install Selenium ChromeDriver
npm install chromedriver --save-dev

cd selenium-tests-wikipedia
# Install dependencies
npm install

# Install Selenium ChromeDriver
npm install chromedriver --save-dev
```

### Pokretanje testova

```bash
# Pokretanje Wikipedia testova
cd selenium-tests-wikipedia
npm test

# Pokretanje Hithouse testova
cd selenium-tests-b2b-house
npm test
```
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
