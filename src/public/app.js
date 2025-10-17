// Initialize Socket.IO connection
const socket = io();

// Global variables
let currentDatabase = null;
let currentTable = null;
let currentPage = 1;
let totalPages = 1;
let pageSize = 100;
let isConnected = false;
let currentSortColumn = null;
let currentSortDirection = 'ASC';
let currentSearchColumn = null;
let currentSearchValue = null;
let currentCredentials = null;

// DOM Elements
const connectionForm = document.getElementById('connectionForm');
const connectionPanel = document.getElementById('connectionPanel');
const mainInterface = document.getElementById('mainInterface');
const connectionStatus = document.getElementById('connectionStatus');
const disconnectBtn = document.getElementById('disconnectBtn');
const logoutBtn = document.getElementById('logoutBtn');
const databaseList = document.getElementById('databaseList');
const tableList = document.getElementById('tableList');
const dataTable = document.getElementById('dataTable');
const structureTable = document.getElementById('structureTable');
const indexesTable = document.getElementById('indexesTable');
const selectedTableSpan = document.getElementById('selectedTable');
const pageInfo = document.getElementById('pageInfo');
const sqlQuery = document.getElementById('sqlQuery');
const queryResults = document.getElementById('queryResults');
const queryDatabase = document.getElementById('queryDatabase');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    setupSocketListeners();
    restoreSessionCredentials();
});

function setupEventListeners() {
    // Connection form
    connectionForm.addEventListener('submit', handleConnection);
    disconnectBtn.addEventListener('click', handleDisconnection);
    logoutBtn.addEventListener('click', handleLogout);

    // Database operations
    document.getElementById('refreshDatabases').addEventListener('click', loadDatabases);
    document.getElementById('createDatabase').addEventListener('click', showCreateDatabaseModal);
    document.getElementById('refreshTables').addEventListener('click', loadTables);

    // Pagination
    document.getElementById('prevPage').addEventListener('click', () => changePage(-1));
    document.getElementById('nextPage').addEventListener('click', () => changePage(1));
    document.getElementById('pageSize').addEventListener('change', changePageSize);

    // Search functionality
    document.getElementById('searchBtn').addEventListener('click', performSearch);
    document.getElementById('clearSearchBtn').addEventListener('click', clearSearch);
    document.getElementById('searchValue').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    // Search and sort
    document.getElementById('searchBtn').addEventListener('click', performSearch);
    document.getElementById('clearSearchBtn').addEventListener('click', clearSearch);
    document.getElementById('searchValue').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    // Tab switching
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', (e) => switchTab(e.target.dataset.tab));
    });

    // Query execution
    document.getElementById('executeQuery').addEventListener('click', executeQuery);
    document.getElementById('clearQuery').addEventListener('click', () => {
        sqlQuery.value = '';
        queryResults.innerHTML = '<p>No query executed yet.</p>';
    });

    // Create database form
    document.getElementById('createDatabaseForm').addEventListener('submit', createDatabase);

    // Alter table forms
    document.getElementById('addColumnForm').addEventListener('submit', addColumn);
    document.getElementById('dropColumnForm').addEventListener('submit', dropColumn);
    document.getElementById('modifyColumnForm').addEventListener('submit', modifyColumn);
    document.getElementById('addIndexForm').addEventListener('submit', addIndex);
    document.getElementById('customAlterForm').addEventListener('submit', executeCustomAlter);
    document.getElementById('dropTableBtn').addEventListener('click', dropTable);
}

function setupSocketListeners() {
    socket.on('connection_success', (data) => {
        isConnected = true;
        updateConnectionStatus(true);
        showNotification('Connected to database successfully!', 'success');
        showMainInterface();
        loadDatabases();
        
        // Store credentials in session
        if (currentCredentials) {
            fetch('/store-credentials', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: currentCredentials.user,
                    password: currentCredentials.password
                })
            });
        }
    });

    socket.on('connection_error', (data) => {
        showNotification(data.message, 'error');
        updateConnectionStatus(false);
    });

    socket.on('disconnection_success', (data) => {
        isConnected = false;
        updateConnectionStatus(false);
        showNotification('Disconnected from database', 'info');
        showConnectionPanel();
    });

    socket.on('databases_list', (databases) => {
        populateDatabaseList(databases);
        populateQueryDatabaseSelect(databases);
    });

    socket.on('tables_list', (data) => {
        populateTableList(data.tables);
        currentDatabase = data.database;
    });

    socket.on('table_structure', (data) => {
        populateTableStructure(data.structure);
    });

    socket.on('table_data', (data) => {
        populateTableData(data);
        updatePagination(data);
    });

    socket.on('query_result', (data) => {
        displayQueryResult(data);
    });

    socket.on('database_created', (data) => {
        showNotification(data.message, 'success');
        closeModal('createDatabaseModal');
        loadDatabases();
    });

    socket.on('database_dropped', (data) => {
        showNotification(data.message, 'success');
        loadDatabases();
    });

    socket.on('table_altered', (data) => {
        showNotification(data.message, 'success');
        loadTableStructure();
        loadTableIndexes();
        loadTables(); // Refresh tables list in case table was renamed
    });

    socket.on('table_indexes', (data) => {
        populateTableIndexes(data.indexes);
    });

    socket.on('table_dropped', (data) => {
        showNotification(data.message, 'success');
        clearTableData();
        loadTables(); // Refresh tables list
    });

    socket.on('error', (data) => {
        showNotification(data.message, 'error');
    });
}

