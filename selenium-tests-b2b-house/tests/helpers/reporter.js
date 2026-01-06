const fs = require('fs');
const path = require('path');
const config = require('../../config/test-config');

class TestReporter {
    constructor() {
        this.results = {
            startTime: new Date().toISOString(),
            endTime: null,
            duration: 0,
            totalTests: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            bugs: [],
            securityIssues: [],
            tests: [],
            categories: {} // agregacija po kategorijama
        };
        
        // Kreiraj direktorijume ako ne postoje
        this.ensureDirectories();
    }

    ensureDirectories() {
        const dirs = [
            config.reports.directory,
            config.screenshots.directory,
            path.dirname(config.logging.filePath)
        ];

        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    addTestResult(testCase) {
        this.results.totalTests++;
        this.results.tests.push(testCase);

        if (testCase.status === 'PASS') {
            this.results.passed++;
        } else if (testCase.status === 'FAIL') {
            this.results.failed++;
        } else {
            this.results.skipped++;
        }

        // Agregacija po kategorijama
        const category = testCase.category || 'uncategorized';
        if (!this.results.categories[category]) {
            this.results.categories[category] = {
                total: 0,
                passed: 0,
                failed: 0,
                skipped: 0
            };
        }
        const catStats = this.results.categories[category];
        catStats.total++;
        if (testCase.status === 'PASS') catStats.passed++;
        else if (testCase.status === 'FAIL') catStats.failed++;
        else catStats.skipped++;

        // Prikupi bugove
        if (testCase.bug === true) {
            this.results.bugs.push({
                testId: testCase.id,
                description: testCase.description,
                actual: testCase.actual,
                input: testCase.input,
                timestamp: testCase.timestamp
            });
        }

        // Prikupi sigurnosne probleme
        if (testCase.securityIssue === true) {
            this.results.securityIssues.push({
                testId: testCase.id,
                description: testCase.description,
                actual: testCase.actual,
                input: testCase.input,
                severity: 'HIGH',
                timestamp: testCase.timestamp
            });
        }

        // Automatski sačuvaj rezultat nakon svakog testa
        this.saveTestResultImmediately(testCase);
    }

    saveTestResultImmediately(testCase) {
        try {
            const timestamp = new Date().toISOString();
            const dateStr = new Date().toLocaleDateString('sr-RS');
            const timeStr = new Date().toLocaleTimeString('sr-RS');
            
            const logEntry = {
                datum: dateStr,
                vreme: timeStr,
                timestamp: timestamp,
                testId: testCase.id,
                opis: testCase.description,
                status: testCase.status,
                input: testCase.input,
                ocekivano: testCase.expected,
                stvarno: testCase.actual,
                kategorija: testCase.category || null,
                tip: testCase.typeLabel || null,
                brojRezultata: typeof testCase.resultsCount === 'number' ? testCase.resultsCount : null,
                imaPorukuNemaRezultata: typeof testCase.hasNoResults === 'boolean' ? testCase.hasNoResults : null,
                vremeIzvrsavanja: testCase.executionTime || 'N/A',
                greska: testCase.error || null,
                screenshot: testCase.screenshot || null
            };

            // Sačuvaj u JSON formatu (append)
            const logFilePath = path.join(config.reports.directory, 'test-results-live.json');
            let existingData = [];
            
            if (fs.existsSync(logFilePath)) {
                try {
                    const fileContent = fs.readFileSync(logFilePath, 'utf8');
                    existingData = JSON.parse(fileContent);
                } catch (e) {
                    existingData = [];
                }
            }
            
            existingData.push(logEntry);
            fs.writeFileSync(logFilePath, JSON.stringify(existingData, null, 2));
            
            // Sačuvaj i u tekstualnom formatu za lakše čitanje
            const textLogPath = path.join(config.reports.directory, 'test-results-live.txt');
            const textEntry = `[${dateStr} ${timeStr}] ${testCase.status} - ${testCase.id}: ${testCase.description}\n`;
            fs.appendFileSync(textLogPath, textEntry);
            
        } catch (error) {
            console.log(`    Upozorenje: Nije moguce sacuvati rezultat testa: ${error.message}`);
        }
    }

    finalize() {
        this.results.endTime = new Date().toISOString();
        const start = new Date(this.results.startTime);
        const end = new Date(this.results.endTime);
        this.results.duration = (end - start) / 1000; // u sekundama
    }

    saveJSON() {
        const filename = `test-results-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        const filepath = path.join(config.reports.directory, filename);
        fs.writeFileSync(filepath, JSON.stringify(this.results, null, 2));
        console.log(`JSON rezultati sacuvani: ${filepath}`);
        return filepath;
    }

    generateSummary() {
        const successRate = this.results.totalTests > 0 
            ? ((this.results.passed / this.results.totalTests) * 100).toFixed(2)
            : 0;

        // Pripremi sažetak po kategorijama
        const categorySummary = {};
        Object.keys(this.results.categories).forEach(cat => {
            const stats = this.results.categories[cat];
            const rate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : '0.0';
            categorySummary[cat] = {
                total: stats.total,
                passed: stats.passed,
                failed: stats.failed,
                skipped: stats.skipped,
                successRate: `${rate}%`
            };
        });

        return {
            summary: {
                totalTests: this.results.totalTests,
                passed: this.results.passed,
                failed: this.results.failed,
                skipped: this.results.skipped,
                successRate: `${successRate}%`,
                duration: `${(this.results.duration / 60).toFixed(2)} minuta`,
                bugsFound: this.results.bugs.length,
                securityIssuesFound: this.results.securityIssues.length,
                categories: categorySummary
            },
            details: this.results
        };
    }

    printSummary() {
        const summary = this.generateSummary();
        
        console.log('\n' + '='.repeat(80));
        console.log('TEST EXECUTION SUMMARY');
        console.log('='.repeat(80));
        console.log(`Total Tests:     ${summary.summary.totalTests}`);
        console.log(`Passed:          ${summary.summary.passed}`);
        console.log(`Failed:          ${summary.summary.failed}`);
        console.log(`Skipped:         ${summary.summary.skipped}`);
        console.log(`Success Rate:    ${summary.summary.successRate}`);
        console.log(`Duration:        ${summary.summary.duration}`);
        console.log(`Bugs Found:      ${summary.summary.bugsFound}`);
        console.log(`Security Issues: ${summary.summary.securityIssuesFound}`);
        console.log('='.repeat(80));

        // Sažetak po kategorijama
        const categories = summary.summary.categories || {};
        const categoryNames = Object.keys(categories);
        if (categoryNames.length > 0) {
            console.log('\nSažetak po kategorijama:');
            console.log('-'.repeat(80));
            categoryNames.forEach(cat => {
                const stats = categories[cat];
                console.log(
                    `  [${cat.toUpperCase()}] ` +
                    `Total: ${stats.total}, ` +
                    `Pass: ${stats.passed}, ` +
                    `Fail: ${stats.failed}, ` +
                    `Skipped: ${stats.skipped}, ` +
                    `Success: ${stats.successRate}`
                );
            });
            console.log('='.repeat(80) + '\n');
        } else {
            console.log('='.repeat(80) + '\n');
        }

        if (summary.summary.bugsFound > 0) {
            console.log('DETEKTOVANI BUGOVI:');
            summary.details.bugs.forEach((bug, index) => {
                console.log(`   ${index + 1}. [${bug.testId}] ${bug.description}`);
            });
            console.log('');
        }

        if (summary.summary.securityIssuesFound > 0) {
            console.log('SIGURNOSNI PROBLEMI:');
            summary.details.securityIssues.forEach((issue, index) => {
                console.log(`   ${index + 1}. [${issue.testId}] ${issue.description}`);
            });
            console.log('');
        }
    }
}

module.exports = TestReporter;
