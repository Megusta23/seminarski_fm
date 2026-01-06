const { By } = require('selenium-webdriver');

// Helper funkcija za pronalaženje elementa sa više pokušaja različitih selektora
async function findElementByMultipleSelectors(driver, selectors) {
    for (const selector of selectors) {
        try {
            const element = await driver.findElement(By.css(selector));
            if (element) {
                return element;
            }
        } catch (e) {
            continue;
        }
    }
    return null;
}

// Helper funkcija za čekanje da se element pojavi
async function waitForElement(driver, selector, timeout = 5000) {
    try {
        await driver.wait(async () => {
            try {
                const element = await driver.findElement(By.css(selector));
                return await element.isDisplayed();
            } catch (e) {
                return false;
            }
        }, timeout);
        return true;
    } catch (e) {
        return false;
    }
}

// Helper funkcija za skrolovanje do elementa
async function scrollToElement(driver, element) {
    await driver.executeScript('arguments[0].scrollIntoView(true);', element);
    await driver.sleep(500);
}

module.exports = {
    findElementByMultipleSelectors,
    waitForElement,
    scrollToElement
};