function handleConnection(e) {
    e.preventDefault();
    const formData = new FormData(connectionForm);
    const credentials = {
        host: formData.get('host'),
        port: parseInt(formData.get('port')),
        user: formData.get('user'),
        password: formData.get('password')
    };
    currentCredentials = credentials;
    socket.emit('connect_database', credentials);
    showNotification('Connecting to database...', 'info');
}

function handleDisconnection() {
    socket.emit('disconnect_database');
}

function updateConnectionStatus(connected) {
    const indicator = connectionStatus.querySelector('.status-indicator');
    const text = connectionStatus.querySelector('span:last-child');
    
    if (connected) {
        indicator.className = 'status-indicator connected';
        text.textContent = 'Connected';
        disconnectBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'inline-block';
    } else {
        indicator.className = 'status-indicator disconnected';
        text.textContent = 'Disconnected';
        disconnectBtn.style.display = 'none';
        logoutBtn.style.display = 'none';
    }
}

function showMainInterface() {
    connectionPanel.style.display = 'none';
    mainInterface.style.display = 'flex';
}

function showConnectionPanel() {
    connectionPanel.style.display = 'block';
    mainInterface.style.display = 'none';
    logoutBtn.style.display = 'none';
    
    // Reset interface
    currentDatabase = null;
    currentTable = null;
    databaseList.innerHTML = '';
    tableList.innerHTML = '';
    dataTable.querySelector('thead').innerHTML = '';
    dataTable.querySelector('tbody').innerHTML = '';
}

function loadDatabases() {
    if (!isConnected) return;
    socket.emit('get_databases');
}

function loadTables() {
    if (!isConnected || !currentDatabase) return;
    socket.emit('get_tables', currentDatabase);
}

function populateDatabaseList(databases) {
    databaseList.innerHTML = '';
    
    databases.forEach(database => {
        const li = document.createElement('li');
        li.textContent = database;
        li.addEventListener('click', () => selectDatabase(database, li));
        databaseList.appendChild(li);
    });
}

function populateQueryDatabaseSelect(databases) {
    const currentValue = queryDatabase.value;
    queryDatabase.innerHTML = '<option value="">Select Database</option>';
    
    databases.forEach(database => {
        const option = document.createElement('option');
        option.value = database;
        option.textContent = database;
        queryDatabase.appendChild(option);
    });
    
    if (currentValue) {
        queryDatabase.value = currentValue;
    }
}

function selectDatabase(database, element) {
    // Update UI
    document.querySelectorAll('.database-list li').forEach(li => li.classList.remove('active'));
    element.classList.add('active');
    
    currentDatabase = database;
    currentTable = null;
    
    // Clear table list and data
    tableList.innerHTML = '';
    clearTableData();
    
    // Load tables for this database
    socket.emit('get_tables', database);
}

function populateTableList(tables) {
    tableList.innerHTML = '';
    
    tables.forEach(table => {
        const li = document.createElement('li');
        li.textContent = table;
        li.addEventListener('click', () => selectTable(table, li));
        tableList.appendChild(li);
    });
}

function selectTable(table, element) {
    // Update UI
    document.querySelectorAll('.table-list li').forEach(li => li.classList.remove('active'));
    element.classList.add('active');
    
    currentTable = table;
    selectedTableSpan.textContent = `${currentDatabase}.${table}`;
    
    // Reset pagination
    currentPage = 1;
    
    // Load table data, structure, and indexes
    loadTableData();
    loadTableStructure();
    loadTableIndexes();
    populateAlterFormColumns();
}

function loadTableData() {
    if (!currentDatabase || !currentTable) return;
    
    const offset = (currentPage - 1) * pageSize;
    socket.emit('get_table_data', {
        database: currentDatabase,
        table: currentTable,
        limit: pageSize,
        offset: offset,
        sortColumn: currentSortColumn,
        sortDirection: currentSortDirection,
        searchColumn: currentSearchColumn,
        searchValue: currentSearchValue
    });
}

function loadTableStructure() {
    if (!currentDatabase || !currentTable) return;
    
    socket.emit('get_table_structure', {
        database: currentDatabase,
        table: currentTable
    });
}

function loadTableIndexes() {
    if (!currentDatabase || !currentTable) return;
    
    socket.emit('get_table_indexes', {
        database: currentDatabase,
        table: currentTable
    });
}

function populateTableIndexes(indexes) {
    const tbody = indexesTable.querySelector('tbody');
    tbody.innerHTML = '';
    
    indexes.forEach(index => {
        const tr = document.createElement('tr');
        
        const keyName = document.createElement('td');
        keyName.textContent = index.Key_name;
        tr.appendChild(keyName);
        
        const column = document.createElement('td');
        column.textContent = index.Column_name;
        tr.appendChild(column);
        
        const unique = document.createElement('td');
        unique.textContent = index.Non_unique === 0 ? 'Yes' : 'No';
        tr.appendChild(unique);
        
        const type = document.createElement('td');
        type.textContent = index.Index_type;
        tr.appendChild(type);
        
        const cardinality = document.createElement('td');
        cardinality.textContent = index.Cardinality || '';
        tr.appendChild(cardinality);
        
        tbody.appendChild(tr);
    });
}

