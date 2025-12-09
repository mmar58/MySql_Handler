const mysql = require('mysql2/promise');

class DatabaseManager {
    constructor(credentials) {
        this.credentials = {
            host: credentials.host || 'localhost',
            port: credentials.port || 3306,
            user: credentials.user,
            password: credentials.password,
            connectTimeout: 60000
        };

        if (credentials.ssl) {
            this.credentials.ssl = {
                rejectUnauthorized: credentials.ssl.rejectUnauthorized !== false
            };

            if (credentials.ssl.ca) this.credentials.ssl.ca = credentials.ssl.ca;
            if (credentials.ssl.cert) this.credentials.ssl.cert = credentials.ssl.cert;
            if (credentials.ssl.key) this.credentials.ssl.key = credentials.ssl.key;
        }

        this.connection = null;
    }

    async connect() {
        try {
            if (this.credentials.ssl) {
                console.log('Attempting secure SSL connection to database...');
            } else {
                console.log('Attempting standard connection to database...');
            }

            this.connection = await mysql.createConnection(this.credentials);
            console.log(`Database connected successfully (${this.credentials.ssl ? 'SSL' : 'Non-SSL'})`);
        } catch (error) {
            console.error('Database connection failed:', error.message);
            if (this.credentials.ssl) {
                console.error('SSL Connection Details:', {
                    ca_provided: !!this.credentials.ssl.ca,
                    cert_provided: !!this.credentials.ssl.cert,
                    key_provided: !!this.credentials.ssl.key,
                    rejectUnauthorized: this.credentials.ssl.rejectUnauthorized
                });
            }
            throw error;
        }
    }

    async disconnect() {
        if (this.connection) {
            await this.connection.end();
            this.connection = null;
            console.log('Database disconnected');
        }
    }

    async getDatabases() {
        if (!this.connection) {
            throw new Error('No database connection');
        }

        try {
            const [rows] = await this.connection.execute('SHOW DATABASES');
            return rows.map(row => row.Database);
        } catch (error) {
            throw new Error(`Failed to get databases: ${error.message}`);
        }
    }

    async getTables(databaseName) {
        if (!this.connection) {
            throw new Error('No database connection');
        }

        try {
            const escapedDatabase = this.connection.escapeId(databaseName);
            const [rows] = await this.connection.query(`SHOW TABLES FROM ${escapedDatabase}`);
            const tableKey = `Tables_in_${databaseName}`;
            return rows.map(row => row[tableKey]);
        } catch (error) {
            throw new Error(`Failed to get tables: ${error.message}`);
        }
    }

    async getTableStructure(databaseName, tableName) {
        if (!this.connection) {
            throw new Error('No database connection');
        }

        try {
            const escapedDatabase = this.connection.escapeId(databaseName);
            const escapedTable = this.connection.escapeId(tableName);
            const [rows] = await this.connection.query(`DESCRIBE ${escapedDatabase}.${escapedTable}`);
            return rows;
        } catch (error) {
            throw new Error(`Failed to get table structure: ${error.message}`);
        }
    }

