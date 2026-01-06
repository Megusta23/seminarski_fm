const { spawn } = require('child_process');
const path = require('path');

console.log('========================================');
console.log('Pokretanje test suite-a za hithouse.ba');
console.log('========================================\n');

const mochaProcess = spawn('npx', ['mocha', 'tests/search/*.test.js', '--timeout', '120000', '--reporter', 'spec'], {
    stdio: 'inherit',
    shell: true,
    cwd: __dirname
});

mochaProcess.on('close', (code) => {
    console.log('\n========================================');
    if (code === 0) {
        console.log('Testovi uspesno zavrseni');
    } else {
        console.log(`Testovi zavrseni sa kodom: ${code}`);
    }
    console.log('========================================\n');
    process.exit(code);
});

mochaProcess.on('error', (error) => {
    console.error('Greska pri pokretanju testova:', error);
    process.exit(1);
});