function populateAlterFormColumns() {
    if (!currentDatabase || !currentTable) return;
    
    // Get current table structure
    socket.emit('get_table_structure', {
        database: currentDatabase,
        table: currentTable
    });
}

function updateAlterFormColumns(structure) {
    const dropColumnSelect = document.getElementById('dropColumnName');
    const modifyColumnSelect = document.getElementById('modifyColumnName');
    const indexColumnsSelect = document.getElementById('newIndexColumns');
    
    // Clear existing options
    dropColumnSelect.innerHTML = '<option value="">Select Column</option>';
    modifyColumnSelect.innerHTML = '<option value="">Select Column</option>';
    indexColumnsSelect.innerHTML = '';
    
    structure.forEach(field => {
        const dropOption = document.createElement('option');
        dropOption.value = field.Field;
        dropOption.textContent = field.Field;
        dropColumnSelect.appendChild(dropOption);
        
        const modifyOption = document.createElement('option');
        modifyOption.value = field.Field;
        modifyOption.textContent = `${field.Field} (${field.Type})`;
        modifyColumnSelect.appendChild(modifyOption);
        
        const indexOption = document.createElement('option');
        indexOption.value = field.Field;
        indexOption.textContent = field.Field;
        indexColumnsSelect.appendChild(indexOption);
    });
}

function addColumn(e) {
    e.preventDefault();
    
    const columnName = document.getElementById('newColumnName').value.trim();
    const columnType = document.getElementById('newColumnType').value;
    const allowNull = document.getElementById('newColumnNull').checked;
    const defaultValue = document.getElementById('newColumnDefault').value.trim();
    const position = document.getElementById('newColumnPosition').value;
    
    if (!columnName || !columnType) {
        showNotification('Please fill in column name and type', 'error');
        return;
    }
    
    let alterQuery = `ALTER TABLE \`${currentTable}\` ADD COLUMN \`${columnName}\` ${columnType}`;
    
    if (!allowNull) {
        alterQuery += ' NOT NULL';
    }
    
    if (defaultValue) {
        alterQuery += ` DEFAULT '${defaultValue}'`;
    }
    
    if (position === 'FIRST') {
        alterQuery += ' FIRST';
    }
    
    socket.emit('alter_table', {
        database: currentDatabase,
        table: currentTable,
        alterQuery: alterQuery
    });
    
    // Clear form
    document.getElementById('addColumnForm').reset();
}

function dropColumn(e) {
    e.preventDefault();
    
    const columnName = document.getElementById('dropColumnName').value;
    
    if (!columnName) {
        showNotification('Please select a column to drop', 'error');
        return;
    }
    
    if (!confirm(`Are you sure you want to drop column '${columnName}'? This action cannot be undone.`)) {
        return;
    }
    
    const alterQuery = `ALTER TABLE \`${currentTable}\` DROP COLUMN \`${columnName}\``;
    
    socket.emit('alter_table', {
        database: currentDatabase,
        table: currentTable,
        alterQuery: alterQuery
    });
    
    // Clear form
    document.getElementById('dropColumnForm').reset();
}

function modifyColumn(e) {
    e.preventDefault();
    
    const columnName = document.getElementById('modifyColumnName').value;
    const columnType = document.getElementById('modifyColumnType').value;
    const allowNull = document.getElementById('modifyColumnNull').checked;
    const defaultValue = document.getElementById('modifyColumnDefault').value.trim();
    
    if (!columnName || !columnType) {
        showNotification('Please select column and specify new type', 'error');
        return;
    }
    
    let alterQuery = `ALTER TABLE \`${currentTable}\` MODIFY COLUMN \`${columnName}\` ${columnType}`;
    
    if (!allowNull) {
        alterQuery += ' NOT NULL';
    }
    
    if (defaultValue) {
        alterQuery += ` DEFAULT '${defaultValue}'`;
    }
    
    socket.emit('alter_table', {
        database: currentDatabase,
        table: currentTable,
        alterQuery: alterQuery
    });
    
    // Clear form
    document.getElementById('modifyColumnForm').reset();
}

function addIndex(e) {
    e.preventDefault();
    
    const indexName = document.getElementById('newIndexName').value.trim();
    const selectedColumns = Array.from(document.getElementById('newIndexColumns').selectedOptions)
        .map(option => option.value);
    const indexType = document.getElementById('newIndexType').value;
    
    if (!indexName || selectedColumns.length === 0) {
        showNotification('Please specify index name and select columns', 'error');
        return;
    }
    
    const columnsStr = selectedColumns.map(col => `\`${col}\``).join(', ');
    let alterQuery;
    
    if (indexType === 'UNIQUE') {
        alterQuery = `ALTER TABLE \`${currentTable}\` ADD UNIQUE KEY \`${indexName}\` (${columnsStr})`;
    } else if (indexType === 'FULLTEXT') {
        alterQuery = `ALTER TABLE \`${currentTable}\` ADD FULLTEXT KEY \`${indexName}\` (${columnsStr})`;
    } else {
        alterQuery = `ALTER TABLE \`${currentTable}\` ADD KEY \`${indexName}\` (${columnsStr})`;
    }
    
    socket.emit('alter_table', {
        database: currentDatabase,
        table: currentTable,
        alterQuery: alterQuery
    });
    
    // Clear form
    document.getElementById('addIndexForm').reset();
}

