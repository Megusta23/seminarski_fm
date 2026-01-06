const fs = require('fs');
const path = require('path');
const config = require('../config/test-config');

// Generiši HTML izveštaj od JSON rezultata
function generateHTMLReport(jsonData) {
    const results = jsonData;
    const successRate = results.totalTests > 0 
        ? ((results.passed / results.totalTests) * 100).toFixed(2)
        : 0;

    const html = `
<!DOCTYPE html>
<html lang="sr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Report - hithouse.ba</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f5f5;
            padding: 20px;
            color: #333;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 30px;
        }
        h1 {
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
            margin-bottom: 30px;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .summary-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        .summary-card.success {
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
        }
        .summary-card.failure {
            background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%);
        }
        .summary-card.warning {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }
        .summary-card h2 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        .summary-card p {
            font-size: 1.1em;
            opacity: 0.9;
        }
        .tests-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        .tests-table th {
            background: #34495e;
            color: white;
            padding: 12px;
            text-align: left;
        }
        .tests-table td {
            padding: 12px;
            border-bottom: 1px solid #ddd;
        }
        .tests-table tr:hover {
            background: #f8f9fa;
        }
        .status-pass {
            color: #27ae60;
            font-weight: bold;
        }
        .status-fail {
            color: #e74c3c;
            font-weight: bold;
        }
        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.85em;
            margin-left: 5px;
        }
        .badge-bug {
            background: #f39c12;
            color: white;
        }
        .badge-security {
            background: #e74c3c;
            color: white;
        }
        .bugs-section, .security-section {
            margin-top: 30px;
            padding: 20px;
            border-radius: 8px;
        }
        .bugs-section {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
        }
        .security-section {
            background: #f8d7da;
            border-left: 4px solid #dc3545;
        }
        .bug-item, .security-item {
            margin: 10px 0;
            padding: 10px;
            background: white;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Test Report - hithouse.ba</h1>
        
        <div class="summary">
            <div class="summary-card">
                <h2>${results.totalTests}</h2>
                <p>Ukupno Testova</p>
            </div>
            <div class="summary-card success">
                <h2>${results.passed}</h2>
                <p>Passed</p>
            </div>
            <div class="summary-card failure">
                <h2>${results.failed}</h2>
                <p>Failed</p>
            </div>
            <div class="summary-card">
                <h2>${successRate}%</h2>
                <p>Success Rate</p>
            </div>
        </div>

        <h2>Test Rezultati</h2>
        <table class="tests-table">
            <thead>
                <tr>
                    <th>Test ID</th>
                    <th>Opis</th>
                    <th>Svrha</th>
                    <th>Kategorija</th>
                    <th>Status</th>
                    <th># Rezultata</th>
                    <th>Nema rezultata?</th>
                    <th>Screenshot</th>
                </tr>
            </thead>
            <tbody>
                ${results.tests.map(test => `
                <tr>
                    <td>${test.id}</td>
                    <td>${test.description}</td>
                    <td>${test.expected || ''}</td>
                    <td>${(test.category || 'N/A').toUpperCase()}</td>
                    <td>
                        <span class="status-${test.status.toLowerCase()}">${test.status}</span>
                        ${test.bug ? '<span class="badge badge-bug">BUG</span>' : ''}
                        ${test.securityIssue ? '<span class="badge badge-security">SECURITY</span>' : ''}
                    </td>
                    <td>${typeof test.resultsCount === 'number' ? test.resultsCount : (typeof test.brojRezultata === 'number' ? test.brojRezultata : 'N/A')}</td>
                    <td>${typeof test.hasNoResults === 'boolean' ? test.hasNoResults : (typeof test.imaPorukuNemaRezultata === 'boolean' ? test.imaPorukuNemaRezultata : 'N/A')}</td>
                    <td>${test.screenshot ? test.screenshot : (test.screenshotPath || '-')}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>

        ${results.bugs.length > 0 ? `
        <div class="bugs-section">
            <h2>Detektovani Bugovi (${results.bugs.length})</h2>
            ${results.bugs.map(bug => `
            <div class="bug-item">
                <strong>${bug.testId}</strong>: ${bug.description}<br>
                <small>${bug.actual}</small>
            </div>
            `).join('')}
        </div>
        ` : ''}

        ${results.securityIssues.length > 0 ? `
        <div class="security-section">
            <h2>Sigurnosni Problemi (${results.securityIssues.length})</h2>
            ${results.securityIssues.map(issue => `
            <div class="security-item">
                <strong>${issue.testId}</strong>: ${issue.description}<br>
                <small>${issue.actual}</small>
            </div>
            `).join('')}
        </div>
        ` : ''}

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 0.9em;">
            <p><strong>Datum izvršavanja:</strong> ${new Date(results.startTime).toLocaleString('sr-RS')}</p>
            <p><strong>Trajanje:</strong> ${(results.duration / 60).toFixed(2)} minuta</p>
        </div>
    </div>
</body>
</html>`;

    return html;
}

// Main funkcija
function main() {
    const reportsDir = config.reports.directory;
    const jsonFiles = fs.readdirSync(reportsDir)
        .filter(f => f.endsWith('.json'))
        .map(f => path.join(reportsDir, f))
        .sort()
        .reverse(); // Najnoviji prvi

    if (jsonFiles.length === 0) {
        console.log('Nema JSON fajlova u reports folderu.');
        return;
    }

    const latestJson = jsonFiles[0];
    console.log(`Citanje: ${latestJson}`);

    const jsonData = JSON.parse(fs.readFileSync(latestJson, 'utf8'));
    const html = generateHTMLReport(jsonData);

    const htmlFilename = `report-${new Date().toISOString().replace(/[:.]/g, '-')}.html`;
    const htmlPath = path.join(reportsDir, htmlFilename);
    
    fs.writeFileSync(htmlPath, html);
    console.log(`HTML izvestaj kreiran: ${htmlPath}`);
    console.log(`Otvorite fajl u browseru da vidite izvestaj.`);
}

if (require.main === module) {
    main();
}

module.exports = { generateHTMLReport };
