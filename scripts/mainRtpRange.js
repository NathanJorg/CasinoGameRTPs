// Function to fetch and parse HTML files
async function fetchAndParseHTML(url) {
    const response = await fetch(url);
    const text = await response.text();
    const parser = new DOMParser();
    return parser.parseFromString(text, 'text/html');
}

// Function to extract RTP values from a parsed HTML document
function extractRTPValues(doc) {
    const rtpValues = [];
    
    // Find all tables with the "mainGame" class
    const tables = doc.querySelectorAll('table.mainGame');

    tables.forEach(table => {
        // Find the headers of the table
        const headers = table.querySelectorAll('thead th');

        // Find the index of the "RTP" column
        let rtpColumnIndex = -1;
        headers.forEach((header, index) => {
            if (header.textContent.trim().toLowerCase() === 'rtp') {
                rtpColumnIndex = index;
            }
        });

        // If RTP column found, extract values from the corresponding cells
        if (rtpColumnIndex !== -1) {
            table.querySelectorAll('tbody tr').forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length > rtpColumnIndex) {
                    const rtpText = cells[rtpColumnIndex].textContent.trim();
                    const rtpValue = parseFloat(rtpText.replace('%', ''));
                    if (!isNaN(rtpValue)) {
                        rtpValues.push(rtpValue);
                    }
                }
            });
        }
    });

    return rtpValues;
}

// Function to calculate min and max RTP from an array of values
function calculateMinMaxRTP(rtpValues) {
    const minRTP = Math.min(...rtpValues);
    const maxRTP = Math.max(...rtpValues);
    return { minRTP: minRTP.toFixed(2), maxRTP: maxRTP.toFixed(2) };
}

// Main function to fetch, parse, and display min and max RTPs for multiple games
async function displayMinMaxRTPs() {
    // Array of game files to fetch and parse
    const gameFiles = [
        '../main_games/electronic_sic-bo.html',
        '../main_games/caribbean_stud.html',
        '../main_games/blackjack.html',
        '../main_games/baccarat.html',
        '../main_games/blackjack_challenge.html',
        '../main_games/roulette.html',
        '../main_games/sic-bo.html',
        '../main_games/soft_17_blackjack.html',
        '../main_games/spanish_blackjack.html',
        '../main_games/three_card_poker.html',
        '../main_games/wheel_of_fortune.html'
    ];

    const rtpData = [];

    // Fetch, parse, extract, and calculate min and max RTP for each game file
    for (const file of gameFiles) {
        const doc = await fetchAndParseHTML(file);
        const rtpValues = extractRTPValues(doc);
        if (rtpValues.length > 0) {
            const gameName = doc.querySelector('header h1').textContent.trim();
            const { minRTP, maxRTP } = calculateMinMaxRTP(rtpValues);
            rtpData.push({ gameName, minRTP, maxRTP });
        }
    }

    // Create table and display the results
    createMinMaxRTPTable(rtpData);
}

// Function to create and display the min/max RTP table
function createMinMaxRTPTable(rtpData) {
    // Create a new page section to display the table
    const section = document.createElement('section');
    section.innerHTML = `
        <table id="min-max-rtp-table">
            <thead>
                <tr>
                    <th data-sort="gameName">Game Name</th>
                    <th data-sort="minRTP">Min RTP</th>
                    <th data-sort="maxRTP">Max RTP</th>
                </tr>
            </thead>
            <tbody>
                ${rtpData.map(row => `
                    <tr>
                        <td>${row.gameName}</td>
                        <td>${row.minRTP}%</td>
                        <td>${row.maxRTP}%</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <div id="buttons-container">
            <button id="home-button" onclick="location.href='../index.html'">Home</button>
            <button id="back-button" onclick="window.history.back()">Back</button>    
            <button id="reset-button" onclick="location.reload()">Reset</button>
        </div>
    `;
    document.body.appendChild(section);

    console.log(section)

    // Add sorting functionality to the newly created table
    const table = document.getElementById('min-max-rtp-table');
    if (typeof addSortingToTable === 'function') {
        addSortingToTable(table); // Call the function from scripts.js
    } else {
        console.error('addSortingToTable function is not defined.');
    }
}

// Function to redirect to the new page
function redirectToRTPResults() {
    window.location.href = "rtpResults.html";
}

function addSortingToTable(table) {

    // if (sortingInitialized.has(table)) return; // Avoid re-initializing

    // sortingInitialized.add(table); // Mark this table as initialized

    const tbody = table.querySelector('tbody');
    const rows = tbody ? tbody.querySelectorAll('tr') : [];

    // Skip sorting if there's only one row or no rows
    if (rows.length <= 1) return;
    
    const headers = table.querySelectorAll('th');
    headers.forEach(header => {
        header.addEventListener('click', () => {
            const currentOrder = header.getAttribute('data-sort-order');
            let newOrder = 'asc';

            if (currentOrder) {
                newOrder = currentOrder === 'asc' ? 'desc' : 'asc';
            }

            const columnIndex = Array.from(header.parentElement.children).indexOf(header);
            const dataType = header.getAttribute('data-sort');

            headers.forEach(h => {
                h.removeAttribute('data-sort-order');
                h.classList.remove('sort-asc', 'sort-desc');
            });

            header.setAttribute('data-sort-order', newOrder);
            header.classList.add(newOrder === 'asc' ? 'sort-asc' : 'sort-desc');

            sortTableByColumn(table, columnIndex, dataType, newOrder === 'asc');
            logSortingClasses(headers);
        });
    });
}   

function sortTableByColumn(table, columnIndex, dataType, isAscending) {
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const direction = isAscending ? 1 : -1;

    rows.sort((a, b) => {
        const aText = a.cells[columnIndex].textContent.trim();
        const bText = b.cells[columnIndex].textContent.trim();

        if (dataType === 'minRTP' || dataType === 'maxRTP') {
            const aValue = parseFloat(aText.replace('%', ''));
            const bValue = parseFloat(bText.replace('%', ''));
            return (aValue - bValue) * direction;
        } else {
            return aText.localeCompare(bText) * direction;
        }
    });

    rows.forEach(row => tbody.appendChild(row));
}

function logSortingClasses(headers) {
    headers.forEach((header, index) => {
        const sortOrder = header.classList.contains('sort-asc') ? 'sort-asc' :
                          header.classList.contains('sort-desc') ? 'sort-desc' :
                          'none';

        console.log(`Column ${index + 1}: ${sortOrder}`);
    });
}