function executeCustomAlter(e) {
    e.preventDefault();
    
    const customQuery = document.getElementById('customAlterQuery').value.trim();
    
    if (!customQuery) {
        showNotification('Please enter an ALTER statement', 'error');
        return;
    }
    
    socket.emit('alter_table', {
        database: currentDatabase,
        table: currentTable,
        alterQuery: customQuery
    });
    
    // Clear form
    document.getElementById('customAlterForm').reset();
}

function dropTable() {
    if (!currentTable || !currentDatabase) {
        showNotification('No table selected', 'error');
        return;
    }
    
    const confirmation = prompt(`Type '${currentTable}' to confirm dropping this table:`);
    if (confirmation !== currentTable) {
        showNotification('Table name confirmation failed', 'error');
        return;
    }
    
    socket.emit('drop_table', {
        database: currentDatabase,
        table: currentTable
    });
}

function populateTableData(data) {
    const thead = dataTable.querySelector('thead');
    const tbody = dataTable.querySelector('tbody');
    
    // Clear existing data
    thead.innerHTML = '';
    tbody.innerHTML = '';
    
    // Debug logging
    console.log('Table data received:', data);
    
    // Check if data exists and has the expected structure
    if (!data || !data.data) {
        tbody.innerHTML = '<tr><td colspan="100%">No data structure received</td></tr>';
        return;
    }
    
    if (data.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="100%">No data found</td></tr>';
        return;
    }
    
    // Check if first row exists and is an object
    if (!data.data[0] || typeof data.data[0] !== 'object') {
        tbody.innerHTML = '<tr><td colspan="100%">Invalid data format received</td></tr>';
        console.error('Invalid data format:', data.data[0]);
        return;
    }
    
    // Create header with sorting functionality
    const headerRow = document.createElement('tr');
    const columns = Object.keys(data.data[0]);
    
    columns.forEach(column => {
        const th = document.createElement('th');
        th.className = 'sortable-header';
        th.textContent = column;
        th.setAttribute('data-column', column);
        
        // Add sort indicator if this column is currently sorted
        if (data.sortColumn === column) {
            const indicator = document.createElement('span');
            indicator.className = `sort-indicator ${data.sortDirection.toLowerCase()}`;
            th.appendChild(indicator);
        }
        
        // Add click handler for sorting
        th.addEventListener('click', () => sortByColumn(column));
        
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    
    // Update search column dropdown
    updateSearchColumns(columns);

    // Create data rows
    data.data.forEach(row => {
        const tr = document.createElement('tr');
        
        // Add row copy button
        const rowCopyBtn = document.createElement('button');
        rowCopyBtn.className = 'row-copy-btn';
        rowCopyBtn.innerHTML = '📄';
        rowCopyBtn.title = 'Copy entire row';
        rowCopyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            copyRowData(row, e.target);
        });
        tr.appendChild(rowCopyBtn);
        
        columns.forEach(column => {
            const td = document.createElement('td');
            const value = row[column];
            
            // Handle null values
            if (value === null) {
                td.textContent = 'NULL';
                td.style.fontStyle = 'italic';
                td.style.color = '#888';
                td.className = 'data-cell';
            } else {
                const stringValue = String(value);
                
                // Determine content type and apply appropriate styling
                if (typeof value === 'number') {
                    td.textContent = stringValue;
                    td.className = 'data-cell numeric-content';
                } else if (stringValue.length > 100) {
                    // Long text content - show truncated with full text in title
                    td.className = 'data-cell long-text';
                    td.textContent = stringValue.substring(0, 100) + '...';
                    td.title = stringValue; // Show full text on hover
                } else if (stringValue.includes('\n') || stringValue.includes('\t')) {
                    // Multi-line or formatted content
                    td.textContent = stringValue;
                    td.className = 'data-cell text-content';
                } else if (/^[A-Z_][A-Z0-9_]*$/i.test(stringValue) && stringValue.length > 10) {
                    // Looks like code/identifiers
                    td.textContent = stringValue;
                    td.className = 'data-cell code-content';
                } else {
                    // Regular text content
                    td.textContent = stringValue;
                    td.className = 'data-cell text-content';
                }
            }
            
            // Add cell copy button
            const cellCopyBtn = document.createElement('button');
            cellCopyBtn.className = 'cell-copy-btn';
            cellCopyBtn.innerHTML = '📋';
            cellCopyBtn.title = 'Copy cell data';
            cellCopyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                copyCellData(value, e.target);
            });
            td.appendChild(cellCopyBtn);
            
            tr.appendChild(td);
        });
        
        tbody.appendChild(tr);
    });
    
    // Show search info if search is active
    updateSearchInfo(data);
    
    // Check if table is horizontally scrollable and add indicator
    addScrollIndicator(dataTable.closest('.table-container'));
}

