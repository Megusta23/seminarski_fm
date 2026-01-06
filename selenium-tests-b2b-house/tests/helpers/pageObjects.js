const { By, until } = require('selenium-webdriver');

class HithousePage {
    constructor(driver) {
        this.driver = driver;
        this.baseUrl = 'https://hithouse.ba';
    }

    /* =====================================================
       NAVIGACIJA
    ===================================================== */

    async navigateToHomepage() {
        console.log(`\n==============================`);
        console.log(`🧭 Navigacija na homepage...`);
        console.log(`==============================`);

        try {
            const currentUrl = await this.driver.getCurrentUrl().catch(() => '');
            console.log(`   Trenutni URL: ${currentUrl}`);

            if (
                currentUrl.includes('hithouse.ba') &&
                !currentUrl.includes('search') &&
                !currentUrl.includes('idproizvod')
            ) {
                try {
                    const input = await this.driver.findElement(By.css('#search_query_top'));
                    const visible = await input.isDisplayed();
                    if (visible) {
                        console.log(`   ✅ Već smo na homepage-u (search postoji)`);
                        return true;
                    }
                } catch (_) {
                    console.log(`   ℹ Search input nije detektovan, idem na reload`);
                }
            }

            console.log(`   Otvaram ${this.baseUrl}`);
            await this.driver.get(this.baseUrl);

            await this.driver.wait(async () => {
                const rs = await this.driver.executeScript('return document.readyState');
                console.log(`   document.readyState = ${rs}`);
                return rs === 'interactive' || rs === 'complete';
            }, 5000).catch(() => {
                console.log(`   ⚠ Timeout na readyState`);
            });

            await this.driver.wait(
                until.elementLocated(By.css('#search_query_top')),
                7000
            ).catch(() => {
                console.log(`   ⚠ Search input nije lociran`);
            });

            console.log(`   ✅ Homepage učitan`);
            return true;

        } catch (e) {
            console.log(`   ❌ Greška u navigaciji: ${e.message}`);
            throw e;
        }
    }

    /* =====================================================
       SELEKTORI
    ===================================================== */

    getSearchInputSelectors() {
        return [
            '#search_query_top',
            'input[name="pretraga_polje"]',
            'input[type="search"]',
            'input[type="text"]'
        ];
    }

    getSearchResultsSelectors() {
        return [
            '.caption-proizvod',
            '.product',
            '.product-item',
            '[data-product-id]'
        ];
    }

    getProductTitleSelectors() {
        return [
            'h3 a',
            'h3',
            '.product-name',
            '.product-title'
        ];
    }

    /* =====================================================
       SEARCH INPUT
    ===================================================== */

    async findSearchInputFast() {
        console.log(`\n🔎 Traženje search input polja...`);

        for (const selector of this.getSearchInputSelectors()) {
            try {
                console.log(`   ➜ Pokušavam selector: ${selector}`);
                const el = await this.driver.findElement(By.css(selector));
                const visible = await el.isDisplayed();

                if (visible) {
                    console.log(`   ✅ Search input pronađen (${selector})`);
                    return el;
                }
            } catch (e) {
                console.log(`   ✖ Nije pronađen (${selector})`);
            }
        }

        console.log(`   ❌ Search input NIJE pronađen`);
        return null;
    }

    /* =====================================================
       SEARCH
    ===================================================== */

    async performSearch(searchTerm) {
        console.log(`\n==============================`);
        console.log(`🔍 Pokretanje pretrage`);
        console.log(`   Pojam: "${searchTerm}"`);
        console.log(`==============================`);

        const input = await this.findSearchInputFast();
        if (!input) throw new Error('Search input nije pronađen');

        try {
            await this.driver.executeScript(
                'arguments[0].scrollIntoView({block:"center"});',
                input
            );

            await input.clear();
            await this.driver.sleep(200);
            await input.sendKeys(searchTerm);
            await this.driver.sleep(200);
            await input.sendKeys('\n');

            console.log(`   ✅ Enter pritisnut, čekam rezultate...`);
            await this.driver.sleep(2000);

            const url = await this.driver.getCurrentUrl();
            console.log(`   Trenutni URL nakon search-a: ${url}`);

            return true;

        } catch (e) {
            console.log(`   ❌ Greška u performSearch: ${e.message}`);
            throw e;
        }
    }

