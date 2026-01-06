const fs = require('fs');
const path = require('path');
const driverFactory = require('../config/driver-factory');

let driver = null;

async function setupDriver(suiteName) {
    console.log(`Inicijalizacija ${suiteName} test suite-a...`);
    
    try {
		console.log('Kreiranje WebDriver instance...');
		driver = await driverFactory.createDriver();
        console.log('Setup zavrsen - Driver kreiran');
        return driver;
    } catch (error) {
        console.error('Greska u setup-u:', error.message);
        console.error('Provjeri da li je Chrome instaliran i da PATH uključuje chromedriver');
        throw error;
    }
}

async function teardownDriver() {
    console.log('Ciscenje resursa...');
    
    if (driver) {
        await driverFactory.quitDriver();
        console.log('WebDriver zatvoren');
        driver = null;
    }
}

async function waitForPageLoad() {
    if (!driver) {
        throw new Error('Driver nije inicijalizovan');
    }
    
    await driver.wait(async () => {
        const readyState = await driver.executeScript('return document.readyState');
        return readyState === 'complete';
    }, 15000);
}

async function handleTestFailure(testContext) {
    if (!driver) {
        return;
    }
    
    await new Promise(resolve => setImmediate(resolve));
    
    const currentTest = testContext.currentTest;
    if (currentTest?.state === 'failed') {
        const testTitle = currentTest.title;
        const error = currentTest.err;
        
        console.error('' + '='.repeat(80));
        console.error(`TEST FAILED: ${testTitle}`);
        console.error('='.repeat(80));
        
        try {
            const currentUrl = await driver.getCurrentUrl().catch(() => 'N/A');
            const pageTitle = await driver.getTitle().catch(() => 'N/A');
            
            console.error(`Debugging Information:`);
            console.error(`URL: ${currentUrl}`);
            console.error(`Page Title: ${pageTitle}`);
            
            if (error) {
                console.error(`Error Details:`);
                console.error(`Message: ${error.message}`);
                if (error.stack) {
                    console.error(`Stack Trace:`);
                    const stackLines = error.stack.split('\n').slice(0, 10);
                    stackLines.forEach(line => console.error(`${line}`));
                }
            }
            
            try {
                const screenshotsDir = path.join(__dirname, '..', 'screenshots');
                if (!fs.existsSync(screenshotsDir)) {
                    fs.mkdirSync(screenshotsDir, { recursive: true });
                }
                
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const safeTestName = testTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                const screenshotPath = path.join(screenshotsDir, `${safeTestName}_${timestamp}.png`);
                
                const screenshot = await driver.takeScreenshot();
                fs.writeFileSync(screenshotPath, screenshot, 'base64');
                console.log(`Screenshot saved: ${screenshotPath}`);
            } catch (screenshotError) {
                console.error(`Could not save screenshot: ${screenshotError.message}`);
            }
            
        } catch (debugError) {
            console.error(`Could not gather debugging info: ${debugError.message}`);
        }
        
        console.error('='.repeat(80) + '');
    }
}

function getDriver() {
    return driver;
}

module.exports = {
    setupDriver,
    teardownDriver,
    waitForPageLoad,
    handleTestFailure,
    getDriver
};
