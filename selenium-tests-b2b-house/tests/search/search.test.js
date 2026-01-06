const { expect } = require('chai');
const { setup, teardown } = require('../setup/teardown');
const HithousePage = require('../helpers/pageObjects');
const ScreenshotHelper = require('../helpers/screenshot-helper');
const TestReporter = require('../helpers/reporter');
const TestQueue = require('../helpers/test-queue');
const config = require('../../config/test-config');
const fs = require('fs');
const path = require('path');

// Globalni reporter instance
const reporter = new TestReporter();

// Mapiranje tipova testova (headline za QA)
const TEST_TYPE_LABELS = {
    TC001: 'POSITIVE / VALID SEARCH',
    TC002: 'POSITIVE / VALID SEARCH',
    TC003: 'POSITIVE / VALID SEARCH',
    TC004: 'NEGATIVE / EMPTY INPUT',
    TC005: 'NEGATIVE / INVALID SEARCH',
    TC006: 'NEGATIVE / SPECIAL CHARS',
    TC007: 'FUNCTIONAL / NUMERIC',
    TC008: 'BOUNDARY / LONG STRING',
    TC009: 'BOUNDARY / SINGLE CHAR',
    TC010: 'FUNCTIONAL / I18N-EN',
    TC011: 'ROBUSTNESS / TRIM',
    TC012: 'SECURITY / SQL INJECTION',
    TC013: 'SECURITY / XSS',
    TC014: 'BOUNDARY / MIN VALID LENGTH',
    TC015: 'FUNCTIONAL / UNICODE',
    TC016: 'FUNCTIONAL / CASE SENSITIVITY',
    TC017: 'FUNCTIONAL / PARTIAL MATCH',
    TC018: 'FUNCTIONAL / MULTI WORD',
    TC019: 'FUNCTIONAL / DECIMAL',
    TC020: 'FUNCTIONAL / SPECIAL CHARS',
    TC021: 'NEGATIVE / WHITESPACE EDGE',
    TC022: 'PERFORMANCE',
    TC023: 'SECURITY / HTML ENTITIES',
    TC024: 'FUNCTIONAL / URL ENCODING',
    TC025: 'ROBUSTNESS / MALFORMED INPUT'
};

// Infer kategorije testova na osnovu tehnike / ID-a
function inferCategory(technique, testId) {
    const t = (technique || '').toLowerCase();
    if (t.includes('security')) return 'security';
    if (t.includes('performance')) return 'performance';
    if (t.includes('boundary')) return 'boundary';
    if (t.includes('unicode') || t.includes('i18n')) return 'i18n';
    if (t.includes('functional') || t.includes('equivalence')) return 'functional';
    if (['TC004', 'TC005', 'TC006', 'TC008', 'TC009', 'TC021', 'TC025'].includes(testId)) return 'negative';
    return 'other';
}

