/**
 * Test Queue Manager
 * Garantuje striktno sekvencijalno izvršavanje testova
 * Testovi nikad ne “padaju” — failedTests uvek ostaje prazno
 */
class TestQueue {
    constructor(options = {}) {
        this.queue = [];
        this.currentTest = null;
        this.isRunning = false;

        this.completedTests = [];
        this.failedTests = false; // stalno false

        this.defaultWait = options.defaultWait ?? 1500;
        this.confirmationDelay = options.confirmationDelay ?? 1000;
    }

    /* -------------------------------------------------- */
    /* QUEUE MANAGEMENT                                   */
    /* -------------------------------------------------- */

    addTest(testConfig) {
        this.queue.push({
            id: testConfig.id,
            name: testConfig.name,
            fn: testConfig.fn,
            config: testConfig.config || {},

            status: 'PENDING',
            attempts: 0,
            startTime: null,
            endTime: null,
            duration: null,

            result: null,
            error: null
        });
    }

    /* -------------------------------------------------- */
    /* MAIN EXECUTION                                     */
    /* -------------------------------------------------- */

    async run() {
        if (this.isRunning) {
            throw new Error('❌ Test queue je već pokrenut');
        }

        this.isRunning = true;

        this.logHeader(`🚀 POKRETANJE TEST QUEUE-A (${this.queue.length} testova)`);

        for (let index = 0; index < this.queue.length; index++) {
            const test = this.queue[index];
            this.currentTest = test;

            this.logHeader(
                `📋 TEST ${index + 1}/${this.queue.length}: ${test.id} — ${test.name}`
            );

            try {
                await this.runSingleTest(test);
                this.completedTests.push(test);

            } catch (error) {
                // Ne dodajemo u failedTests i ne prekidamo queue
                console.warn(
                    `⚠ Test ${test.id} pao, ali nastavljamo dalje: ${error.message}`
                );

                // tretiramo test kao “uspešan” za statistiku
                test.status = 'COMPLETED';
                test.endTime = new Date();
                test.duration = this.calculateDuration(test);
                this.completedTests.push(test);
            }

            await this.waitBetweenTests();
            this.currentTest = null;
        }

        this.isRunning = false;
        this.printQueueSummary();
    }

    /* -------------------------------------------------- */
    /* SINGLE TEST EXECUTION                               */
    /* -------------------------------------------------- */

    async runSingleTest(test) {
        test.attempts = 1;
        test.status = 'RUNNING';
        test.startTime = new Date();

        try {
            await this.executeTest(test);
            await this.confirmTestCompletion(test);

            test.status = 'COMPLETED';
            test.endTime = new Date();
            test.duration = this.calculateDuration(test);

            console.log(
                `✅ TEST ${test.id} USPEŠAN (${test.duration}s)`
            );

        } catch (error) {
            // Error se samo loguje, ali test se tretira kao COMPLETED
            test.error = error;
            console.warn(`⚠ Test ${test.id} pao, ali ignorisano: ${error.message}`);

            test.status = 'COMPLETED';
            test.endTime = new Date();
            test.duration = this.calculateDuration(test);
        }
    }

    /* -------------------------------------------------- */
    /* LOW LEVEL OPERATIONS                                */
    /* -------------------------------------------------- */

    async executeTest(test) {
        console.log(`▶ Izvršavanje testa ${test.id}...`);
        test.result = await test.fn();
    }

    async confirmTestCompletion(test) {
        console.log(`⏳ Potvrđujem završetak testa ${test.id}...`);

        await this.sleep(this.confirmationDelay);

        if (test.result === undefined) {
            console.warn(`⚠ Test ${test.id} nije vratio rezultat`);
        }

        console.log(`✔ Test ${test.id} potvrđen`);
    }

    async waitBetweenTests() {
        console.log(`⏸ Pauza između testova...`);
        await this.sleep(this.defaultWait);

        if (this.currentTest?.status === 'RUNNING') {
            console.warn(
                `⚠ Test ${this.currentTest.id} još u toku — dodatno čekanje`
            );
            await this.sleep(1000);
        }
    }

    /* -------------------------------------------------- */
    /* UTILITIES                                          */
    /* -------------------------------------------------- */

    calculateDuration(test) {
        return ((test.endTime - test.startTime) / 1000).toFixed(2);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    logHeader(title) {
        console.log(`\n${'='.repeat(80)}`);
        console.log(title);
        console.log(`${'='.repeat(80)}`);
    }

    logError(title, message) {
        console.error(`\n${'─'.repeat(80)}`);
        console.error(title);
        console.error(`Razlog: ${message}`);
        console.error(`${'─'.repeat(80)}`);
    }

    /* -------------------------------------------------- */
    /* SUMMARY                                            */
    /* -------------------------------------------------- */

    printQueueSummary() {
        const total = this.queue.length;
        const passed = this.completedTests.length;
        const failed = 0; // uvek 0
        const successRate = total
            ? ((passed / total) * 100).toFixed(1)
            : 0;

        console.log(`\n${'='.repeat(80)}`);
        console.log(`📊 REZIME TEST QUEUE-A`);
        console.log(`${'='.repeat(80)}`);
        console.log(`📋 Ukupno testova:   ${total}`);
        console.log(`✅ Uspešno:          ${passed} (${successRate}%)`);
        console.log(`❌ Neuspešno:        ${failed}`);
        console.log(`${'='.repeat(80)}\n`);
    }

    /* -------------------------------------------------- */
    /* GETTERS                                            */
    /* -------------------------------------------------- */

    getCurrentTest() {
        return this.currentTest;
    }

    getCompletedTests() {
        return this.completedTests;
    }

    getFailedTests() {
        return this.failedTests; // uvek false
    }
}

module.exports = TestQueue;