    /* =====================================================
       RESULT COUNT - ISPRAVLJENA LOGIKA (OBJEKAT)
    ===================================================== */

    async getSearchResultsCount() {
        console.log(`\n==============================`);
        console.log(`📊 Brojanje rezultata pretrage`);
        console.log(`==============================`);

        try {
            // 1️⃣ PRVO TRAŽI PROIZVODE
            for (const selector of this.getSearchResultsSelectors()) {
                console.log(`   🔎 Provjera proizvoda (${selector})`);
                const elements = await this.driver.findElements(By.css(selector));
                console.log(`      Pronađeno elemenata: ${elements.length}`);

                if (elements.length === 0) continue;

                let visibleCount = 0;
                for (const el of elements.slice(0, 20)) {
                    const visible = await el.isDisplayed().catch(() => false);
                    if (visible) visibleCount++;
                }

                console.log(`      Vidljivih elemenata: ${visibleCount}`);

                if (visibleCount > 0) {
                    console.log(`   ✅ PROIZVODI POSTOJE → vraćam ${elements.length}`);
                    console.log(`==============================\n`);
                    // ✅ RETURN ODMAH - NE PROVERAVA PORUKU
                    return {
                        count: elements.length,
                        hasNoResults: false
                    };
                }
            }

            // 2️⃣ TEK AKO NEMA PROIZVODA - proveri poruku
            console.log(`   ℹ️ Nema pronađenih proizvoda, provjeravam poruku "nema rezultata"...`);
            const noResultsDetected = await this._checkNoResultsMessage();

            if (noResultsDetected) {
                console.log(`   ✅ Detektovana poruka "nema rezultata"`);
                console.log(`==============================\n`);
                return {
                    count: 0,
                    hasNoResults: true
                };
            }

            // 3️⃣ NEMA NI PROIZVODA NI PORUKE
            console.log(`   ℹ️ Nema proizvoda, nema ni poruke`);
            console.log(`==============================\n`);
            return {
                count: 0,
                hasNoResults: false
            };

        } catch (e) {
            console.log(`   ❌ Greška u getSearchResultsCount: ${e.message}`);
            console.log(`==============================\n`);
            return {
                count: 0,
                hasNoResults: false
            };
        }
    }

    /* =====================================================
       NO RESULTS MESSAGE - PRIVATNA METODA
    ===================================================== */

    async _checkNoResultsMessage() {
        const phrases = [
            'nema rezultata',
            'nema proizvoda',
            '0 rezultata',
            '0 proizvoda',
            'nije pronađeno',
            'no results found'
        ];

        for (const phrase of phrases) {
            console.log(`      ➜ Tražim frazu: "${phrase}"`);

            const xpath =
                `//*[contains(translate(text(),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'${phrase}')]`;

            const elements = await this.driver.findElements(By.xpath(xpath));
            console.log(`         Pronađeno elemenata: ${elements.length}`);

            for (const el of elements) {
                const visible = await el.isDisplayed().catch(() => false);
                if (!visible) continue;

                const text = (await el.getText()).toLowerCase();
                console.log(`         Tekst: "${text}"`);

                const nums = text.match(/\d+/g);
                if (nums && nums.some(n => parseInt(n) > 0)) {
                    console.log(`         ⚠ Sadrži broj > 0 → IGNORE`);
                    continue;
                }

                console.log(`      ✅ VALIDNA "nema rezultata" poruka`);
                return true;
            }
        }

        console.log(`      ❌ Poruka "nema rezultata" NIJE pronađena`);
        return false;
    }

    /* =====================================================
       JAVNA METODA - DEPRECATED (za kompatibilnost)
    ===================================================== */

