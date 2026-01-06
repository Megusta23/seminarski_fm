const fs = require('fs');
const path = require('path');
const config = require('../../config/test-config');

class ScreenshotHelper {
    constructor(driver) {
        this.driver = driver;
        this.baseScreenshotDir = config.screenshots.directory;
        this.ensureDirectory(this.baseScreenshotDir);
    }

    ensureDirectory(dirPath) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }

    // Formatira timestamp: HH-MM i folder po datumu DD.MM.YYYY
    formatTimestamp(date = new Date()) {
        const pad = (n) => n.toString().padStart(2, '0');
        const hours = pad(date.getHours());
        const minutes = pad(date.getMinutes());
        const day = pad(date.getDate());
        const month = pad(date.getMonth() + 1);
        const year = date.getFullYear();
        return {
            time: `${hours}-${minutes}`,
            dateFolder: `${day}.${month}.${year}`
        };
    }

    sanitizeForFilename(text) {
        if (!text) return '';
        return text.replace(/[\\/:*?"<>|]/g, '').trim().substring(0, 50);
    }

    async takeScreenshot(testId, reason = '') {
        if (!config.screenshots.enabled) return null;

        try {
            const { time, dateFolder } = this.formatTimestamp();
            const safeTestId = this.sanitizeForFilename(testId);
            const safeReason = this.sanitizeForFilename(reason);

            // Folder po datumu
            const dateDir = path.join(this.baseScreenshotDir, dateFolder);
            this.ensureDirectory(dateDir);

            // Ime fajla: "HH-MM TEST 1 - Success.png"
            const filename = `${time} ${safeTestId}${safeReason ? ' - ' + safeReason : ''}.png`;
            const filepath = path.join(dateDir, filename);

            const screenshot = await this.driver.takeScreenshot();
            fs.writeFileSync(filepath, screenshot, 'base64');

            const stats = fs.statSync(filepath);
            if (!stats.size || stats.size === 0) {
                console.log(`    ⚠ Screenshot fajl je prazan: ${filepath}`);
                return null;
            }

            console.log(`    Screenshot sačuvan: ${filepath} (size: ${stats.size} bytes)`);
            return filepath;

        } catch (error) {
            console.log(`    ⚠ Nije moguće sačuvati screenshot: ${error.message}`);
            return null;
        }
    }

    async takeScreenshotOnFailure(testId) {
        if (config.screenshots.onFailure) {
            return await this.takeScreenshot(testId, 'Failure');
        }
        return null;
    }

    async takeScreenshotOnSuccess(testId) {
        if (config.screenshots.onSuccess) {
            return await this.takeScreenshot(testId, 'Success');
        }
        return null;
    }

    async takeScreenshotAfterSearch(testId, searchTerm, resultsCount) {
        if (!config.screenshots.enabled) return null;

        try {
            // Sačekaj da se stranica učita
            await new Promise(resolve => setTimeout(resolve, 1000));

            const { time, dateFolder } = this.formatTimestamp();
            const safeTestId = this.sanitizeForFilename(testId);
            const safeSearchTerm = this.sanitizeForFilename(searchTerm || 'empty');

            const dateDir = path.join(this.baseScreenshotDir, dateFolder);
            this.ensureDirectory(dateDir);

            const filename = `${time} ${safeTestId} - search_${safeSearchTerm}_${resultsCount}results.png`;
            const filepath = path.join(dateDir, filename);

            const screenshot = await this.driver.takeScreenshot();
            fs.writeFileSync(filepath, screenshot, 'base64');

            const stats = fs.statSync(filepath);
            if (!stats.size || stats.size === 0) {
                console.log(`    ⚠ Screenshot pretrage je prazan: ${filepath}`);
                return null;
            }

            console.log(`    📸 Screenshot pretrage sačuvan: ${filepath} (size: ${stats.size} bytes)`);
            return filepath;

        } catch (error) {
            console.log(`    ⚠ Nije moguće sačuvati screenshot pretrage: ${error.message}`);
            return null;
        }
    }
}

module.exports = ScreenshotHelper;
