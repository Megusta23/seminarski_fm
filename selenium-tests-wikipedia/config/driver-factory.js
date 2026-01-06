const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const config = require('./config');

class DriverFactory {
    constructor() {
        this.driver = null;
    }

    async createDriver() {
        const options = new chrome.Options();
        
        if (config.browser.headless) {
            options.addArguments('--headless=new');
        }
        
        options.addArguments('--no-sandbox');
        options.addArguments('--disable-dev-shm-usage');
        options.addArguments('--disable-gpu');
        options.addArguments('--ignore-certificate-errors');
        options.addArguments('--ignore-ssl-errors');
        options.addArguments('--disable-notifications');
        options.addArguments('--disable-blink-features=AutomationControlled');
        options.addArguments(`--window-size=${config.browser.windowSize.width},${config.browser.windowSize.height}`);
        options.addArguments('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        options.excludeSwitches(['enable-automation']);
        options.setUserPreferences({ 'credentials_enable_service': false, 'profile.password_manager_enabled': false });
        
        try {
            this.driver = await new Builder()
                .forBrowser('chrome')
                .setChromeOptions(options)
                .build();
            
            await this.driver.manage().setTimeouts({
                implicit: config.timeouts.implicit,
                pageLoad: config.timeouts.pageLoad,
                script: config.timeouts.script
            });
            
            if (!config.browser.headless) {
                await this.driver.manage().window().maximize();
            }
            
            return this.driver;
        } catch (error) {
            console.error('Greška pri kreiranju WebDriver-a:', error.message);
            throw error;
        }
    }

    getDriver() {
        return this.driver;
    }

    async quitDriver() {
        if (this.driver) {
            try {
                await this.driver.quit();
            } catch (error) {
                console.error('Greška pri zatvaranju driver-a:', error.message);
            }
            this.driver = null;
        }
    }
}

module.exports = new DriverFactory();