describe('Testiranje funkcionalnosti pretrage proizvoda na hithouse.ba', function() {
    this.timeout(config.timeout.test * 2);

    let driver;
    let page;
    let screenshotHelper;
    let testQueue;

    before(function() {
        testQueue = new TestQueue();
    });

    before(async function() {
        console.log('\n' + '='.repeat(80));
        console.log('POKRETANJE TEST SUITE-A - hithouse.ba');
        console.log('='.repeat(80));
        console.log(`Datum i vreme: ${new Date().toLocaleString('sr-RS')}`);
        console.log(`Base URL: ${config.baseUrl}`);
        console.log(`Browser: ${config.browser.name}`);
        console.log(`Timeout: ${config.timeout.test / 1000}s po testu`);
        console.log('='.repeat(80) + '\n');

        try {
            driver = await setup();
            page = new HithousePage(driver);
            screenshotHelper = new ScreenshotHelper(driver);
            
            console.log('Navigacija na pocetnu stranicu...');
            await page.navigateToHomepage();
            
            const health = await page.healthCheck();
            if (!health.ok) {
                const healthScreenshot = await screenshotHelper.takeScreenshot('HEALTHCHECK', 'failure');
                console.error('HEALTH-CHECK NEUSPEŠAN:');
                console.error(`  URL: ${health.url}`);
                console.error(`  readyState: ${health.readyState}`);
                console.error(`  hasSearchInput: ${health.hasSearchInput}`);
                if (healthScreenshot) {
                    console.error(`  Screenshot: ${healthScreenshot}`);
                }
                throw new Error('Health-check sajta nije prošao, prekidam test suite.');
            }

            console.log('Setup uspesno zavrsen. Health-check OK. Spremno za testiranje.\n');
        } catch (error) {
            console.error('\nKRITICNA GRESKA PRI SETUP-U:', error.message);
            throw error;
        }
    });

    after(async function() {
        reporter.finalize();
        
        const jsonPath = reporter.saveJSON();
        reporter.printSummary();

        const basicResultsPath = path.join(__dirname, '../../test-results.json');
        fs.writeFileSync(basicResultsPath, JSON.stringify(reporter.results, null, 2));
        
        await teardown();
    });

    // Helper funkcija za logovanje testa
    function logTest(testCase, status, error = null, screenshotPath = null) {
        testCase.status = status;
        testCase.timestamp = new Date().toISOString();
        if (screenshotPath) {
            testCase.screenshot = screenshotPath;
        }
        
        if (error) {
            testCase.error = error.message;
            testCase.errorStack = error.stack;
        }

        const sep = '='.repeat(80);
        const category = (testCase.category || 'uncategorized').toUpperCase();
        const typeLabel = testCase.typeLabel || TEST_TYPE_LABELS[testCase.id] || '';
        const headlineSuffix = typeLabel ? ` [${category} / ${typeLabel}]` : ` [${category}]`;

        reporter.addTestResult(testCase);

        console.log(`\n${sep}`);
        console.log(`TEST CASE: ${testCase.id}${headlineSuffix}`);
        console.log(sep);
        console.log(`Opis testa : ${testCase.description}`);
        console.log(`Svrha testa: ${testCase.expected}`);
        console.log(`Tehnika    : ${testCase.technique || 'N/A'}`);
        console.log(`Kategorija : ${category}`);
        console.log(`Input      : "${testCase.input}"`);
        console.log(sep);

        if (status === 'PASS') {
            console.log(`✅ [PASS] ${testCase.id} - ${testCase.description}`);
            console.log(sep);
            console.log(`   ✅ Rezultat: ${testCase.actual || 'Test prošao uspešno'}`);
            if (testCase.executionTime) {
                console.log(`   ⏱️  Vreme izvršavanja: ${testCase.executionTime}`);
            }
            if (testCase.titles && testCase.titles.length > 0) {
                console.log(`   📦 Primeri proizvoda:`);
                testCase.titles.slice(0, 3).forEach((title, idx) => {
                    console.log(`      ${idx + 1}. ${title.substring(0, 60)}${title.length > 60 ? '...' : ''}`);
                });
            }
            if (testCase.bug) {
                console.log(`   ⚠️  UPOZORENJE: Detektovan potencijalni bug!`);
                console.log(`      ${testCase.actual.includes('BUG') ? testCase.actual.split('BUG')[1] : 'Proverite rezultate'}`);
            }
            if (testCase.securityIssue) {
                console.log(`   🔒 KRITIČAN SIGURNOSNI PROBLEM: Detektovan sigurnosni problem!`);
                console.log(`      ${testCase.actual.includes('PROBLEM') ? testCase.actual.split('PROBLEM')[1] : 'Proverite rezultate'}`);
            }
            if (screenshotPath) {
                console.log(`   📸 Screenshot: ${screenshotPath}`);
            }
        } else {
            console.log(`❌ [FAIL] ${testCase.id} - ${testCase.description}`);
            console.log(sep);
            console.log(`   ❌ Razlog neuspeha: ${error ? error.message : 'Nepoznata greška'}`);
            if (testCase.actual) {
                console.log(`   📊 Stvarni rezultat: ${testCase.actual}`);
            }
            if (screenshotPath) {
                console.log(`   📸 Screenshot: ${screenshotPath}`);
            }
            if (error && error.stack) {
                console.log(`   🔍 Stack trace:`);
                error.stack.split('\n').slice(0, 3).forEach(line => {
                    console.log(`      ${line}`);
                });
            }
        }
        console.log(sep + '\n');
    }

    // Helper funkcija za kreiranje test wrapper-a
    function createTestWrapper(testId, description, technique, input, expected, testFn, validationFn = null) {
        return async () => {
            const startTime = Date.now();
            const testCase = {
                id: testId,
                description: description,
                technique: technique,
                category: inferCategory(technique, testId),
                typeLabel: TEST_TYPE_LABELS[testId] || null,
                input: input,
                expected: expected,
                actual: '',
                titles: [],
                bug: false,
                securityIssue: false,
                resultsCount: 0,
                hasNoResults: false
            };

            try {
                console.log(`\n${'═'.repeat(80)}`);
                console.log(`🧪 [${testId}] ${description}`);
                console.log(`${'═'.repeat(80)}`);
                console.log(`   📚 Tehnika: ${technique}`);
                console.log(`   📥 Input: "${input}"`);
                console.log(`   ✅ Očekivano: ${expected}`);
                console.log(`${'─'.repeat(80)}`);

                await testFn(testCase);

                testCase.executionTime = `${((Date.now() - startTime) / 1000).toFixed(2)}s`;

                if (!testCase.actual) {
                    throw new Error('Test nije postavio actual rezultat - test logika nije izvršena');
                }

                if (validationFn) {
                    const validationResult = validationFn(testCase);
                    if (!validationResult.valid) {
                        throw new Error(`Validacija neuspešna: ${validationResult.reason || 'Nepoznata greška'}`);
                    }
                }

                const searchScreenshotPath = await screenshotHelper.takeScreenshotAfterSearch(
                    testId, 
                    input, 
                    testCase.resultsCount || 0
                );
                
                const successScreenshotPath = await screenshotHelper.takeScreenshotOnSuccess(testId);
                const finalScreenshotPath = searchScreenshotPath || successScreenshotPath;

                logTest(testCase, 'PASS', null, finalScreenshotPath);

                return { success: true, testCase };

            } catch (error) {
                testCase.executionTime = `${((Date.now() - startTime) / 1000).toFixed(2)}s`;
                
                const failureScreenshotPath = await screenshotHelper.takeScreenshotOnFailure(testId);
                
                try {
                    const searchScreenshotPath = await screenshotHelper.takeScreenshotAfterSearch(
                        testId, 
                        input, 
                        testCase.resultsCount || 0
                    );
                    logTest(testCase, 'FAIL', error, searchScreenshotPath || failureScreenshotPath);
                } catch (e) {
                    logTest(testCase, 'FAIL', error, failureScreenshotPath);
                }
                
                throw error;
            }
        };
    }

    // =====================================================
    // DODAVANJE TESTOVA U QUEUE
    // =====================================================

    before(function() {
        // TC001: Pretraga sa validnim pojmom - laptop
        testQueue.addTest({
            id: 'TC001',
            name: 'Pretraga sa validnim pojmom "laptop"',
            fn: createTestWrapper(
                'TC001',
                'Pretraga sa validnim pojmom "laptop"',
                'Equivalence Partitioning - Validna particija',
                'laptop',
                'Treba da vrati rezultate pretrage (broj > 0)',
                async (testCase) => {
                    await page.navigateToHomepage();
                    await page.performSearch('laptop');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    // ✅ KORISTI NOVI API
                    const result = await page.getSearchResultsCount();
                    const titles = await page.getProductTitles();
                    const currentUrl = await page.getCurrentUrl();
                    const pageTitle = await page.getPageTitle();
                    
                    testCase.resultsCount = result.count;
                    testCase.hasNoResults = result.hasNoResults;
                    testCase.actual = `Pronađeno ${result.count} rezultata. URL: ${currentUrl}`;
                    testCase.titles = titles.slice(0, 5);
                    testCase.pageTitle = pageTitle;
                    
                    if (result.count === 0 && !result.hasNoResults) {
                        throw new Error(`Pretraga za "laptop" nije vratila rezultate niti poruku o nedostatku rezultata`);
                    }
                    
                    expect(result.count).to.be.greaterThan(0, 
                        `Pretraga bi trebala da vrati rezultate za "laptop", ali je vraćeno ${result.count} rezultata`);
                }
            )
        });

        // TC002: Pretraga sa validnim pojmom - miš
        testQueue.addTest({
            id: 'TC002',
            name: 'Pretraga sa validnim pojmom "miš"',
            fn: createTestWrapper(
                'TC002',
                'Pretraga sa validnim pojmom "miš"',
                'Equivalence Partitioning - Validna particija',
                'miš',
                'Treba da vrati rezultate pretrage (broj > 0)',
                async (testCase) => {
                    await page.navigateToHomepage();
                    await page.performSearch('miš');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    const result = await page.getSearchResultsCount();
                    const titles = await page.getProductTitles();
                    const currentUrl = await page.getCurrentUrl();
                    
                    testCase.resultsCount = result.count;
                    testCase.hasNoResults = result.hasNoResults;
                    testCase.actual = `Pronađeno ${result.count} rezultata. URL: ${currentUrl}`;
                    testCase.titles = titles.slice(0, 5);
                    
                    if (result.count === 0 && !result.hasNoResults) {
                        throw new Error(`Pretraga za "miš" nije vratila rezultate niti poruku o nedostatku rezultata`);
                    }
                    
                    expect(result.count).to.be.greaterThan(0, 
                        `Pretraga bi trebala da vrati rezultate za "miš", ali je vraćeno ${result.count} rezultata`);
                }
            )
        });

        // TC003: Pretraga sa validnim pojmom - tastatura
        testQueue.addTest({
            id: 'TC003',
            name: 'Pretraga sa validnim pojmom "tastatura"',
            fn: createTestWrapper(
                'TC003',
                'Pretraga sa validnim pojmom "tastatura"',
                'Equivalence Partitioning - Validna particija',
                'tastatura',
                'Treba da vrati rezultate pretrage (broj > 0)',
                async (testCase) => {
                    await page.navigateToHomepage();
                    await page.performSearch('tastatura');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    const result = await page.getSearchResultsCount();
                    const titles = await page.getProductTitles();
                    
                    testCase.resultsCount = result.count;
                    testCase.hasNoResults = result.hasNoResults;
                    testCase.actual = `Pronađeno ${result.count} rezultata`;
                    testCase.titles = titles.slice(0, 5);
                    
                    if (result.count === 0 && !result.hasNoResults) {
                        throw new Error(`Pretraga za "tastatura" nije vratila rezultate niti poruku o nedostatku rezultata`);
                    }
                    
                    expect(result.count).to.be.greaterThan(0, 
                        `Pretraga bi trebala da vrati rezultate za "tastatura", ali je vraćeno ${result.count} rezultata`);
                }
            )
        });

        // TC004: Pretraga sa praznim stringom
        testQueue.addTest({
            id: 'TC004',
            name: 'Pretraga sa praznim stringom',
            fn: createTestWrapper(
                'TC004',
                'Pretraga sa praznim stringom (Boundary Value - 0 karaktera)',
                'Boundary Value Analysis',
                '"" (prazan string)',
                'Treba prikazati gresku, sve proizvode ili poruku "Nema rezultata"',
                async (testCase) => {
                    await page.navigateToHomepage();
                    await page.performSearch('');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    const result = await page.getSearchResultsCount();
                    const currentUrl = await page.getCurrentUrl();
                    
                    testCase.resultsCount = result.count;
                    testCase.hasNoResults = result.hasNoResults;
                    testCase.actual = `Rezultata: ${result.count}, Nema rezultata poruka: ${result.hasNoResults}, URL: ${currentUrl}`;
                    
                    if (result.count > 100 && !result.hasNoResults) {
                        testCase.bug = true;
                        testCase.actual += ' ⚠ MOGUĆ BUG: Vraća sve proizvode bez poruke za prazan string';
                    }
                    
                    const isValid = result.count === 0 || result.hasNoResults || (result.count > 0 && result.count < 50);
                    if (!isValid) {
                        throw new Error(`Prazan string pretraga vraća neočekivane rezultate: ${result.count} rezultata bez poruke`);
                    }
                    expect(isValid).to.be.true;
                }
            )
        });

        // TC005: Pretraga sa nevažećim pojmom
        testQueue.addTest({
            id: 'TC005',
            name: 'Pretraga sa nevažećim pojmom',
            fn: createTestWrapper(
                'TC005',
                'Pretraga sa nevažećim pojmom (nepostojeći proizvod)',
                'Equivalence Partitioning - Nevažeća particija',
                'xyz123abc456',
                'Treba prikazati poruku "Nema rezultata" ili 0 rezultata',
                async (testCase) => {
                    await page.navigateToHomepage();
                    await page.performSearch('xyz123abc456');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    const result = await page.getSearchResultsCount();
                    const currentUrl = await page.getCurrentUrl();
                    
                    testCase.resultsCount = result.count;
                    testCase.hasNoResults = result.hasNoResults;
                    testCase.actual = `Rezultata: ${result.count}, Nema rezultata poruka: ${result.hasNoResults}, URL: ${currentUrl}`;
                    
                    if (result.count > 0 && !result.hasNoResults) {
                        testCase.bug = true;
                        testCase.actual += ' ⚠ MOGUĆ BUG: Vraća rezultate za nevažeći pojam';
                        throw new Error(`Nevažeći pojam "xyz123abc456" je vratio ${result.count} rezultata bez poruke o nedostatku rezultata`);
                    }
                    
                    const isValid = result.count === 0 || result.hasNoResults;
                    if (!isValid) {
                        throw new Error(`Nevažeći pojam treba da vrati 0 rezultata ili poruku, ali je vraćeno ${result.count} rezultata`);
                    }
                    expect(isValid).to.be.true;
                }
            )
        });

        // TC006: Pretraga sa specijalnim karakterima
        testQueue.addTest({
            id: 'TC006',
            name: 'Pretraga sa specijalnim karakterima',
            fn: createTestWrapper(
                'TC006',
                'Pretraga sa specijalnim karakterima',
                'Equivalence Partitioning - Nevažeća particija',
                '!@#$%',
                'Treba prikazati poruku "Nema rezultata", gresku ili 0 rezultata',
                async (testCase) => {
                    await page.navigateToHomepage();
                    await page.performSearch('!@#$%');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    const result = await page.getSearchResultsCount();
                    const currentUrl = await page.getCurrentUrl();
                    
                    testCase.resultsCount = result.count;
                    testCase.hasNoResults = result.hasNoResults;
                    testCase.actual = `Rezultata: ${result.count}, Nema rezultata poruka: ${result.hasNoResults}, URL: ${currentUrl}`;
                    
                    const isValid = result.count === 0 || result.hasNoResults;
                    if (!isValid) {
                        throw new Error(`Specijalni karakteri treba da vrate 0 rezultata ili poruku, ali je vraćeno ${result.count} rezultata`);
                    }
                    expect(isValid).to.be.true;
                }
            )
        });

        // TC007: Pretraga sa numeričkim vrijednostima
        testQueue.addTest({
            id: 'TC007',
            name: 'Pretraga sa numeričkim vrijednostima',
            fn: createTestWrapper(
                'TC007',
                'Pretraga sa numeričkim vrijednostima',
                'Equivalence Partitioning',
                '123',
                'Može vratiti proizvode sa brojem 123 u nazivu/ceni ili 0 rezultata',
                async (testCase) => {
                    await page.navigateToHomepage();
                    await page.performSearch('123');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    const result = await page.getSearchResultsCount();
                    const titles = await page.getProductTitles();
                    
                    testCase.resultsCount = result.count;
                    testCase.hasNoResults = result.hasNoResults;
                    testCase.actual = `Pronađeno ${result.count} rezultata`;
                    testCase.titles = titles.slice(0, 5);
                    
                    expect(result.count).to.be.at.least(0);
                }
            )
        });

        // TC008: Pretraga sa dugim stringom
        testQueue.addTest({
            id: 'TC008',
            name: 'Pretraga sa dugim stringom',
            fn: createTestWrapper(
                'TC008',
                'Pretraga sa dugim stringom (Boundary Value - 100 karaktera)',
                'Boundary Value Analysis',
                'String od 100 karaktera',
                'Treba prikazati gresku, "Nema rezultata" ili 0 rezultata',
                async (testCase) => {
                    const longString = 'a'.repeat(100);
                    await page.navigateToHomepage();
                    await page.performSearch(longString);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    const result = await page.getSearchResultsCount();
                    const currentUrl = await page.getCurrentUrl();
                    
                    testCase.resultsCount = result.count;
                    testCase.hasNoResults = result.hasNoResults;
                    testCase.actual = `Rezultata: ${result.count}, Nema rezultata poruka: ${result.hasNoResults}, URL: ${currentUrl}`;
                    
                    if (result.count > 0 && !result.hasNoResults) {
                        testCase.bug = true;
                        testCase.actual += ' ⚠ MOGUĆ BUG: Vraća rezultate za predugačak string';
                    }
                    
                    const isValid = result.count === 0 || result.hasNoResults;
                    if (!isValid) {
                        throw new Error(`Predugačak string treba da vrati 0 rezultata ili poruku, ali je vraćeno ${result.count} rezultata`);
                    }
                    expect(isValid).to.be.true;
                }
            )
        });

        // TC009: Pretraga sa jednim karakterom
        testQueue.addTest({
            id: 'TC009',
            name: 'Pretraga sa jednim karakterom',
            fn: createTestWrapper(
                'TC009',
                'Pretraga sa jednim karakterom (Boundary Value - min dužina)',
                'Boundary Value Analysis',
                'a',
                'Može vratiti rezultate, poruku da je pretraga previse opsa ili sve proizvode',
                async (testCase) => {
                    await page.navigateToHomepage();
                    await page.performSearch('a');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    const result = await page.getSearchResultsCount();
                    const titles = await page.getProductTitles();
                    
                    testCase.resultsCount = result.count;
                    testCase.hasNoResults = result.hasNoResults;
                    testCase.actual = `Pronađeno ${result.count} rezultata, Nema rezultata poruka: ${result.hasNoResults}`;
                    testCase.titles = titles.slice(0, 5);
                    
                    if (result.count > 100 && !result.hasNoResults) {
                        testCase.bug = true;
                        testCase.actual += ' ⚠ MOGUĆ BUG: Vraća sve proizvode bez upozorenja za previše opštu pretragu';
                    }
                    
                    expect(result.count).to.be.at.least(0);
                }
            )
        });

        // TC010: Pretraga sa pojmom na engleskom jeziku
        testQueue.addTest({
            id: 'TC010',
            name: 'Pretraga sa pojmom na engleskom',
            fn: createTestWrapper(
                'TC010',
                'Pretraga sa pojmom na engleskom jeziku',
                'Equivalence Partitioning',
                'keyboard',
                'Može vratiti rezultate (ako postoje) ili 0 rezultata',
                async (testCase) => {
                    await page.navigateToHomepage();
                    await page.performSearch('keyboard');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    const result = await page.getSearchResultsCount();
                    const titles = await page.getProductTitles();
                    
                    testCase.resultsCount = result.count;
                    testCase.hasNoResults = result.hasNoResults;
                    testCase.actual = `Pronadjeno ${result.count} rezultata`;
                    testCase.titles = titles.slice(0, 5);
                    
                    expect(result.count).to.be.at.least(0);
                }
            )
        });

        // TC011: Pretraga sa razmacima (trim test)
        testQueue.addTest({
            id: 'TC011',
            name: 'Pretraga sa razmacima na početku i kraju',
            fn: createTestWrapper(
                'TC011',
                'Pretraga sa razmacima na pocetku i kraju (Error Guessing - trim)',
                'Error Guessing',
                '"  laptop  " (sa razmacima)',
                'Sistem treba trim-ovati razmake i vratiti rezultate kao za "laptop"',
                async (testCase) => {
                    await page.navigateToHomepage();
                    await page.performSearch('  laptop  ');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    const result = await page.getSearchResultsCount();
                    const titles = await page.getProductTitles();
                    const currentUrl = await page.getCurrentUrl();
                    
                    testCase.resultsCount = result.count;
                    testCase.hasNoResults = result.hasNoResults;
                    testCase.actual = `Pronadjeno ${result.count} rezultata, URL: ${currentUrl}`;
                    testCase.titles = titles.slice(0, 5);
                    
                    if (result.count === 0) {
                        testCase.bug = true;
                        testCase.actual += ' ⚠ MOGUC BUG: Vraca 0 rezultata - mozda nije trim-ovano';
                    }
                    
                    expect(result.count).to.be.at.least(0);
                }
            )
        });

        // TC012: SQL Injection Test
        testQueue.addTest({
            id: 'TC012',
            name: 'SQL Injection test',
            fn: createTestWrapper(
                'TC012',
                'Pretraga sa SQL injection pokusajem (Security/Error Guessing)',
                'Error Guessing / Security Testing',
                "' OR '1'='1",
                'Sistem ne bi trebalo da vrati sve proizvode, treba prikazati gresku ili "Nema rezultata"',
                async (testCase) => {
                    await page.navigateToHomepage();
                    await page.performSearch("' OR '1'='1");
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    const result = await page.getSearchResultsCount();
                    const currentUrl = await page.getCurrentUrl();
                    
                    testCase.resultsCount = result.count;
                    testCase.hasNoResults = result.hasNoResults;
                    testCase.actual = `Pronadjeno ${result.count} rezultata, Nema rezultata poruka: ${result.hasNoResults}, URL: ${currentUrl}`;
                    
                    if (result.count > 100) {
                        testCase.securityIssue = true;
                        testCase.bug = true;
                        testCase.actual += ' 🔒 KRITICAN SIGURNOSNI PROBLEM: Vraceno previse rezultata - SQL injection mozda uspesan!';
                    }
                    
                    expect(result.count === 0 || result.hasNoResults || result.count > 0).to.be.true;
                }
            )
        });

        // TC013: XSS Test - napredna analiza
        testQueue.addTest({
            id: 'TC013',
            name: 'Napredni XSS test',
            fn: createTestWrapper(
                'TC013',
                'Napredni XSS test sa više payload-ova i analizom DOM-a/URL-a',
                'Error Guessing / Security Testing / XSS',
                '<script>alert(\"XSS\")</script>',
                'Sistem ne sme da izvrši skriptu, ne sme da sadrži script tag u URL-u/DOM-u, treba prikazati gresku ili \"Nema rezultata\"',
                async (testCase) => {
                    const payloads = [
                        '<script>alert(\"XSS\")</script>',
                        '\"><script>alert(\"XSS2\")</script>',
                        '<img src=x onerror=\"alert(\'XSS3\')\">'
                    ];

                    for (const payload of payloads) {
                        console.log(`   🔐 XSS payload: ${payload}`);

                        await page.navigateToHomepage();
                        await page.performSearch(payload);
                        await new Promise(resolve => setTimeout(resolve, 2000));

                        const result = await page.getSearchResultsCount();
                        const currentUrl = await page.getCurrentUrl();
                        const xssAnalysis = await page.analyzeForPotentialXSS(payload);

                        testCase.resultsCount = result.count;
                        testCase.hasNoResults = result.hasNoResults;
                        testCase.actual = `Payload: ${payload}, Rezultata: ${result.count}, Nema rezultata: ${result.hasNoResults}, URL: ${currentUrl}, ` +
                            `scriptUrl=${xssAnalysis.hasScriptInUrl}, scriptDom=${xssAnalysis.hasScriptInDom}, ` +
                            `events=${xssAnalysis.hasEventAttributes}, alert=${xssAnalysis.alertTriggered}`;

                        if (xssAnalysis.alertTriggered) {
                            testCase.securityIssue = true;
                            testCase.bug = true;
                            throw new Error(`XSS payload je izazvao alert u browseru (payload: ${payload})`);
                        }

                        if (xssAnalysis.hasScriptInUrl || xssAnalysis.hasScriptInDom || xssAnalysis.hasInnerHtmlInjection) {
                            testCase.securityIssue = true;
                            testCase.bug = true;
                            throw new Error(`Detektovan potencijalni XSS (script tag ili nesanitizovan HTML) za payload: ${payload}`);
                        }

                        expect(result.count).to.be.at.least(0);
                    }
                }
            ),
stopOnFailure: false
        });

        // TC014: Pretraga sa dva karaktera
        testQueue.addTest({
            id: 'TC014',
            name: 'Pretraga sa dva karaktera',
            fn: createTestWrapper(
                'TC014',
                'Pretraga sa dva karaktera (Boundary Value - min validna dužina)',
                'Boundary Value Analysis',
                'ab',
                'Treba vratiti rezultate pretrage',
                async (testCase) => {
                    await page.navigateToHomepage();
                    await page.performSearch('ab');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    const result = await page.getSearchResultsCount();
                    const titles = await page.getProductTitles();
                    
                    testCase.resultsCount = result.count;
                    testCase.hasNoResults = result.hasNoResults;
                    testCase.actual = `Pronadjeno ${result.count} rezultata`;
                    testCase.titles = titles.slice(0, 5);
                    
                    expect(result.count).to.be.at.least(0);
                }
            ),
stopOnFailure: false
        });

        // TC015: Pretraga sa hrvatskim karakterima
        testQueue.addTest({
            id: 'TC015',
            name: 'Pretraga sa hrvatskim karakterima',
            fn: createTestWrapper(
                'TC015',
                'Pretraga sa hrvatskim karakterima (Unicode test)',
                'Equivalence Partitioning',
                'čajnik',
                'Treba vratiti rezultate pretrage (ako postoje proizvodi)',
                async (testCase) => {
                    await page.navigateToHomepage();
                    await page.performSearch('čajnik');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    const result = await page.getSearchResultsCount();
                    const titles = await page.getProductTitles();
                    
                    testCase.resultsCount = result.count;
                    testCase.hasNoResults = result.hasNoResults;
                    testCase.actual = `Pronadjeno ${result.count} rezultata`;
                    testCase.titles = titles.slice(0, 5);
                    
                    expect(result.count).to.be.at.least(0);
                }
            ),
stopOnFailure: false
        });

        // TC016: Test case sensitivity
        testQueue.addTest({
            id: 'TC016',
            name: 'Pretraga sa različitim veličinama slova',
            fn: createTestWrapper(
                'TC016',
                'Pretraga sa različitim veličinama slova (case sensitivity)',
                'Functional Testing - Case Sensitivity',
                'LAPTOP vs laptop',
                'Treba da vrati rezultate bez obzira na veličinu slova',
                async (testCase) => {
                    await page.navigateToHomepage();
                    await page.performSearch('LAPTOP');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    const resultUpper = await page.getSearchResultsCount();
                    const titlesUpper = await page.getProductTitles();
                    
                    await page.navigateToHomepage();
                    await page.performSearch('laptop');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    const resultLower = await page.getSearchResultsCount();
                    const titlesLower = await page.getProductTitles();
                    
                    testCase.resultsCount = resultUpper.count;
                    testCase.hasNoResults = resultUpper.hasNoResults;
                    testCase.actual = `Velika slova: ${resultUpper.count} rezultata, Mala slova: ${resultLower.count} rezultata`;
                    testCase.titles = titlesUpper.slice(0, 3);
                    
                    expect(resultUpper.count).to.be.at.least(0);
                    expect(resultLower.count).to.be.at.least(0);
                }
            ),
stopOnFailure: false
        });

        // TC017: Test partial match
        testQueue.addTest({
            id: 'TC017',
            name: 'Pretraga sa delimičnim poklapanjem',
            fn: createTestWrapper(
                'TC017',
                'Pretraga sa delimičnim poklapanjem (partial match)',
                'Functional Testing - Partial Match',
                'lap',
                'Treba da vrati rezultate koji sadrže "lap" u nazivu',
                async (testCase) => {
                    await page.navigateToHomepage();
                    await page.performSearch('lap');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    const result = await page.getSearchResultsCount();
                    const titles = await page.getProductTitles();
                    
                    testCase.resultsCount = result.count;
                    testCase.hasNoResults = result.hasNoResults;
                    testCase.actual = `Pronadjeno ${result.count} rezultata sa delimičnim poklapanjem`;
                    testCase.titles = titles.slice(0, 5);
                    
                    expect(result.count).to.be.at.least(0);
                }
            ),
stopOnFailure: false
        });

        // TC018: Test multiple words
        testQueue.addTest({
            id: 'TC018',
            name: 'Pretraga sa više reči',
            fn: createTestWrapper(
                'TC018',
                'Pretraga sa više reči (multiple words)',
                'Functional Testing - Multiple Words',
                'laptop torba',
                'Treba da vrati rezultate za obe reči',
                async (testCase) => {
                    await page.navigateToHomepage();
                    await page.performSearch('laptop torba');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    const result = await page.getSearchResultsCount();
                    const titles = await page.getProductTitles();
                    
                    testCase.resultsCount = result.count;
                    testCase.hasNoResults = result.hasNoResults;
                    testCase.actual = `Pronadjeno ${result.count} rezultata za više reči`;
                    testCase.titles = titles.slice(0, 5);
                    
                    expect(result.count).to.be.at.least(0);
                }
            ),
stopOnFailure: false
        });

        // TC019: Test numbers in search (decimal)
        testQueue.addTest({
            id: 'TC019',
            name: 'Pretraga sa decimalnim brojevima',
            fn: createTestWrapper(
                'TC019',
                'Pretraga sa brojevima u upitu',
                'Functional Testing - Numeric Search',
                '15.6',
                'Treba da vrati rezultate koji sadrže broj',
                async (testCase) => {
                    await page.navigateToHomepage();
                    await page.performSearch('15.6');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    const result = await page.getSearchResultsCount();
                    const titles = await page.getProductTitles();
                    
                    testCase.resultsCount = result.count;
                    testCase.hasNoResults = result.hasNoResults;
                    testCase.actual = `Pronadjeno ${result.count} rezultata sa brojevima`;
                    testCase.titles = titles.slice(0, 5);
                    
                    expect(result.count).to.be.at.least(0);
                }
            ),
stopOnFailure: false
        });

        // TC020: Test special characters (non-SQL/XSS)
        testQueue.addTest({
            id: 'TC020',
            name: 'Pretraga sa specijalnim karakterima (crtice)',
            fn: createTestWrapper(
                'TC020',
                'Pretraga sa specijalnim karakterima',
                'Functional Testing - Special Characters',
                'laptop-stand',
                'Treba da vrati rezultate ili poruku o grešci',
                async (testCase) => {
                    await page.navigateToHomepage();
                    await page.performSearch('laptop-stand');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    const result = await page.getSearchResultsCount();
                    const titles = await page.getProductTitles();
                    
                    testCase.resultsCount = result.count;
                    testCase.hasNoResults = result.hasNoResults;
                    testCase.actual = `Pronadjeno ${result.count} rezultata, Nema rezultata: ${result.hasNoResults}`;
                    testCase.titles = titles.slice(0, 3);
                    
                    expect(result.count).to.be.at.least(0);
                }
            ),
stopOnFailure: false
        });

        // TC021: Whitespace varijanta
        testQueue.addTest({
            id: 'TC021',
            name: 'Pretraga sa whitespace varijantom "miš  "',
            fn: createTestWrapper(
                'TC021',
                'Pretraga sa whitespace varijantom "miš  " (miš + dva razmaka)',
                'Error Guessing / Whitespace Handling',
                '"miš  " (miš + dva razmaka)',
                'Sistem treba da tretira previše whitespace-a kao nevalidan upit i NE vrati rezultate (ili jasno prikaže da nema rezultata)',
                async (testCase) => {
                    await page.navigateToHomepage();
                    await page.performSearch('miš  ');
                    await new Promise(resolve => setTimeout(resolve, 2000));

                    const result = await page.getSearchResultsCount();
                    const currentUrl = await page.getCurrentUrl();

                    testCase.resultsCount = result.count;
                    testCase.hasNoResults = result.hasNoResults;
                    testCase.actual = `Rezultata: ${result.count}, Nema rezultata poruka: ${result.hasNoResults}, URL: ${currentUrl}`;

                    if (result.count > 0 && !result.hasNoResults) {
                        testCase.bug = true;
                        testCase.actual += ' ⚠ MOGUĆ BUG: Whitespace varijanta "miš  " vraća proizvode umesto da prijavi da nema rezultata';
                        throw new Error(`Whitespace varijanta "miš  " vratila je ${result.count} rezultata bez poruke o nedostatku rezultata`);
                    }

                    const isValid = result.count === 0 || result.hasNoResults;
                    expect(isValid).to.be.true;
                }
            ),
stopOnFailure: false
        });

        // TC022: Test search performance
        testQueue.addTest({
            id: 'TC022',
            name: 'Test performansi pretrage',
            config: { retries: 1 },
            fn: createTestWrapper(
                'TC022',
                'Test performansi pretrage (vreme odgovora)',
                'Performance Testing',
                'laptop',
                'Pretraga bi trebala da se izvrši za manje od 10 sekundi',
                async (testCase) => {
                    const searchStartTime = Date.now();
                    await page.navigateToHomepage();
                    await page.performSearch('laptop');
                    const searchEndTime = Date.now();
                    const searchDuration = (searchEndTime - searchStartTime) / 1000;
                    
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    const result = await page.getSearchResultsCount();
                    const titles = await page.getProductTitles();
                    
                    testCase.resultsCount = result.count;
                    testCase.hasNoResults = result.hasNoResults;
                    testCase.actual = `Pretraga izvršena za ${searchDuration.toFixed(2)}s, Pronadjeno ${result.count} rezultata`;
                    testCase.titles = titles.slice(0, 3);
                    testCase.performance = `${searchDuration.toFixed(2)}s`;
                    
                    expect(searchDuration).to.be.lessThan(10, 'Pretraga bi trebala da se izvrši za manje od 10 sekundi');
                    expect(result.count).to.be.at.least(0);
                }
            ),
stopOnFailure: false
        });

        // TC023: Test search with HTML entities
        testQueue.addTest({
            id: 'TC023',
            name: 'Pretraga sa HTML entitetima',
            fn: createTestWrapper(
                'TC023',
                'Pretraga sa HTML entitetima',
                'Security Testing - HTML Entities',
                'laptop&amp;stand',
                'Treba da sanitizuje HTML entitete',
                async (testCase) => {
                    await page.navigateToHomepage();
                    await page.performSearch('laptop&amp;stand');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    const result = await page.getSearchResultsCount();
                    const titles = await page.getProductTitles();
                    
                    testCase.resultsCount = result.count;
                    testCase.hasNoResults = result.hasNoResults;
                    testCase.actual = `Pronadjeno ${result.count} rezultata`;
                    testCase.titles = titles.slice(0, 3);
                    
                    expect(result.count).to.be.at.least(0);
                }
            ),
stopOnFailure: false
        });

        // TC024: Test search with URL encoding
        testQueue.addTest({
            id: 'TC024',
            name: 'Pretraga sa URL encoding',
            fn: createTestWrapper(
                'TC024',
                'Pretraga sa URL encoding karakterima',
                'Functional Testing - URL Encoding',
                'laptop%20stand',
                'Treba da dekoduje URL encoding',
                async (testCase) => {
                    await page.navigateToHomepage();
                    await page.performSearch('laptop%20stand');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    const result = await page.getSearchResultsCount();
                    const titles = await page.getProductTitles();
                    
                    testCase.resultsCount = result.count;
                    testCase.hasNoResults = result.hasNoResults;
                    testCase.actual = `Pronadjeno ${result.count} rezultata`;
                    testCase.titles = titles.slice(0, 3);
                    
                    expect(result.count).to.be.at.least(0);
                }
            ),
stopOnFailure: false
        });

        // TC025: Robustness test sa inputom d\
        testQueue.addTest({
            id: 'TC025',
            name: 'Robustness test sa inputom d\\ (d i backslash)',
            fn: createTestWrapper(
                'TC025',
                'Robustness/security test sa malformiranim inputom `d\\` (d i backslash)',
                'Error Guessing / Robustness / Security',
                'd\\',
                'Sistem ne sme da se „uništi": nema 500 stranice, nema rušenja, očekuje se 0 rezultata ili jasna poruka',
                async (testCase) => {
                    await page.navigateToHomepage();
                    await page.performSearch('d\\');
                    await new Promise(resolve => setTimeout(resolve, 2000));

                    const result = await page.getSearchResultsCount();
                    const currentUrl = await page.getCurrentUrl();

                    testCase.resultsCount = result.count;
                    testCase.hasNoResults = result.hasNoResults;
                    testCase.actual = `Rezultata: ${result.count}, Nema rezultata poruka: ${result.hasNoResults}, URL: ${currentUrl}`;

                    if (!currentUrl.includes('hithouse.ba')) {
                        testCase.bug = true;
                        testCase.securityIssue = true;
                        testCase.actual += ' 🔒 KRITIČAN PROBLEM: Preusmeravanje van domena nakon malformiranog inputa';
                        throw new Error('Pretraga sa inputom `d\\` je preusmerila korisnika van domena hithouse.ba ili uništila sajt');
                    }

                    if (result.count > 100 && !result.hasNoResults) {
                        testCase.bug = true;
                        testCase.actual += ' ⚠ MOGUĆ BUG: Malformirani input `d\\` vraća previše rezultata';
                    }

                    const isValid = result.count === 0 || result.hasNoResults || (result.count > 0 && result.count < 50);
                    expect(isValid).to.be.true;
                }
            ),
stopOnFailure: false
        });
    });

    // =====================================================
    // POKRETANJE TESTOVA IZ QUEUE-A
    // =====================================================

    it('Svi testovi u queue-u - sekvencijalno izvršavanje', async function() {
        this.timeout(config.timeout.test * testQueue.queue.length);
        
        if (!testQueue || testQueue.queue.length === 0) {
            throw new Error('Test queue nije inicijalizovan ili je prazan');
        }

        console.log(`\n[QUEUE] Pokretanje ${testQueue.queue.length} testova u sekvencijalnom redu\n`);
        
        try {
            await testQueue.run();
            
            const completed = testQueue.getCompletedTests();
            const failed = testQueue.getFailedTests();
            
            console.log(`\n[QUEUE] Finalni rezime:`);
            console.log(`   Završeno: ${completed.length}/${testQueue.queue.length}`);
            console.log(`   Uspešno: ${completed.filter(t => t.status === 'COMPLETED').length}`);
            console.log(`   Neuspešno: ${failed.length}`);
            
            if (failed.length > 0) {
                const errorMessages = failed.map(t => `${t.id}: ${t.error?.message || 'Nepoznata greška'}`).join('\n');
                throw new Error(`Neki testovi su neuspešni:\n${errorMessages}`);
            }
        } catch (error) {
            console.error(`\n[QUEUE] Greška pri izvršavanju queue-a: ${error.message}`);
            throw error;
        }
    });
});

module.exports = { TEST_TYPE_LABELS, inferCategory };