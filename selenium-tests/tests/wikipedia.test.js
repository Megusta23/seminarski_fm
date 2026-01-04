const { expect } = require('chai');
const { By, until, Key } = require('selenium-webdriver');
const { setupDriver, teardownDriver, waitForPageLoad, handleTestFailure } = require('./setup');

describe('Wikipedia.org testovi', function() {
    this.timeout(60000);
    let driver;
    const BASE_URL = 'https://en.wikipedia.org';

    before(async function() {
        this.timeout(90000);
        driver = await setupDriver('Wikipedia.org');
    });

    after(async function() {
        await teardownDriver();
    });

    beforeEach(async function() {
        console.log(`Pokretanje testa: ${this.currentTest.title}`);
    });

    afterEach(async function() {
        await handleTestFailure(this);
    });

    describe('Wikipedia Homepage i Search testovi', function() {
        
        it('Test 1: Trebao bi uspješno učitati Wikipedia en homepage', async function() {
            await driver.get(BASE_URL);
            await waitForPageLoad();
            const title = await driver.getTitle();
            expect(title).to.include('Wikipedia');
        });

        it('Test 2: Trebao bi prikazati logo Wikipedije', async function() {
            await driver.get(BASE_URL);
            await waitForPageLoad();
            const logo = await driver.wait(until.elementLocated(By.css('.mw-logo')), 10000);
            expect(await logo.isDisplayed()).to.be.true;
        });

        it('Test 3: Trebao bi imati funkcionalno search polje', async function() {
            await driver.get(BASE_URL);
            await waitForPageLoad();
            const searchInput = await driver.wait(until.elementLocated(By.name('search')), 10000);
            expect(await searchInput.isDisplayed()).to.be.true;
        });

        it('Test 4: Trebao bi pretražiti pojam "Selenium" i otvoriti članak', async function() {
            await driver.get(BASE_URL);
            await waitForPageLoad();
            const searchInput = await driver.findElement(By.name('search'));
            await searchInput.sendKeys('Selenium (software)', Key.ENTER);
            await driver.wait(until.titleContains('Selenium'), 10000);
            const title = await driver.getTitle();
            expect(title).to.include('Selenium');
        });

        it('Test 5: Trebao bi prikazati sekciju "Today\'s featured article"', async function() {
            await driver.get(BASE_URL);
            await waitForPageLoad();
            const featuredArticle = await driver.findElement(By.id('mp-tfa'));
            expect(await featuredArticle.isDisplayed()).to.be.true;
        });

        it('Test 6: Trebao bi prikazati "Random article" link u sidebar-u', async function() {
            await driver.get(BASE_URL);
            await waitForPageLoad();
            const randomArticleLink = await driver.findElement(By.id('n-randompage'));
            expect(await randomArticleLink.isDisplayed()).to.be.true;
        });

        it('Test 7: Trebao bi imati link za "Create account"', async function() {
            await driver.get(BASE_URL);
            await waitForPageLoad();
            const createAccountLink = await driver.findElement(By.id('pt-createaccount-2'));
            expect(await createAccountLink.isDisplayed()).to.be.true;
        });

        it('Test 8: Trebao bi imati link za "Log in"', async function() {
            await driver.get(BASE_URL);
            await waitForPageLoad();
            const loginLink = await driver.findElement(By.id('pt-login-2'));
            expect(await loginLink.isDisplayed()).to.be.true;
        });

        it('Test 9: Trebao bi prikazati listu dostupnih jezika na dnu ili u sidebar-u', async function() {
            await driver.get(BASE_URL);
            await waitForPageLoad();
            const langLinks = await driver.findElements(By.css('.interlanguage-link'));
            expect(langLinks.length).to.be.greaterThan(0);
        });

        it('Test 10: Trebao bi imati link za "Contents" u navigaciji', async function() {
            await driver.get(BASE_URL);
            await waitForPageLoad();
            const contentsLink = await driver.findElement(By.id('n-contents'));
            expect(await contentsLink.isDisplayed()).to.be.true;
        });

        it('Test 11: Trebao bi imati link za "Contact us" u footeru', async function() {
            await driver.get(BASE_URL);
            await waitForPageLoad();
            await driver.executeScript('window.scrollTo(0, document.body.scrollHeight);');
            const contactLink = await driver.findElement(By.id('n-contactpage'));
            expect(await contactLink.isDisplayed()).to.be.true;
        });

        it('Test 12: Trebao bi imati link za "About Wikipedia" u footeru', async function() {
            await driver.get(BASE_URL);
            await waitForPageLoad();
            await driver.executeScript('window.scrollTo(0, document.body.scrollHeight);');
            const aboutLink = await driver.wait(until.elementLocated(By.id('footer-places-about')), 10000);
            expect(await aboutLink.isDisplayed()).to.be.true;
        });
    });
});
