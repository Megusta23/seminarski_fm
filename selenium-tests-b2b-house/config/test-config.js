module.exports = {
    // Test configuration
    baseUrl: 'https://hithouse.ba',
    timeout: {
        test: 120000,      // 2 minuta po testu
        implicit: 5000,    // 5 sekundi implicit wait (smanjeno)
        pageLoad: 15000    // 15 sekundi za učitavanje stranice (smanjeno)
    },
    
    // Browser configuration
    browser: {
        name: 'chrome',
        headless: false,
        windowSize: {
            width: 1920,
            height: 1080
        },
        options: [
            '--start-maximized',
            '--disable-blink-features=AutomationControlled',
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-logging',
            '--disable-extensions',
            '--disable-background-networking',
            '--disable-sync',
            '--disable-translate',
            '--disable-default-apps',
            '--disable-component-extensions-with-background-pages',
            '--disable-background-timer-throttling',
            '--disable-renderer-backgrounding',
            '--disable-backgrounding-occluded-windows',
            '--disable-features=TranslateUI',
            '--disable-ipc-flooding-protection',
            '--log-level=3',
            '--silent'
        ]
    },
    
    // Screenshot configuration
    screenshots: {
        enabled: true,
        directory: './screenshots',
        onFailure: true,
        onSuccess: true,  // Uključeno za screenshot nakon svakog search-a
        afterSearch: true  // Screenshot nakon svakog search-a sa rezultatima
    },
    
    // Report configuration
    reports: {
        directory: './reports',
        json: true,
        html: true,
        format: 'YYYY-MM-DD_HH-mm-ss'
    },
    
    // Test data
    testData: {
        validSearchTerms: ['laptop', 'miš', 'tastatura', 'monitor', 'procesor'],
        invalidSearchTerms: ['xyz123abc456', 'nonexistentproduct999'],
        specialCharacters: ['!@#$%', '<script>', '&nbsp;'],
        boundaryValues: {
            empty: '',
            oneChar: 'a',
            twoChars: 'ab',
            longString: 'a'.repeat(100),
            maxString: 'a'.repeat(255)
        }
    },
    
    // Logging
    logging: {
        level: 'detailed', // 'minimal', 'normal', 'detailed'
        console: true,
        file: true,
        filePath: './logs/test-execution.log'
    }
};