function addScrollIndicator(tableContainer) {
    if (!tableContainer) return;
    
    // Remove existing indicator
    const existingIndicator = tableContainer.querySelector('.scroll-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    // Check if content is wider than container
    const table = tableContainer.querySelector('table');
    if (table && table.scrollWidth > tableContainer.clientWidth) {
        tableContainer.classList.add('scrollable');
        
        // Create scroll indicator element
        const indicator = document.createElement('div');
        indicator.className = 'scroll-indicator';
        indicator.textContent = '↔ Scroll horizontally to view all columns';
        
        // Position the indicator relative to the container
        tableContainer.style.position = 'relative';
        tableContainer.appendChild(indicator);
        
        // Auto-hide after 4 seconds
        setTimeout(() => {
            if (indicator.parentElement) {
                indicator.style.transition = 'opacity 0.5s ease-out';
                indicator.style.opacity = '0';
                setTimeout(() => {
                    if (indicator.parentElement) {
                        indicator.remove();
                    }
                }, 500);
            }
        }, 4000);
        
        // Add scroll listener to show progress indicator
        let scrollTimeout;
        tableContainer.addEventListener('scroll', (e) => {
            // Clear existing timeout
            if (scrollTimeout) {
                clearTimeout(scrollTimeout);
            }
            
            // Show scroll progress if user is scrolling horizontally
            if (e.target.scrollLeft > 0) {
                showScrollProgress(tableContainer, e.target.scrollLeft, e.target.scrollWidth - e.target.clientWidth);
            }
            
            // Hide progress after scrolling stops
            scrollTimeout = setTimeout(() => {
                hideScrollProgress(tableContainer);
            }, 1000);
        });
        
    } else {
        tableContainer.classList.remove('scrollable');
    }
}

function showScrollProgress(container, scrollLeft, maxScroll) {
    let progressBar = container.querySelector('.scroll-progress');
    
    if (!progressBar) {
        progressBar = document.createElement('div');
        progressBar.className = 'scroll-progress';
        progressBar.innerHTML = `
            <div class="scroll-progress-bar">
                <div class="scroll-progress-fill"></div>
            </div>
            <div class="scroll-progress-text">Scrolling...</div>
        `;
        container.appendChild(progressBar);
        
        // Add CSS for progress bar if not exists
        if (!document.querySelector('#scroll-progress-styles')) {
            const style = document.createElement('style');
            style.id = 'scroll-progress-styles';
            style.textContent = `
                .scroll-progress {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: rgba(0,0,0,0.8);
                    color: white;
                    padding: 6px 10px;
                    border-radius: 16px;
                    font-size: 10px;
                    z-index: 1000;
                    min-width: 80px;
                    text-align: center;
                }
                .scroll-progress-bar {
                    width: 60px;
                    height: 3px;
                    background: rgba(255,255,255,0.3);
                    border-radius: 2px;
                    margin: 4px auto 2px;
                    overflow: hidden;
                }
                .scroll-progress-fill {
                    height: 100%;
                    background: #007bff;
                    border-radius: 2px;
                    transition: width 0.1s ease;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Update progress
    const progressPercentage = (scrollLeft / maxScroll) * 100;
    const fill = progressBar.querySelector('.scroll-progress-fill');
    fill.style.width = progressPercentage + '%';
    
    progressBar.style.opacity = '1';
}

function hideScrollProgress(container) {
    const progressBar = container.querySelector('.scroll-progress');
    if (progressBar) {
        progressBar.style.opacity = '0';
        setTimeout(() => {
            if (progressBar.parentElement) {
                progressBar.remove();
            }
        }, 300);
    }
}

function updateSearchColumns(columns) {
    const searchColumnSelect = document.getElementById('searchColumn');
    const currentValue = searchColumnSelect.value;
    
    searchColumnSelect.innerHTML = '<option value="">Search Column</option>';
    
    columns.forEach(column => {
        const option = document.createElement('option');
        option.value = column;
        option.textContent = column;
        searchColumnSelect.appendChild(option);
    });
    
    if (currentValue && columns.includes(currentValue)) {
        searchColumnSelect.value = currentValue;
    }
}

function updateSearchInfo(data) {
    // Remove existing search info
    const existingInfo = document.querySelector('.search-info');
    if (existingInfo) {
        existingInfo.remove();
    }
    
    // Add search info if search is active
    if (data.searchColumn && data.searchValue) {
        const searchInfo = document.createElement('div');
        searchInfo.className = 'search-info';
        searchInfo.textContent = `Showing results for "${data.searchValue}" in column "${data.searchColumn}" (${data.total} matches)`;
        
        const dataControls = document.querySelector('.data-controls');
        dataControls.insertAdjacentElement('afterend', searchInfo);
    }
}

function sortByColumn(column) {
    if (currentSortColumn === column) {
        // Toggle sort direction
        currentSortDirection = currentSortDirection === 'ASC' ? 'DESC' : 'ASC';
    } else {
        // New column, default to ASC
        currentSortColumn = column;
        currentSortDirection = 'ASC';
    }
    
    // Reset to first page when sorting
    currentPage = 1;
    loadTableData();
}

function performSearch() {
    const searchColumn = document.getElementById('searchColumn').value;
    const searchValue = document.getElementById('searchValue').value.trim();
    
    if (!searchColumn && searchValue) {
        showNotification('Please select a column to search in', 'error');
        return;
    }
    
    if (searchColumn && !searchValue) {
        showNotification('Please enter a search value', 'error');
        return;
    }
    
    currentSearchColumn = searchColumn || null;
    currentSearchValue = searchValue || null;
    currentPage = 1; // Reset to first page when searching
    
    // Update search input styling
    const searchInput = document.getElementById('searchValue');
    if (searchValue) {
        searchInput.classList.add('search-active');
    } else {
        searchInput.classList.remove('search-active');
    }
    
    loadTableData();
}

function clearSearch() {
    document.getElementById('searchColumn').value = '';
    document.getElementById('searchValue').value = '';
    document.getElementById('searchValue').classList.remove('search-active');
    
    currentSearchColumn = null;
    currentSearchValue = null;
    currentPage = 1;
    
    // Remove search info
    const existingInfo = document.querySelector('.search-info');
    if (existingInfo) {
        existingInfo.remove();
    }
    
    loadTableData();
}

function populateTableStructure(structure) {
    const tbody = structureTable.querySelector('tbody');
    tbody.innerHTML = '';
    
    structure.forEach(field => {
        const tr = document.createElement('tr');
        
        // Add row copy button
        const rowCopyBtn = document.createElement('button');
        rowCopyBtn.className = 'row-copy-btn';
        rowCopyBtn.innerHTML = '📄';
        rowCopyBtn.title = 'Copy entire row';
        rowCopyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            copyRowData(field, e.target);
        });
        tr.appendChild(rowCopyBtn);
        
        ['Field', 'Type', 'Null', 'Key', 'Default', 'Extra'].forEach((prop, index) => {
            const td = document.createElement('td');
            const value = field[prop];
            
            if (value === null || value === '') {
                td.textContent = '';
                td.style.color = '#888';
            } else {
                const stringValue = String(value);
                
                // Apply specific styling based on column type
                switch (index) {
                    case 0: // Field name
                        td.textContent = stringValue;
                        td.className = 'code-content';
                        break;
                    case 1: // Type
                        td.textContent = stringValue;
                        td.className = 'code-content';
                        if (stringValue.length > 50) {
                            td.className += ' long-text';
                            td.title = stringValue; // Show full text on hover
                        }
                        break;
                    case 4: // Default
                        if (stringValue.length > 30) {
                            td.className = 'long-text';
                            td.textContent = stringValue.substring(0, 30) + '...';
                            td.title = stringValue; // Show full text on hover
                        } else {
                            td.textContent = stringValue;
                            td.className = 'text-content';
                        }
                        break;
                    default:
                        td.textContent = stringValue;
                        td.className = 'text-content';
                }
            }
            
            // Add cell copy button
            const cellCopyBtn = document.createElement('button');
            cellCopyBtn.className = 'cell-copy-btn';
            cellCopyBtn.innerHTML = '📋';
            cellCopyBtn.title = 'Copy cell data';
            cellCopyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                copyCellData(value, e.target);
            });
            td.appendChild(cellCopyBtn);
            
            tr.appendChild(td);
        });
        
        tbody.appendChild(tr);
    });
    
    // Update alter form columns
    updateAlterFormColumns(structure);
    
    // Add scroll indicator if needed
    addScrollIndicator(structureTable.closest('.table-container'));
}

function updatePagination(data) {
    totalPages = Math.ceil(data.total / data.limit);
    pageInfo.textContent = `Page ${currentPage} of ${totalPages} (${data.total} total rows)`;
    
    document.getElementById('prevPage').disabled = currentPage <= 1;
    document.getElementById('nextPage').disabled = currentPage >= totalPages;
}

function changePage(direction) {
    const newPage = currentPage + direction;
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        loadTableData();
    }
}

function changePageSize() {
    pageSize = parseInt(document.getElementById('pageSize').value);
    currentPage = 1;
    loadTableData();
}

function clearTableData() {
    dataTable.querySelector('thead').innerHTML = '';
    dataTable.querySelector('tbody').innerHTML = '';
    structureTable.querySelector('tbody').innerHTML = '';
    selectedTableSpan.textContent = 'Select a table to view data';
}

function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`${tabName}Tab`).classList.add('active');
}

function executeQuery() {
    const query = sqlQuery.value.trim();
    const database = queryDatabase.value;
    
    if (!query) {
        showNotification('Please enter a SQL query', 'error');
        return;
    }
    
    socket.emit('execute_query', { database, query });
    queryResults.innerHTML = '<p>Executing query...</p>';
}

function displayQueryResult(data) {
    const { query, result } = data;
    
    let html = `<div class="query-info"><strong>Query:</strong> ${query}</div>`;
    
    if (result.type === 'SELECT') {
        if (result.multipleStatements) {
            // Handle multiple SELECT statements
            html += `<p><strong>Multiple statements executed:</strong> ${result.data.length}</p>`;
            html += `<p><strong>Total rows returned:</strong> ${result.rowCount}</p>`;
            
            result.data.forEach((statementResult, index) => {
                html += `<div class="statement-result">`;
                html += `<h4>Statement ${index + 1}: ${statementResult.statement}</h4>`;
                
                if (statementResult.data.length === 0) {
                    html += '<p>No results found.</p>';
                } else {
                    html += `<p><strong>Rows:</strong> ${statementResult.rowCount}</p>`;
                    html += '<div class="table-container"><table>';
                    
                    // Header
                    const columns = Object.keys(statementResult.data[0]);
                    html += '<thead><tr>';
                    columns.forEach(col => {
                        html += `<th>${col}</th>`;
                    });
                    html += '</tr></thead>';
                    
                    // Data
                    html += '<tbody>';
                    statementResult.data.forEach(row => {
                        html += '<tr>';
                        columns.forEach(col => {
                            const value = row[col];
                            if (value === null) {
                                html += '<td class="data-cell" style="font-style: italic; color: #888;"><em>NULL</em></td>';
                            } else {
                                const stringValue = String(value);
                                let cellClass = 'data-cell';
                                let displayValue = stringValue;
                                
                                if (typeof value === 'number') {
                                    cellClass += ' numeric-content';
                                } else if (stringValue.length > 100) {
                                    cellClass += ' long-text';
                                    displayValue = stringValue.substring(0, 100) + '...';
                                    html += `<td class="${cellClass}" title="${stringValue.replace(/"/g, '&quot;')}" data-cell-value="${stringValue.replace(/"/g, '&quot;')}">${displayValue}<button class="cell-copy-btn">📋</button></td>`;
                                } else if (stringValue.includes('\n') || stringValue.includes('\t')) {
                                    cellClass += ' text-content';
                                    html += `<td class="${cellClass}" data-cell-value="${stringValue.replace(/"/g, '&quot;')}">${displayValue}<button class="cell-copy-btn">📋</button></td>`;
                                } else {
                                    cellClass += ' text-content';
                                    html += `<td class="${cellClass}" data-cell-value="${stringValue.replace(/"/g, '&quot;')}">${displayValue}<button class="cell-copy-btn">📋</button></td>`;
                                }
                            }
                        });
                        html += '</tr>';
                    });
                    html += '</tbody></table></div>';
                }
                html += `</div>`;
            });
        } else {
            // Handle single SELECT statement
            if (result.data.length === 0) {
                html += '<p>No results found.</p>';
            } else {
                html += `<p><strong>Rows returned:</strong> ${result.rowCount}</p>`;
                html += '<div class="table-container"><table>';
                
                // Header
                const columns = Object.keys(result.data[0]);
                html += '<thead><tr>';
                columns.forEach(col => {
                    html += `<th>${col}</th>`;
                });
                html += '</tr></thead>';
                
                // Data
                html += '<tbody>';
                result.data.forEach(row => {
                    html += '<tr>';
                    columns.forEach(col => {
                        const value = row[col];
                        if (value === null) {
                            html += '<td class="data-cell" style="font-style: italic; color: #888;"><em>NULL</em></td>';
                        } else {
                            const stringValue = String(value);
                            let cellClass = 'data-cell';
                            let displayValue = stringValue;
                            
                            if (typeof value === 'number') {
                                cellClass += ' numeric-content';
                                html += `<td class="${cellClass}" data-cell-value="${displayValue}">${displayValue}<button class="cell-copy-btn">📋</button></td>`;
                            } else if (stringValue.length > 100) {
                                cellClass += ' long-text';
                                displayValue = stringValue.substring(0, 100) + '...';
                                html += `<td class="${cellClass}" title="${stringValue.replace(/"/g, '&quot;')}" data-cell-value="${stringValue.replace(/"/g, '&quot;')}">${displayValue}<button class="cell-copy-btn">📋</button></td>`;
                            } else if (stringValue.includes('\n') || stringValue.includes('\t')) {
                                cellClass += ' text-content';
                                html += `<td class="${cellClass}" data-cell-value="${stringValue.replace(/"/g, '&quot;')}">${displayValue}<button class="cell-copy-btn">📋</button></td>`;
                            } else {
                                cellClass += ' text-content';
                                html += `<td class="${cellClass}" data-cell-value="${stringValue.replace(/"/g, '&quot;')}">${displayValue}<button class="cell-copy-btn">📋</button></td>`;
                            }
                        }
                    });
                    html += '</tr>';
                });
                html += '</tbody></table></div>';
            }
        }
    } else {
        html += `<p><strong>Affected rows:</strong> ${result.affectedRows}</p>`;
        if (result.insertId) {
            html += `<p><strong>Insert ID:</strong> ${result.insertId}</p>`;
        }
        html += `<p class="success-message">${result.message}</p>`;
        
        // Refresh data if we're viewing a table and it might have been affected
        if (currentTable && currentDatabase) {
            loadTableData();
        }
    }
    
    queryResults.innerHTML = html;
    
    // Add event listeners for copy buttons in query results
    queryResults.querySelectorAll('.cell-copy-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const td = e.target.closest('td');
            const cellValue = td.getAttribute('data-cell-value') || td.textContent.replace('📋', '').trim();
            copyCellData(cellValue, e.target);
        });
    });
}

