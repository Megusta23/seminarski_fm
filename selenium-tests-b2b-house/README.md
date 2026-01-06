## Test automatizacije za `hithouse.ba`

Ovaj projekat sadrži kompletan set end‑to‑end testova za funkcionalnost pretrage na sajtu `hithouse.ba`, napisan uz pomoć `Mocha`, `Chai` i `Selenium WebDriver`.

### Broj testova

Trenutno je definisano **25 test slučajeva (TC001–TC025)** u fajlu `tests/search/search.test.js`, organizovanih kroz test queue koji obezbeđuje **sekvencijalno izvršavanje** (jedan test se završi i potvrdi pre sledećeg).

### Lista test slučajeva

Svaki test je dizajniran prema uobičajenim QA standardima za testiranje pretrage (validne/invalidne particije, granične vrednosti, sigurnosni testovi, performanse, i i18n).

1. **TC001 – Validna pretraga „laptop“**  
   - Pozitivan scenario, očekuje se broj rezultata > 0.
2. **TC002 – Validna pretraga „miš“**  
   - Pozitivan scenario sa specijalnim slovom, očekuje se broj rezultata > 0.
3. **TC003 – Validna pretraga „tastatura“**  
   - Pozitivan scenario, broj rezultata > 0.
4. **TC004 – Prazan string**  
   - Granična vrednost (0 karaktera); očekuje se 0 rezultata ili jasna poruka „nema rezultata“ (ili validaciona greška).
5. **TC005 – Nevažeći pojam „xyz123abc456“**  
   - Negativna particija; očekuje se 0 rezultata ili jasna „nema rezultata“ poruka (nikad realni proizvodi).
6. **TC006 – Specijalni karakteri „!@#$%“**  
   - Negativan scenario; očekuje se 0 rezultata ili „nema rezultata“ (standardan robustness/validation test).
7. **TC007 – Numerička pretraga „123“**  
   - Validan scenario; dozvoljava rezultate ako postoje proizvodi sa tim brojem.
8. **TC008 – Dugi string (100 karaktera)**  
   - Granična vrednost; očekuje se 0 rezultata ili jasna poruka, nikako „sve proizvode“.
9. **TC009 – Jedan karakter „a“**  
   - Granična vrednost; testira ponašanje za preširoku pretragu (oprez na vraćanje „svih proizvoda“).
10. **TC010 – Engleski pojam „keyboard“**  
    - i18n/locale test; dozvoljeni su rezultati ili 0 rezultata.
11. **TC011 – „  laptop  “ (razmaci pre/posle)**  
    - Trim/whitespace test; očekuje se isto ponašanje kao za „laptop“.
12. **TC012 – SQL Injection string `' OR '1'='1`**  
    - Sigurnosni test; sajt ne sme da vrati „sve proizvode“ niti da pukne.
13. **TC013 – XSS string `<script>alert("XSS")</script>`**  
    - Sigurnosni test; skripta se ne sme izvršiti, URL ne sme sadržati raw `<script>`.
14. **TC014 – Dva karaktera „ab“**  
    - Granična vrednost (minimalna „ozbiljna“ dužina); dozvoljeni su rezultati ili 0 rezultata.
15. **TC015 – Unicode pojam „čajnik“**  
    - i18n test; proverava podršku za lokalna slova (č, ć, ž…).
16. **TC016 – Case sensitivity: „LAPTOP“ vs „laptop“**  
    - Funkcionalni test; očekuje se da veličina slova ne utiče na rezultate.
17. **TC017 – Partial match „lap“**  
    - Funkcionalni test; dozvoljeni su proizvodi koji delimično sadrže izraz.
18. **TC018 – Više reči „laptop torba“**  
    - Funkcionalni test; očekuje rezultate relevantne za kombinaciju pojmova.
19. **TC019 – Decimalni broj „15.6“**  
    - Funkcionalni test; dozvoljeni su rezultati (npr. dijagonala ekrana).
20. **TC020 – Specijalni karakter „laptop-stand“ (crtica)**  
    - Funkcionalni test; proverava ispravno parsiranje reči sa crticom.
21. **TC021 – Whitespace varijanta „miš␣␣“**  
    - Negativan/robustness test; očekuje se da previše whitespace‑a iza važećeg pojma ne vraća proizvode (ili vrati jasnu „nema rezultata“ poruku).
22. **TC022 – Performanse pretrage „laptop“**  
    - Performance test; očekuje se da se pretraga izvrši < 10s.
23. **TC023 – HTML entiteti `laptop&amp;stand`**  
    - Security/encoding test; očekuje se korektno dekodiranje entiteta bez lomljenja stranice.
24. **TC024 – URL encoding `laptop%20stand`**  
    - URL encoding test; očekuje se dekodiranje `%20` u razmak i normalna pretraga.
25. **TC025 – Robustness test sa inputom `d\\` (d i backslash)**  
    - Robustness/security test; cilj je da se proveri da li nevalidan/malformiran input `d\` ne „uništi" sajt (nema 500 errora, nema pucanja skripte, rezultati su 0 ili jasna poruka).

> Napomena: testovi pokrivaju standardne kategorije iz literature za testiranje web pretrage: **equivalence partitioning**, **boundary value analysis**, **error guessing**, **security testing**, **performance testing** i **i18n/unicode**.

### Izvršavanje testova

- **Svi testovi (preporučeno, sekvencijalno):**
  ```bash
  npm test
  ```
- **Samo search suite (direktno preko Mocha):**
  ```bash
  npx mocha tests/search/*.test.js --timeout 120000 --reporter spec
  ```

Rezultati testova (uključujući broj rezultata, input, očekivano/stvarno stanje, grešku i putanju do screenshota) se automatski čuvaju u:

- JSON: `reports/test-results-*.json` i `reports/test-results-live.json`
- Tekstualni log: `reports/test-results-live.txt`
- Screenshots: direktorijum `screenshots/`


