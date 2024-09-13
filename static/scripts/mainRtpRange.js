// Function to fetch and parse HTML files
async function fetchAndParseHTML(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Network response was not ok for ${url}`);
    }
    const text = await response.text();
    const parser = new DOMParser();
    return parser.parseFromString(text, 'text/html');
}

// Function to extract RTP values and corresponding bet types from a parsed HTML document
function extractRTPValues(doc) {
    const rtpData = []; // Array to store objects with RTP values and their bet types
    
    // Find all tables with the "mainGame" class
    const tables = doc.querySelectorAll('table.mainGame');

    tables.forEach(table => {
        // Find the headers of the table
        const headers = table.querySelectorAll('thead th');

        // Find the index of the "RTP" and "Bet Type" columns
        let rtpColumnIndex = -1;
        let betTypeColumnIndex = -1;

        headers.forEach((header, index) => {
            const headerText = header.textContent.trim().toLowerCase();
            if (headerText === 'rtp') {
                rtpColumnIndex = index;
            } else if (headerText === 'bet type') {
                betTypeColumnIndex = index;
            }
        });

        // If RTP and Bet Type columns are found, extract values from the corresponding cells
        if (rtpColumnIndex !== -1 && betTypeColumnIndex !== -1) {
            table.querySelectorAll('tbody tr').forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length > rtpColumnIndex && cells.length > betTypeColumnIndex) {
                    const rtpText = cells[rtpColumnIndex].textContent.trim();
                    const rtpValue = parseFloat(rtpText.replace('%', ''));
                    const betType = cells[betTypeColumnIndex].textContent.trim();
                    if (!isNaN(rtpValue)) {
                        rtpData.push({ rtpValue, betType });
                    }
                }
            });
        }
    });

    return rtpData;
}

// Function to calculate min and max RTP from an array of objects with RTP values
function calculateMinMaxRTP(rtpValues) {
    if (rtpValues.length === 0) return { minRTP: '0.00', maxRTP: '0.00', minBetType: '', maxBetType: '' };

    // Extract RTP values for calculations
    const rtpNumbers = rtpValues.map(item => item.rtpValue);
    const minIndex = rtpNumbers.indexOf(Math.min(...rtpNumbers));
    const maxIndex = rtpNumbers.indexOf(Math.max(...rtpNumbers));

    // Retrieve bet types for the min and max RTPs
    return {
        minRTP: rtpNumbers[minIndex].toFixed(2),
        maxRTP: rtpNumbers[maxIndex].toFixed(2),
        minBetType: rtpValues[minIndex].betType,
        maxBetType: rtpValues[maxIndex].betType
    };
}

// Main function to fetch, parse, and display min and max RTPs for multiple games
async function displayMinMaxRTPs() {
    try {
        // Fetch the index.html file
        const response = await fetch('../');
        if (!response.ok) {
            throw new Error('Failed to fetch index.html');
        }

        // Parse the response as text and then as HTML
        const text = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');

        // Select all game links from the main game list
        const gameLinks = doc.querySelectorAll('#main-game-names .game-item a');
        const gameFiles = Array.from(gameLinks).map(link => link.getAttribute('href'));

        // Check if there are no game files found
        if (gameFiles.length === 0) {
            console.warn('No game files found in index.html.');
            return;
        }

        const gameData = [];

        // Fetch and process each game file
        for (const file of gameFiles) {
            try {
                // Fetch and parse each game file
                const gameDoc = await fetchAndParseHTML(`${file}`);
                // Extract RTP values
                const rtpValues = extractRTPValues(gameDoc);
                
                // If RTP values are found, process them
                if (rtpValues.length > 0) {
                    const gameName = gameDoc.querySelector('header h1').textContent.trim();
                    const { minRTP, maxRTP, minBetType, maxBetType } = calculateMinMaxRTP(rtpValues);
                    gameData.push({ gameName, minRTP, maxRTP, minBetType, maxBetType });
                } else {
                    console.warn(`No RTP values found for ${file}`);
                }
            } catch (error) {
                console.error(`Failed to process file ${file}:`, error);
            }
        }

        // Create a table and display the results
        createMinMaxRTPTable(gameData);
    } catch (error) {
        console.error('Error fetching or parsing index.html:', error);
    }
}

// Function to create and display the min/max RTP table with tooltips for bet types
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
                        <td title="Bet Type: ${row.minBetType}">${row.minRTP}%</td>
                        <td title="Bet Type: ${row.maxBetType}">${row.maxRTP}%</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <div id="buttons-container">
            <button id="home-button" onclick="location.href='../..'">Home</button>
            <button id="back-button" onclick="window.history.back()">Back</button>    
            <button id="reset-button" onclick="location.reload()">Reset</button>
        </div>
    `;
    document.body.appendChild(section);

    // Add sorting functionality to the newly created table
    const table = document.getElementById('min-max-rtp-table');
    if (typeof addSortingToTable === 'function') {
        addSortingToTable(table); // Call the function from scripts.js
    } else {
        console.error('addSortingToTable function is not defined.');
    }
}

// Function to redirect to the new page
function displayMainRTPs() {
    window.location.href = "static/rtpResults.html";
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