function showCreateDatabaseModal() {
    document.getElementById('createDatabaseModal').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    // Clear form if it exists
    const form = document.querySelector(`#${modalId} form`);
    if (form) {
        form.reset();
    }
}

function createDatabase(e) {
    e.preventDefault();
    
    const databaseName = document.getElementById('newDatabaseName').value.trim();
    if (!databaseName) {
        showNotification('Please enter a database name', 'error');
        return;
    }
    
    socket.emit('create_database', databaseName);
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.getElementById('notifications').appendChild(notification);
    
    // Trigger animation
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});

// Handle keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl+Enter to execute query
    if (e.ctrlKey && e.key === 'Enter' && document.activeElement === sqlQuery) {
        executeQuery();
    }
    
    // Escape to close modals
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }
});
function handleLogout() {
    // Disconnect from database if connected
    if (isConnected) {
        socket.emit('disconnect_database');
    }
    
    fetch('/logout', { method: 'POST' })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                // Reset UI state
                mainInterface.style.display = 'none';
                connectionPanel.style.display = '';
                logoutBtn.style.display = 'none';
                disconnectBtn.style.display = 'none';
                connectionStatus.innerHTML = '<span class="status-indicator disconnected"></span><span>Disconnected</span>';
                
                // Reset global state
                isConnected = false;
                currentCredentials = null;
                currentDatabase = null;
                currentTable = null;
                
                // Clear form
                connectionForm.reset();
                
                showNotification('Logged out successfully', 'info');
            }
        });
}