    async getTableData(databaseName, tableName, limit = 100, offset = 0, sortColumn = null, sortDirection = 'ASC', searchColumn = null, searchValue = null) {
        if (!this.connection) {
            throw new Error('No database connection');
        }

        try {
            // Escape database and table names to prevent SQL injection
            const escapedDatabase = this.connection.escapeId(databaseName);
            const escapedTable = this.connection.escapeId(tableName);
            const fullTableName = `${escapedDatabase}.${escapedTable}`;

            // Build WHERE clause for search
            let whereClause = '';
            let countWhereClause = '';
            if (searchColumn && searchValue) {
                const escapedSearchColumn = this.connection.escapeId(searchColumn);
                const escapedSearchValue = this.connection.escape(`%${searchValue}%`);
                whereClause = ` WHERE ${escapedSearchColumn} LIKE ${escapedSearchValue}`;
                countWhereClause = whereClause;
            }

            // Build ORDER BY clause for sorting
            let orderClause = '';
            if (sortColumn) {
                const escapedSortColumn = this.connection.escapeId(sortColumn);
                const direction = sortDirection.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
                orderClause = ` ORDER BY ${escapedSortColumn} ${direction}`;
            }

            // Get total count (with search filter if applied)
            const countQuery = `SELECT COUNT(*) as total FROM ${fullTableName}${countWhereClause}`;
            const [countResult] = await this.connection.query(countQuery);
            const total = countResult[0].total;

            // Get data with pagination, sorting, and search
            const dataQuery = `SELECT * FROM ${fullTableName}${whereClause}${orderClause} LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
            const [rows] = await this.connection.query(dataQuery);

            return {
                data: rows,
                total: total,
                limit: limit,
                offset: offset,
                sortColumn: sortColumn,
                sortDirection: sortDirection,
                searchColumn: searchColumn,
                searchValue: searchValue
            };
        } catch (error) {
            throw new Error(`Failed to get table data: ${error.message}`);
        }
    }

    async executeQuery(databaseName, query) {
        if (!this.connection) {
            throw new Error('No database connection');
        }

        try {
            let finalQuery = query.trim();

            // Handle special cases for queries that need database context
            const upperQuery = query.toUpperCase().trim();

            if (upperQuery.startsWith('USE ')) {
                // Handle USE statements by extracting the database name
                const dbMatch = query.match(/USE\s+`?(\w+)`?/i);
                if (dbMatch) {
                    // For USE statements, we'll create a new connection with the database specified
                    try {
                        const testConnection = await mysql.createConnection({
                            ...this.credentials,
                            database: dbMatch[1]
                        });
                        await testConnection.end();
                        return {
                            type: 'MODIFY',
                            affectedRows: 0,
                            insertId: null,
                            message: `Database changed to '${dbMatch[1]}'`
                        };
                    } catch (error) {
                        throw new Error(`Cannot use database '${dbMatch[1]}': ${error.message}`);
                    }
                }
            }

            // Check if query contains multiple statements (separated by semicolons)
            const statements = finalQuery.split(';').map(stmt => stmt.trim()).filter(stmt => stmt.length > 0);

            if (statements.length > 1) {
                // Handle multiple statements
                let totalAffectedRows = 0;
                let results = [];
                let lastInsertId = null;

                // Create database-specific connection if needed
                const execConnection = databaseName ?
                    await mysql.createConnection({
                        ...this.credentials,
                        database: databaseName,
                        multipleStatements: true
                    }) : this.connection;

                try {
                    for (const statement of statements) {
                        const [result] = await execConnection.query(statement);

                        if (statement.trim().toUpperCase().startsWith('SELECT') ||
                            statement.trim().toUpperCase().startsWith('SHOW') ||
                            statement.trim().toUpperCase().startsWith('DESCRIBE') ||
                            statement.trim().toUpperCase().startsWith('EXPLAIN')) {
                            results.push({
                                statement: statement,
                                data: result,
                                rowCount: result.length
                            });
                        } else {
                            totalAffectedRows += result.affectedRows || 0;
                            if (result.insertId) {
                                lastInsertId = result.insertId;
                            }
                        }
                    }

                    if (results.length > 0) {
                        return {
                            type: 'SELECT',
                            data: results,
                            rowCount: results.reduce((total, r) => total + r.rowCount, 0),
                            multipleStatements: true
                        };
                    } else {
                        return {
                            type: 'MODIFY',
                            affectedRows: totalAffectedRows,
                            insertId: lastInsertId,
                            message: `${statements.length} statements executed successfully`
                        };
                    }
                } finally {
                    if (execConnection !== this.connection) {
                        await execConnection.end();
                    }
                }
            }

            // Single statement execution
            if (databaseName) {
                if (upperQuery.startsWith('SHOW TABLES')) {
                    const escapedDatabase = this.connection.escapeId(databaseName);
                    finalQuery = `SHOW TABLES FROM ${escapedDatabase}`;
                } else {
                    // For other queries, we need to execute them with database context
                    // Create a temporary connection with the database specified
                    const dbConnection = await mysql.createConnection({
                        ...this.credentials,
                        database: databaseName
                    });

                    try {
                        const [result] = await dbConnection.query(finalQuery);

                        // Handle different query types
                        if (finalQuery.trim().toUpperCase().startsWith('SELECT') ||
                            finalQuery.trim().toUpperCase().startsWith('SHOW') ||
                            finalQuery.trim().toUpperCase().startsWith('DESCRIBE') ||
                            finalQuery.trim().toUpperCase().startsWith('EXPLAIN')) {
                            return {
                                type: 'SELECT',
                                data: result,
                                rowCount: result.length
                            };
                        } else {
                            return {
                                type: 'MODIFY',
                                affectedRows: result.affectedRows || 0,
                                insertId: result.insertId || null,
                                message: 'Query executed successfully'
                            };
                        }
                    } finally {
                        await dbConnection.end();
                    }
                }
            }

            // Execute query without database context (for queries that don't need it)
            const [result] = await this.connection.query(finalQuery);

            // Handle different query types
            if (finalQuery.trim().toUpperCase().startsWith('SELECT') ||
                finalQuery.trim().toUpperCase().startsWith('SHOW') ||
                finalQuery.trim().toUpperCase().startsWith('DESCRIBE') ||
                finalQuery.trim().toUpperCase().startsWith('EXPLAIN')) {
                return {
                    type: 'SELECT',
                    data: result,
                    rowCount: result.length
                };
            } else {
                return {
                    type: 'MODIFY',
                    affectedRows: result.affectedRows || 0,
                    insertId: result.insertId || null,
                    message: 'Query executed successfully'
                };
            }
        } catch (error) {
            throw new Error(`Query execution failed: ${error.message}`);
        }
    }

    async createDatabase(databaseName) {
        if (!this.connection) {
            throw new Error('No database connection');
        }

        try {
            const escapedDatabase = this.connection.escapeId(databaseName);
            await this.connection.query(`CREATE DATABASE ${escapedDatabase}`);
        } catch (error) {
            throw new Error(`Failed to create database: ${error.message}`);
        }
    }

    async dropDatabase(databaseName) {
        if (!this.connection) {
            throw new Error('No database connection');
        }

        try {
            const escapedDatabase = this.connection.escapeId(databaseName);
            await this.connection.query(`DROP DATABASE ${escapedDatabase}`);
        } catch (error) {
            throw new Error(`Failed to drop database: ${error.message}`);
        }
    }

    async createTable(databaseName, createTableQuery) {
        if (!this.connection) {
            throw new Error('No database connection');
        }

        try {
            // Modify the CREATE TABLE query to include database name if not present
            let finalQuery = createTableQuery;
            if (databaseName && !createTableQuery.includes(`${databaseName}.`)) {
                // This is a simple approach - for production, use a proper SQL parser
                finalQuery = createTableQuery.replace(/CREATE TABLE\s+`?(\w+)`?/i,
                    `CREATE TABLE \`${databaseName}\`.\`$1\``);
            }
            await this.connection.execute(finalQuery);
        } catch (error) {
            throw new Error(`Failed to create table: ${error.message}`);
        }
    }

    async dropTable(databaseName, tableName) {
        if (!this.connection) {
            throw new Error('No database connection');
        }

        try {
            const escapedDatabase = this.connection.escapeId(databaseName);
            const escapedTable = this.connection.escapeId(tableName);
            await this.connection.query(`DROP TABLE ${escapedDatabase}.${escapedTable}`);
        } catch (error) {
            throw new Error(`Failed to drop table: ${error.message}`);
        }
    }

    async alterTable(databaseName, tableName, alterQuery) {
        if (!this.connection) {
            throw new Error('No database connection');
        }

        try {
            // Create database-specific connection
            const dbConnection = await mysql.createConnection({
                ...this.credentials,
                database: databaseName
            });

            try {
                await dbConnection.query(alterQuery);
            } finally {
                await dbConnection.end();
            }
        } catch (error) {
            throw new Error(`Failed to alter table: ${error.message}`);
        }
    }

    async getTableIndexes(databaseName, tableName) {
        if (!this.connection) {
            throw new Error('No database connection');
        }

        try {
            const escapedDatabase = this.connection.escapeId(databaseName);
            const escapedTable = this.connection.escapeId(tableName);
            const [rows] = await this.connection.query(`SHOW INDEX FROM ${escapedDatabase}.${escapedTable}`);
            return rows;
        } catch (error) {
            throw new Error(`Failed to get table indexes: ${error.message}`);
        }
    }

    async getTableConstraints(databaseName, tableName) {
        if (!this.connection) {
            throw new Error('No database connection');
        }

        try {
            const query = `
                SELECT 
                    CONSTRAINT_NAME,
                    CONSTRAINT_TYPE,
                    COLUMN_NAME,
                    REFERENCED_TABLE_NAME,
                    REFERENCED_COLUMN_NAME
                FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
                JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc 
                    ON kcu.CONSTRAINT_NAME = tc.CONSTRAINT_NAME 
                    AND kcu.TABLE_SCHEMA = tc.TABLE_SCHEMA
                WHERE kcu.TABLE_SCHEMA = ? AND kcu.TABLE_NAME = ?
                ORDER BY kcu.ORDINAL_POSITION
            `;

            const [rows] = await this.connection.query(query, [databaseName, tableName]);
            return rows;
        } catch (error) {
            throw new Error(`Failed to get table constraints: ${error.message}`);
        }
    }

    async exportDatabase(databaseName, options = {}) {
        if (!this.connection) {
            throw new Error('No database connection');
        }

        const { includeData = true, selectedTables = null } = options;
        let sqlContent = '';

        try {
            // Add header comment
            sqlContent += `-- Database Export: ${databaseName}\n`;
            sqlContent += `-- Generated on: ${new Date().toISOString()}\n`;
            sqlContent += `-- MySQL Handler Export\n\n`;

            // Create database statement
            sqlContent += `CREATE DATABASE IF NOT EXISTS \`${databaseName}\`;\n`;
            sqlContent += `USE \`${databaseName}\`;\n\n`;

            // Get all tables or selected tables
            const tables = selectedTables || await this.getTables(databaseName);

            for (const tableName of tables) {
                sqlContent += await this.exportTable(databaseName, tableName, { includeData });
                sqlContent += '\n';
            }

            return {
                filename: `${databaseName}_export_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.sql`,
                content: sqlContent,
                size: Buffer.byteLength(sqlContent, 'utf8')
            };
        } catch (error) {
            throw new Error(`Failed to export database: ${error.message}`);
        }
    }

    async exportTable(databaseName, tableName, options = {}) {
        if (!this.connection) {
            throw new Error('No database connection');
        }

        const { includeData = true, selectedRows = null, whereClause = null } = options;
        let sqlContent = '';

        try {
            // Add table header comment
            sqlContent += `-- Table structure for \`${tableName}\`\n`;
            sqlContent += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;

            // Get CREATE TABLE statement
            const [createResult] = await this.connection.query(
                `SHOW CREATE TABLE \`${databaseName}\`.\`${tableName}\``
            );
            sqlContent += createResult[0]['Create Table'] + ';\n\n';

            if (includeData) {
                sqlContent += `-- Data for table \`${tableName}\`\n`;

                let dataQuery = `SELECT * FROM \`${databaseName}\`.\`${tableName}\``;

                // Add WHERE clause if provided
                if (whereClause) {
                    dataQuery += ` WHERE ${whereClause}`;
                }

                const [rows] = await this.connection.query(dataQuery);

                if (rows.length > 0) {
                    // Filter rows if specific rows are selected
                    let dataRows = rows;
                    if (selectedRows && Array.isArray(selectedRows)) {
                        dataRows = rows.filter((_, index) => selectedRows.includes(index));
                    }

                    if (dataRows.length > 0) {
                        const columns = Object.keys(dataRows[0]);
                        const columnsList = columns.map(col => `\`${col}\``).join(', ');

                        sqlContent += `LOCK TABLES \`${tableName}\` WRITE;\n`;
                        sqlContent += `INSERT INTO \`${tableName}\` (${columnsList}) VALUES\n`;

                        const valueStrings = dataRows.map(row => {
                            const values = columns.map(col => {
                                const value = row[col];
                                if (value === null) return 'NULL';
                                if (typeof value === 'string') {
                                    return this.connection.escape(value);
                                }
                                return this.connection.escape(value);
                            });
                            return `(${values.join(', ')})`;
                        });

                        sqlContent += valueStrings.join(',\n') + ';\n';
                        sqlContent += `UNLOCK TABLES;\n`;
                    }
                }
            }

            return sqlContent;
        } catch (error) {
            throw new Error(`Failed to export table: ${error.message}`);
        }
    }

    async getRowCount(databaseName, tableName, whereClause = null) {
        if (!this.connection) {
            throw new Error('No database connection');
        }

        try {
            let query = `SELECT COUNT(*) as count FROM \`${databaseName}\`.\`${tableName}\``;
            if (whereClause) {
                query += ` WHERE ${whereClause}`;
            }

            const [result] = await this.connection.query(query);
            return result[0].count;
        } catch (error) {
            throw new Error(`Failed to get row count: ${error.message}`);
        }
    }
}

module.exports = DatabaseManager;
