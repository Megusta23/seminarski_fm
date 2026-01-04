const { expect } = require('chai');
const { By, until } = require('selenium-webdriver');
const { setupDriver, teardownDriver, waitForPageLoad, handleTestFailure } = require('./setup');

describe('TimeAndDate.com testovi', function() {
    this.timeout(60000);
    let driver;
    const BASE_URL = 'https://www.timeanddate.com';

    before(async function() {
        this.timeout(90000);
        driver = await setupDriver('TimeAndDate.com');
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

    describe('TimeAndDate.com Homepage testovi', function() {
        
        it('Test 1: Trebao bi uspješno učitati TimeAndDate homepage i provjeriti naslov', async function() {
            await driver.get(BASE_URL);
            await waitForPageLoad();
            const title = await driver.getTitle();
            expect(title.toLowerCase()).to.include('time');
        });

        it('Test 2: Trebao bi prikazati TimeAndDate logo', async function() {
            await driver.get(BASE_URL);
            await waitForPageLoad();
            const logo = await driver.wait(until.elementLocated(By.css('#logo')), 10000);
            expect(await logo.isDisplayed()).to.be.true;
        });

        it('Test 3: Trebao bi prikazati World Clock link u navigaciji', async function() {
            await driver.get(BASE_URL);
            await waitForPageLoad();
            const worldClockLink = await driver.findElement(By.xpath("//a[contains(text(), 'World Clock')]"));
            expect(await worldClockLink.isDisplayed()).to.be.true;
        });

        it('Test 4: Trebao bi prikazati Calendar link u navigaciji', async function() {
            await driver.get(BASE_URL);
            await waitForPageLoad();
            const calendarLink = await driver.findElement(By.xpath("//a[contains(text(), 'Calendar')]"));
            expect(await calendarLink.isDisplayed()).to.be.true;
        });

        it('Test 5: Trebao bi prikazati Weather link u navigaciji', async function() {
            await driver.get(BASE_URL);
            await waitForPageLoad();
            const weatherLink = await driver.findElement(By.xpath("//a[contains(text(), 'Weather')]"));
            expect(await weatherLink.isDisplayed()).to.be.true;
        });

        it('Test 6: Trebao bi imati funkcionalno search polje', async function() {
            await driver.get(BASE_URL);
            await waitForPageLoad();
            const searchBox = await driver.wait(until.elementLocated(By.id('query')), 10000);
            expect(await searchBox.isDisplayed()).to.be.true;
        });

        it('Test 7: Trebao bi prikazati Countdown link', async function() {
            await driver.get(BASE_URL);
            await waitForPageLoad();
            const countdownLink = await driver.findElement(By.xpath("//a[contains(text(), 'Countdown')]"));
            expect(await countdownLink.isDisplayed()).to.be.true;
        });

        it('Test 8: Trebao bi omogućiti navigaciju do World Clock stranice', async function() {
            await driver.get(BASE_URL);
            await waitForPageLoad();
            const worldClockLink = await driver.findElement(By.xpath("//a[contains(text(), 'World Clock')]"));
            await worldClockLink.click();
            await waitForPageLoad();
            const title = await driver.getTitle();
            expect(title.toLowerCase()).to.include('world clock');
        });

        it('Test 9: Trebao bi prikazati Sun & Moon link', async function() {
            await driver.get(BASE_URL);
            await waitForPageLoad();
            const sunMoonLink = await driver.findElement(By.xpath("//a[contains(text(), 'Sun & Moon')]"));
            expect(await sunMoonLink.isDisplayed()).to.be.true;
        });

        it('Test 10: Trebao bi prikazati Timer link', async function() {
            await driver.get(BASE_URL);
            await waitForPageLoad();
            const timerLink = await driver.findElement(By.xpath("//a[contains(text(), 'Timer')]"));
            expect(await timerLink.isDisplayed()).to.be.true;
        });

        it('Test 11: Trebao bi imati About link u footeru', async function() {
            await driver.get(BASE_URL);
            await waitForPageLoad();
            await driver.executeScript('window.scrollTo(0, document.body.scrollHeight);');
            const aboutLink = await driver.wait(until.elementLocated(By.xpath("//a[contains(text(), 'About')]")), 5000);
            expect(await aboutLink.isDisplayed()).to.be.true;
        });

        it('Test 12: Trebao bi imati link do Calculator sekcije', async function() {
            await driver.get(BASE_URL);
            await waitForPageLoad();
            const calcLink = await driver.findElement(By.xpath("//a[contains(text(), 'Calculators')]"));
            expect(await calcLink.isDisplayed()).to.be.true;
        });
    });
});
