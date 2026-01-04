const config = {
    timeouts: {
        implicit: 10000,
        pageLoad: 30000,
        script: 10000
    },
    browser: {
        headless: false,
        windowSize: {
            width: 1920,
            height: 1080
        }
    }
};

module.exports = config;