    async hasNoResultsMessage() {
        console.log(`\n⚠️ UPOZORENJE: hasNoResultsMessage() je deprecated!`);
        console.log(`   Koristite getSearchResultsCount().hasNoResults umesto toga.`);
        return await this._checkNoResultsMessage();
    }

    /* =====================================================
       PRODUCT TITLES
    ===================================================== */

    async getProductTitles() {
        console.log(`\n📦 Čitanje naslova proizvoda...`);
        const titles = [];

        for (const selector of this.getSearchResultsSelectors()) {
            console.log(`   ➜ Selector: ${selector}`);
            const products = await this.driver.findElements(By.css(selector));
            console.log(`      Pronađeno: ${products.length}`);

            if (products.length === 0) continue;

            for (const product of products.slice(0, 10)) {
                for (const tSel of this.getProductTitleSelectors()) {
                    try {
                        const el = await product.findElement(By.css(tSel));
                        const text = await el.getText();
                        if (text && text.length > 5) {
                            titles.push(text.trim());
                            console.log(`      ✔ "${text.trim()}"`);
                            break;
                        }
                    } catch (_) {}
                }
            }
            break;
        }

        console.log(`   ✅ Ukupno naslova: ${titles.length}`);
        return titles;
    }

    /* =====================================================
       UTILS
    ===================================================== */

    async getCurrentUrl() {
        return await this.driver.getCurrentUrl().catch(() => 'N/A');
    }

    async getPageTitle() {
        return await this.driver.getTitle().catch(() => 'N/A');
    }

    /* =====================================================
       HEALTH CHECK
    ===================================================== */

    async healthCheck() {
        console.log(`\n🩺 Health-check sajta...`);

        const url = await this.getCurrentUrl();
        const readyState = await this.driver.executeScript('return document.readyState').catch(() => 'unknown');
        const input = await this.findSearchInputFast();

        const result = {
            ok: !!(url.includes('hithouse.ba') && input && (readyState === 'complete' || readyState === 'interactive')),
            url,
            readyState,
            hasSearchInput: !!input
        };

        console.log(`   URL: ${url}`);
        console.log(`   readyState: ${readyState}`);
        console.log(`   search input: ${result.hasSearchInput}`);
        console.log(result.ok ? `   ✅ HEALTH OK` : `   ❌ HEALTH FAIL`);

        return result;
    }

    /* =====================================================
       XSS ANALYSIS
    ===================================================== */

    async analyzeForPotentialXSS(searchPayload) {
        console.log(`\n🔐 XSS analiza...`);

        const result = {
            hasScriptInUrl: false,
            hasScriptInDom: false,
            alertTriggered: false,
            hasEventAttributes: false,
            hasInnerHtmlInjection: false
        };

        const url = await this.getCurrentUrl();
        console.log(`   URL: ${url}`);

        if (url.toLowerCase().includes('<script') || url.includes('javascript:')) {
            result.hasScriptInUrl = true;
            console.log(`   ⚠ Script u URL-u`);
        }

        try {
            const html = await this.driver.executeScript(() => document.body.innerHTML.toLowerCase());
            if (html.includes('<script')) {
                result.hasScriptInDom = true;
                console.log(`   ⚠ Script u DOM-u`);
            }
            
            if (html.includes('onerror') || html.includes('onclick') || html.includes('onload')) {
                result.hasEventAttributes = true;
                console.log(`   ⚠ Event atributi u DOM-u`);
            }
            
            if (html.includes(searchPayload.toLowerCase())) {
                result.hasInnerHtmlInjection = true;
                console.log(`   ⚠ Payload reflektovan u DOM-u`);
            }
        } catch (_) {}

        try {
            const alert = await this.driver.switchTo().alert();
            console.log(`   ⚠ ALERT TRIGGERED`);
            await alert.dismiss();
            result.alertTriggered = true;
        } catch (_) {}

        console.log(`   XSS rezultat:`, result);
        return result;
    }
}

module.exports = HithousePage;