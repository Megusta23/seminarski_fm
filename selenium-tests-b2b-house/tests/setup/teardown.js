const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const config = require('../../config/test-config');

let driver;

// Setup funkcija - kreira Selenium driver
async function setup() {
    console.log('Pokretanje browser-a...');
    
    const options = new chrome.Options();
    
    // Dodaj opcije iz konfiguracije
    config.browser.options.forEach(option => {
        options.addArguments(option);
    });
    
    // Ako je headless mode
    if (config.browser.headless) {
        options.addArguments('--headless');
    }
    
    driver = await new Builder()
        .forBrowser(config.browser.name)
        .setChromeOptions(options)
        .build();
    
    // Postavi timeouts (smanjeno za brže izvršavanje)
    await driver.manage().setTimeouts({ 
        implicit: 5000,  // Smanjeno sa 15s na 5s
        pageLoad: 15000  // Smanjeno sa 30s na 15s
    });
    
    // Postavi pageLoadStrategy na 'eager' - čeka samo DOM, ne sve resurse
    try {
        await driver.executeScript('return window.navigator.webdriver'); // Test da li driver radi
    } catch (e) {
        // Ignore
    }
    
    // Postavi window size
    if (!config.browser.headless && config.browser.windowSize) {
        await driver.manage().window().setRect({
            width: config.browser.windowSize.width,
            height: config.browser.windowSize.height
        });
    }
    
    console.log('Browser je uspesno pokrenut.');
    return driver;
}

// Teardown funkcija - zatvara browser
async function teardown() {
    if (driver) {
        try {
            console.log('Zatvaranje browser-a...');
            await driver.quit();
            driver = null;
            console.log('Browser je uspesno zatvoren.');
        } catch (error) {
            console.error('Greska pri zatvaranju browser-a:', error.message);
        }
    }
}

module.exports = { setup, teardown };
