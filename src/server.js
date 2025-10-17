require('dotenv').config();
const express = require('express');
const session = require('express-session');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');
const DatabaseManager = require('./database/DatabaseManager');

const app = express();

// Create session middleware
const sessionMiddleware = session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true
});

app.use(sessionMiddleware);
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Share session with Socket.IO
io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Store active database connections
const activeConnections = new Map();

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API to get last username/password from session
app.get('/session-credentials', (req, res) => {
    res.json({
        username: req.session.lastUsername || '',
        password: req.session.lastPassword || ''
    });
});

// API to store credentials in session
app.post('/store-credentials', (req, res) => {
    const { username, password } = req.body;
    req.session.lastUsername = username;
    req.session.lastPassword = password;
    req.session.save((err) => {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true });
    });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Handle database connection
    socket.on('connect_database', async (credentials) => {
        try {
            const dbManager = new DatabaseManager(credentials);
            await dbManager.connect();
            
            activeConnections.set(socket.id, dbManager);
            
            socket.emit('connection_success', {
                message: 'Successfully connected to database',
                connectionId: socket.id
            });
            
            console.log(`Database connected for user: ${socket.id}`);
        } catch (error) {
            socket.emit('connection_error', {
                message: 'Failed to connect to database',
                error: error.message
            });
            console.error('Database connection error:', error.message);
        }
    });

    // Handle database disconnection
    socket.on('disconnect_database', async () => {
        const dbManager = activeConnections.get(socket.id);
        if (dbManager) {
            await dbManager.disconnect();
            activeConnections.delete(socket.id);
            socket.emit('disconnection_success', {
                message: 'Database disconnected successfully'
            });
        }
    });

    // Get all databases
    socket.on('get_databases', async () => {
        const dbManager = activeConnections.get(socket.id);
        if (!dbManager) {
            socket.emit('error', { message: 'No active database connection' });
            return;
        }

        try {
            const databases = await dbManager.getDatabases();
            socket.emit('databases_list', databases);
        } catch (error) {
            socket.emit('error', { message: error.message });
        }
    });

    // Get tables from a specific database
    socket.on('get_tables', async (databaseName) => {
        const dbManager = activeConnections.get(socket.id);
        if (!dbManager) {
            socket.emit('error', { message: 'No active database connection' });
            return;
        }

        try {
            const tables = await dbManager.getTables(databaseName);
            socket.emit('tables_list', { database: databaseName, tables });
        } catch (error) {
            socket.emit('error', { message: error.message });
        }
    });

    // Get table structure
    socket.on('get_table_structure', async ({ database, table }) => {
        const dbManager = activeConnections.get(socket.id);
        if (!dbManager) {
            socket.emit('error', { message: 'No active database connection' });
            return;
        }

        try {
            const structure = await dbManager.getTableStructure(database, table);
            socket.emit('table_structure', { database, table, structure });
        } catch (error) {
            socket.emit('error', { message: error.message });
        }
    });

    // Get table data
    socket.on('get_table_data', async ({ database, table, limit = 100, offset = 0, sortColumn = null, sortDirection = 'ASC', searchColumn = null, searchValue = null }) => {
        const dbManager = activeConnections.get(socket.id);
        if (!dbManager) {
            socket.emit('error', { message: 'No active database connection' });
            return;
        }

        try {
            const result = await dbManager.getTableData(database, table, limit, offset, sortColumn, sortDirection, searchColumn, searchValue);
            // Send the result directly, adding database and table info
            socket.emit('table_data', { 
                database, 
                table, 
                data: result.data,
                total: result.total,
                limit: result.limit, 
                offset: result.offset,
                sortColumn: result.sortColumn,
                sortDirection: result.sortDirection,
                searchColumn: result.searchColumn,
                searchValue: result.searchValue
            });
        } catch (error) {
            socket.emit('error', { message: error.message });
        }
    });

    // Execute custom SQL query
    socket.on('execute_query', async ({ database, query }) => {
        const dbManager = activeConnections.get(socket.id);
        if (!dbManager) {
            socket.emit('error', { message: 'No active database connection' });
            return;
        }

        try {
            const result = await dbManager.executeQuery(database, query);
            socket.emit('query_result', { query, result });
        } catch (error) {
            socket.emit('error', { message: error.message });
        }
    });

    // Create new database
    socket.on('create_database', async (databaseName) => {
        const dbManager = activeConnections.get(socket.id);
        if (!dbManager) {
            socket.emit('error', { message: 'No active database connection' });
            return;
        }

        try {
            await dbManager.createDatabase(databaseName);
            socket.emit('database_created', { message: `Database '${databaseName}' created successfully` });
        } catch (error) {
            socket.emit('error', { message: error.message });
        }
    });

    // Drop database
    socket.on('drop_database', async (databaseName) => {
        const dbManager = activeConnections.get(socket.id);
        if (!dbManager) {
            socket.emit('error', { message: 'No active database connection' });
            return;
        }

        try {
            await dbManager.dropDatabase(databaseName);
            socket.emit('database_dropped', { message: `Database '${databaseName}' dropped successfully` });
        } catch (error) {
            socket.emit('error', { message: error.message });
        }
    });

    // Alter table
    socket.on('alter_table', async ({ database, table, alterQuery }) => {
        const dbManager = activeConnections.get(socket.id);
        if (!dbManager) {
            socket.emit('error', { message: 'No active database connection' });
            return;
        }

        try {
            await dbManager.alterTable(database, table, alterQuery);
            socket.emit('table_altered', { message: `Table '${table}' altered successfully` });
        } catch (error) {
            socket.emit('error', { message: error.message });
        }
    });

    // Get table indexes
    socket.on('get_table_indexes', async ({ database, table }) => {
        const dbManager = activeConnections.get(socket.id);
        if (!dbManager) {
            socket.emit('error', { message: 'No active database connection' });
            return;
        }

        try {
            const indexes = await dbManager.getTableIndexes(database, table);
            socket.emit('table_indexes', { database, table, indexes });
        } catch (error) {
            socket.emit('error', { message: error.message });
        }
    });

    // Get table constraints
    socket.on('get_table_constraints', async ({ database, table }) => {
        const dbManager = activeConnections.get(socket.id);
        if (!dbManager) {
            socket.emit('error', { message: 'No active database connection' });
            return;
        }

        try {
            const constraints = await dbManager.getTableConstraints(database, table);
            socket.emit('table_constraints', { database, table, constraints });
        } catch (error) {
            socket.emit('error', { message: error.message });
        }
    });

    // Drop table
    socket.on('drop_table', async ({ database, table }) => {
        const dbManager = activeConnections.get(socket.id);
        if (!dbManager) {
            socket.emit('error', { message: 'No active database connection' });
            return;
        }

        try {
            await dbManager.dropTable(database, table);
            socket.emit('table_dropped', { message: `Table '${table}' dropped successfully` });
        } catch (error) {
            socket.emit('error', { message: error.message });
        }
    });

    // Export database
    socket.on('export_database', async ({ database, options = {} }) => {
        const dbManager = activeConnections.get(socket.id);
        if (!dbManager) {
            socket.emit('error', { message: 'No active database connection' });
            return;
        }

        try {
            const exportResult = await dbManager.exportDatabase(database, options);
            socket.emit('database_exported', exportResult);
        } catch (error) {
            socket.emit('error', { message: error.message });
        }
    });

    // Export table
    socket.on('export_table', async ({ database, table, options = {} }) => {
        const dbManager = activeConnections.get(socket.id);
        if (!dbManager) {
            socket.emit('error', { message: 'No active database connection' });
            return;
        }

        try {
            const tableContent = await dbManager.exportTable(database, table, options);
            const exportResult = {
                filename: `${table}_export_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.sql`,
                content: tableContent,
                size: Buffer.byteLength(tableContent, 'utf8')
            };
            socket.emit('table_exported', exportResult);
        } catch (error) {
            socket.emit('error', { message: error.message });
        }
    });

    // Get row count for export preview
    socket.on('get_row_count', async ({ database, table, whereClause = null }) => {
        const dbManager = activeConnections.get(socket.id);
        if (!dbManager) {
            socket.emit('error', { message: 'No active database connection' });
            return;
        }

        try {
            const count = await dbManager.getRowCount(database, table, whereClause);
            socket.emit('row_count_result', { database, table, count, whereClause });
        } catch (error) {
            socket.emit('error', { message: error.message });
        }
    });

    // Handle client disconnect
    socket.on('disconnect', async () => {
        console.log('User disconnected:', socket.id);
        const dbManager = activeConnections.get(socket.id);
        if (dbManager) {
            await dbManager.disconnect();
            activeConnections.delete(socket.id);
        }
    });
});

// Logout route
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Logout failed' });
        }
        res.json({ success: true });
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Access the application at http://localhost:${PORT}`);
});
