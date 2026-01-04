const { expect } = require('chai');
const { By, until, Key } = require('selenium-webdriver');
const { setupDriver, teardownDriver, waitForPageLoad, handleTestFailure } = require('./setup');

describe('Wikipedia Search Functionality Testovi', function() {
    this.timeout(60000);
    let driver;
    const BASE_URL = 'https://en.wikipedia.org';

    before(async function() {
        this.timeout(90000);
        driver = await setupDriver('Wikipedia Search');
    });

    after(async function() {
        await teardownDriver();
    });

    beforeEach(async function() {
        console.log(`Pokretanje testa: ${this.currentTest.title}`);
        await driver.get(BASE_URL);
        await waitForPageLoad();
    });

    afterEach(async function() {
        await handleTestFailure(this);
    });

    // Pomoćna funkcija za čekanje search inputa
    async function getSearchInput() {
        return await driver.wait(until.elementLocated(By.name('search')), 10000);
    }

    it('Test 1: Search input polje treba biti prisutno na početnoj stranici', async function() {
        const searchInput = await getSearchInput();
        expect(await searchInput.isDisplayed()).to.be.true;
    });

    it('Test 2: Pretraga postojećeg pojma "Selenium (software)" treba voditi direktno na članak', async function() {
        const searchInput = await getSearchInput();
        await searchInput.sendKeys('Selenium (software)', Key.ENTER);
        await driver.wait(until.titleContains('Selenium'), 10000);
        const title = await driver.getTitle();
        expect(title).to.include('Selenium (software)');
    });

    it('Test 3: Autocomplete sugestije se trebaju pojaviti prilikom kucanja', async function() {
        const searchInput = await getSearchInput();
        await searchInput.sendKeys('Java');
        // Čekamo containter sugestija (često .cdx-menu ili slično, zavisno od skina, ali .suggestions ili .cdx-menu je standard)
        // Vector 2022 koristi .cdx-menu
        const suggestions = await driver.wait(until.elementLocated(By.css('.cdx-menu, .suggestions')), 10000);
        expect(await suggestions.isDisplayed()).to.be.true;
    });

    it('Test 4: Klik na autocomplete sugestiju treba otvoriti taj članak', async function() {
        const searchInput = await getSearchInput();
        await searchInput.sendKeys('Python');
        const suggestion = await driver.wait(until.elementLocated(By.css('.cdx-menu li, .suggestions-result')), 10000);
        await suggestion.click();
        await driver.wait(until.titleContains('Python'), 10000);
        const title = await driver.getTitle();
        expect(title.toLowerCase()).to.include('python');
    });

    it('Test 5: Pretraga za nepostojeći pojam treba prikazati "There were no results matching the query"', async function() {
        const searchInput = await getSearchInput();
        const nonsense = 'a1b2c3d4e5f6g7h8nonsensestring';
        await searchInput.sendKeys(nonsense, Key.ENTER);
        await waitForPageLoad();
        
        // Na stranici rezultata
        const pageSource = await driver.getPageSource();
        expect(pageSource).to.include('There were no results matching the query');
    });

    it('Test 6: Pretraga treba biti "case-insensitive" (mala/velika slova)', async function() {
        const searchInput = await getSearchInput();
        await searchInput.sendKeys('wikipedia', Key.ENTER); // mala slova
        await driver.wait(until.titleContains('Wikipedia'), 10000);
        const title = await driver.getTitle();
        expect(title).to.include('Wikipedia'); // Očekujemo "Wikipedia" velika slova u naslovu
    });

    it('Test 7: Prazna pretraga treba voditi na Special:Search stranicu', async function() {
        const searchInput = await getSearchInput();
        await searchInput.sendKeys(Key.ENTER);
        await driver.wait(until.titleContains('Search'), 10000);
        const title = await driver.getTitle();
        expect(title).to.include('Search');
    });

    it('Test 8: Search dugme (lupa) treba biti funkcionalno', async function() {
        const searchInput = await getSearchInput();
        await searchInput.sendKeys('Test automation');
        // Pokušavamo naći dugme unutar forme, ili univerzalan selektor
        const searchBtn = await driver.findElement(By.css('button.cdx-search-input__end-button, #searchButton, button[type="submit"]'));
        await searchBtn.click();
        await driver.wait(until.titleContains('Test automation'), 10000);
    });

    it('Test 9: Pretraga sa specijalnim karakterima (npr. C++) treba raditi', async function() {
        const searchInput = await getSearchInput();
        await searchInput.sendKeys('C++', Key.ENTER);
        await driver.wait(until.titleContains('C++'), 10000);
        const title = await driver.getTitle();
        expect(title).to.include('C++');
    });

    it('Test 10: Na stranici rezultata pretrage treba postojati forma za pretragu', async function() {
        const searchInput = await getSearchInput();
        await searchInput.sendKeys('generic term', Key.ENTER);
        await waitForPageLoad();
        
        // Provjeravamo da li postoji input za pretragu na stranici sa rezultatima
        const resultsInput = await driver.wait(until.elementLocated(By.css('input[name="search"]')), 10000);
        expect(await resultsInput.isDisplayed()).to.be.true;
    });

    it('Test 11: Treba zadržati unijeti pojam u input polju na stranici rezultata', async function() {
        const term = 'Consistency check';
        const searchInput = await getSearchInput();
        await searchInput.sendKeys(term, Key.ENTER);
        await waitForPageLoad();
        
        const pageSource = await driver.getPageSource();
        // Provjera da li se pojam nalazi u source-u kao value atribut
        expect(pageSource.toLowerCase()).to.include(`value="${term.toLowerCase()}"`);
    });

    it('Test 12: Pretraga treba biti dostupna i sa internih stranica (ne samo home)', async function() {
        // Odemo na neki standardni članak
        await driver.get(BASE_URL + '/wiki/United_States');
        await waitForPageLoad();
        
        const searchInput = await driver.wait(until.elementLocated(By.name('search')), 10000);
        await searchInput.sendKeys('New York', Key.ENTER);
        await driver.wait(until.titleContains('New York'), 10000);
        const title = await driver.getTitle();
        expect(title.toLowerCase()).to.include('new york');
    });

});