function restoreSessionCredentials() {
    fetch('/session-credentials')
        .then(res => res.json())
        .then(data => {
            if (data.username && data.password) {
                // Fill the form
                document.getElementById('user').value = data.username;
                document.getElementById('password').value = data.password;
                
                // Auto-connect
                const credentials = {
                    host: document.getElementById('host').value,
                    port: parseInt(document.getElementById('port').value),
                    user: data.username,
                    password: data.password
                };
                currentCredentials = credentials;
                socket.emit('connect_database', credentials);
                showNotification('Auto-connecting with saved credentials...', 'info');
            } else if (data.username || data.password) {
                // Just fill available data without auto-connecting
                if (data.username) document.getElementById('user').value = data.username;
                if (data.password) document.getElementById('password').value = data.password;
            }
        })
        .catch(error => {
            console.error('Error restoring session credentials:', error);
        });
}

// Handle window resize to update scroll indicators
window.addEventListener('resize', () => {
    // Update scroll indicators for all table containers
    document.querySelectorAll('.table-container').forEach(container => {
        addScrollIndicator(container);
    });
});

// Handle keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
        if (document.activeElement === sqlQuery) {
            executeQuery();
        }
    } else if (e.key === 'Escape') {
        // Close any open modals
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (modal.style.display === 'block') {
                modal.style.display = 'none';
            }
        });
    }
});

