document.addEventListener('DOMContentLoaded', () => {
    const menuSelect = document.getElementById('menu-select');
    const resetButton = document.getElementById('reset-button');
    const optionTables = document.querySelectorAll('.menu-filter');
    const sideBetsTable = document.getElementById('sideBets');
    const sideBetsTbody = document.getElementById('sideBets-tbody');
    const gameType = document.body.getAttribute('data-game');

    const searchInput = document.getElementById('search-input');
    const gameItems = document.querySelectorAll('.game-item');

    const path = window.location.pathname;
    const isIndexPage = path =='/';

    const sortingInitialized = new WeakSet();

    if (isIndexPage && searchInput) {
        searchInput.addEventListener('input', () => {
            const filter = searchInput.value.toLowerCase();

            gameItems.forEach(item => {
                const gameName = item.getAttribute('data-name').toLowerCase();
                if (gameName.includes(filter)) {
                    item.style.display = ''; // Show the item
                } else {
                    item.style.display = 'none'; // Hide the item
                }
            });
        });
    }

    if (isIndexPage) {
        gameItems.forEach(item => {
            item.addEventListener('click', () => {
                const url = item.getAttribute('data-url');
                if (url) {
                    window.location.href = url;
                }
            });
        });
    }

    if (menuSelect) {
        menuSelect.addEventListener('change', async (event) => {
            const selectedOption = event.target.value;

            // Filter main game tables
            filterMainGameTables(selectedOption);

            // Fetch and update side bets based on selected deck
            await updateSideBets(selectedOption);

        });

        filterMainGameTables(menuSelect.value);
        updateSideBets(menuSelect.value);
    }

    // Sort the main games and side bets lists
    if (isIndexPage) {
        sortListAlphabetically('main-game-names');
        sortListAlphabetically('side-bet-names');
    }

    if (resetButton) {
        resetButton.addEventListener('click', () => {
            location.reload();
        });
    }

    function sortListAlphabetically(listId) {
        const list = document.getElementById(listId);
        const items = Array.from(list.getElementsByTagName('li'));

        items.sort((a, b) => {
            const textA = a.textContent.trim().toUpperCase();
            const textB = b.textContent.trim().toUpperCase();
            return textA.localeCompare(textB);
        });

        // Remove all items and append them in sorted order
        list.innerHTML = '';
        items.forEach(item => list.appendChild(item));
    }

    function filterMainGameTables(selectedOption) {
        optionTables.forEach(table => {
            const optionValue = table.getAttribute('data-filter');
            table.style.display = (selectedOption === 'all' || selectedOption === optionValue) ? 'block' : 'none';
        });
    }


    async function updateSideBets(selectedOption) {
        
        if (!document.body.getAttribute('data-side-bets')) {
            return;
        }

        try {
            const sideBetFiles = document.body.getAttribute('data-side-bets').split(',');
            const mainGameFilters = document.querySelectorAll('.menu-filter'); // Get all filters from the main game

            console.log(mainGameFilters)
            sideBetsTbody.innerHTML = '';

            for (const file of sideBetFiles) {
                const response = await fetch(file.trim());
                const htmlText = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(htmlText, 'text/html');

                const sideBetHeader = doc.querySelector('header h1').textContent.trim();

                const sideBetsTableColumns = document.getElementById('sideBets');
                const columnsCount = sideBetsTableColumns ? sideBetsTableColumns.querySelector('thead tr').cells.length : 0;

                const sideBetsTables = doc.querySelectorAll('.menu-filter');
                const tablesToParse = sideBetsTable.length > 0 ? sideBetsTables : [doc];

                //console.log(tablesToParse)

                sideBetsTables.forEach(table => {
                    const deckValue = table.getAttribute('data-filter');
                    
                    // Check if the deckValue exists in the main game filters
                    const mainGameHasDeck = Array.from(mainGameFilters).some(mainFilter => {
                        return mainFilter.getAttribute('data-filter') === deckValue;
                    });

                    // Populate side bet data only if selectedOption matches and main game has the deck
                    if ((selectedOption === 'all' || selectedOption === deckValue) && mainGameHasDeck) {

                        const rows = table.querySelectorAll('tbody tr');

                        rows.forEach(row => {
                            const clonedRow = row.cloneNode(true);
                            
                            const betTypeCell = clonedRow.querySelector('td:first-child');
                            betTypeCell.textContent = `${sideBetHeader} - ${betTypeCell.textContent}`;
    
                            if (columnsCount === 4) {
                                const deckCell = document.createElement('td');
                                deckCell.textContent = deckValue;
                                clonedRow.insertBefore(deckCell, clonedRow.querySelector('td:nth-child(2)'));
                            }

                            const cells = clonedRow.querySelectorAll('td');

                            cells.forEach((cell, index) => {
                                cell.classList.add(`column-${index + 1}`);
                            }); 

                            //console.log(clonedRow)

                            sideBetsTbody.appendChild(clonedRow);
                        });
                   
                    }
                });
            }
            
            addSortingToTable(sideBetsTable);

        } catch (error) {
            console.error('Error fetching or processing side bets data:', error);
        }      
    }

    function addSortingToTable(table) {

        if (sortingInitialized.has(table)) return; // Avoid re-initializing

        sortingInitialized.add(table); // Mark this table as initialized

        const tbody = table.querySelector('tbody');
        const rows = tbody ? tbody.querySelectorAll('tr') : [];
    
        // Skip sorting if there's only one row or no rows
        if (rows.length <= 1 && tbody.id != 'sideBets-tbody') return;
        
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

            if (dataType === 'rtp' || dataType === 'houseEdge') {
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

    // Apply sorting to all tables, regardless of deck-table attribute
    const allTables = document.querySelectorAll('table');
    allTables.forEach(table => {
        addSortingToTable(table);
    });


});

