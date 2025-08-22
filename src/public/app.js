// Initialize Socket.IO connection
const socket = io();

// Global variables
let currentDatabase = null;
let currentTable = null;
let currentPage = 1;
let totalPages = 1;
let pageSize = 100;
let isConnected = false;

// DOM Elements
const connectionForm = document.getElementById('connectionForm');
const connectionPanel = document.getElementById('connectionPanel');
const mainInterface = document.getElementById('mainInterface');
const connectionStatus = document.getElementById('connectionStatus');
const disconnectBtn = document.getElementById('disconnectBtn');
const databaseList = document.getElementById('databaseList');
const tableList = document.getElementById('tableList');
const dataTable = document.getElementById('dataTable');
const structureTable = document.getElementById('structureTable');
const selectedTableSpan = document.getElementById('selectedTable');
const pageInfo = document.getElementById('pageInfo');
const sqlQuery = document.getElementById('sqlQuery');
const queryResults = document.getElementById('queryResults');
const queryDatabase = document.getElementById('queryDatabase');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    setupSocketListeners();
});

function setupEventListeners() {
    // Connection form
    connectionForm.addEventListener('submit', handleConnection);
    disconnectBtn.addEventListener('click', handleDisconnection);

    // Database operations
    document.getElementById('refreshDatabases').addEventListener('click', loadDatabases);
    document.getElementById('createDatabase').addEventListener('click', showCreateDatabaseModal);
    document.getElementById('refreshTables').addEventListener('click', loadTables);

    // Pagination
    document.getElementById('prevPage').addEventListener('click', () => changePage(-1));
    document.getElementById('nextPage').addEventListener('click', () => changePage(1));
    document.getElementById('pageSize').addEventListener('change', changePageSize);

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
}

function setupSocketListeners() {
    socket.on('connection_success', (data) => {
        isConnected = true;
        updateConnectionStatus(true);
        showNotification('Connected to database successfully!', 'success');
        showMainInterface();
        loadDatabases();
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
    } else {
        indicator.className = 'status-indicator disconnected';
        text.textContent = 'Disconnected';
        disconnectBtn.style.display = 'none';
    }
}

function showMainInterface() {
    connectionPanel.style.display = 'none';
    mainInterface.style.display = 'flex';
}

function showConnectionPanel() {
    connectionPanel.style.display = 'block';
    mainInterface.style.display = 'none';
    
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
    
    // Load table data and structure
    loadTableData();
    loadTableStructure();
}

function loadTableData() {
    if (!currentDatabase || !currentTable) return;
    
    const offset = (currentPage - 1) * pageSize;
    socket.emit('get_table_data', {
        database: currentDatabase,
        table: currentTable,
        limit: pageSize,
        offset: offset
    });
}

function loadTableStructure() {
    if (!currentDatabase || !currentTable) return;
    
    socket.emit('get_table_structure', {
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
    
    // Create header
    const headerRow = document.createElement('tr');
    const columns = Object.keys(data.data[0]);
    
    columns.forEach(column => {
        const th = document.createElement('th');
        th.textContent = column;
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    
    // Create data rows
    data.data.forEach(row => {
        const tr = document.createElement('tr');
        
        columns.forEach(column => {
            const td = document.createElement('td');
            const value = row[column];
            td.textContent = value === null ? 'NULL' : value;
            if (value === null) {
                td.style.fontStyle = 'italic';
                td.style.color = '#888';
            }
            tr.appendChild(td);
        });
        
        tbody.appendChild(tr);
    });
}

function populateTableStructure(structure) {
    const tbody = structureTable.querySelector('tbody');
    tbody.innerHTML = '';
    
    structure.forEach(field => {
        const tr = document.createElement('tr');
        
        ['Field', 'Type', 'Null', 'Key', 'Default', 'Extra'].forEach(prop => {
            const td = document.createElement('td');
            const value = field[prop];
            td.textContent = value === null ? '' : value;
            tr.appendChild(td);
        });
        
        tbody.appendChild(tr);
    });
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
                    html += `<td>${value === null ? '<em>NULL</em>' : value}</td>`;
                });
                html += '</tr>';
            });
            html += '</tbody></table></div>';
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