// Copy functions
function copyRowData(rowData, buttonElement) {
    try {
        // Format row data as JSON
        const jsonData = JSON.stringify(rowData, null, 2);
        
        // Copy as JSON format only
        navigator.clipboard.writeText(jsonData).then(() => {
            showNotification('Row data copied to clipboard (JSON format)', 'success');
            if (buttonElement) animateCopySuccess(buttonElement);
        }).catch(() => {
            // Fallback for older browsers
            fallbackCopyText(jsonData);
            showNotification('Row data copied to clipboard (JSON format)', 'success');
            if (buttonElement) animateCopySuccess(buttonElement);
        });
    } catch (error) {
        console.error('Copy failed:', error);
        showNotification('Failed to copy row data', 'error');
    }
}

function copyCellData(cellValue, buttonElement) {
    try {
        const textValue = cellValue === null ? 'NULL' : String(cellValue);
        
        navigator.clipboard.writeText(textValue).then(() => {
            showNotification(`Cell data copied: "${textValue.length > 50 ? textValue.substring(0, 50) + '...' : textValue}"`, 'success');
            if (buttonElement) animateCopySuccess(buttonElement);
        }).catch(() => {
            fallbackCopyText(textValue);
            showNotification(`Cell data copied: "${textValue.length > 50 ? textValue.substring(0, 50) + '...' : textValue}"`, 'success');
            if (buttonElement) animateCopySuccess(buttonElement);
        });
    } catch (error) {
        console.error('Copy failed:', error);
        showNotification('Failed to copy cell data', 'error');
    }
}

function animateCopySuccess(button) {
    if (button) {
        button.classList.add('copy-success');
        setTimeout(() => {
            button.classList.remove('copy-success');
        }, 300);
    }
}

function fallbackCopyText(text) {
    // Fallback method for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
    } catch (err) {
        console.error('Fallback copy failed:', err);
    }
    
    document.body.removeChild(textArea);
}
