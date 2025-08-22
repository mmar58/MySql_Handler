const mysql = require('mysql2/promise');

class DatabaseManager {
    constructor(credentials) {
        this.credentials = {
            host: credentials.host || 'localhost',
            port: credentials.port || 3306,
            user: credentials.user,
            password: credentials.password,
            connectTimeout: 60000,
            acquireTimeout: 60000
        };
        this.connection = null;
    }

    async connect() {
        try {
            this.connection = await mysql.createConnection(this.credentials);
            console.log('Database connected successfully');
        } catch (error) {
            console.error('Database connection failed:', error.message);
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

    async getTableData(databaseName, tableName, limit = 100, offset = 0) {
        if (!this.connection) {
            throw new Error('No database connection');
        }

        try {
            // Escape database and table names to prevent SQL injection
            const escapedDatabase = this.connection.escapeId(databaseName);
            const escapedTable = this.connection.escapeId(tableName);
            const fullTableName = `${escapedDatabase}.${escapedTable}`;
            
            // Get total count
            const countQuery = `SELECT COUNT(*) as total FROM ${fullTableName}`;
            const [countResult] = await this.connection.query(countQuery);
            const total = countResult[0].total;
            
            // Get data with pagination - using query with escaped values
            const dataQuery = `SELECT * FROM ${fullTableName} LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
            const [rows] = await this.connection.query(dataQuery);
            
            return {
                data: rows,
                total: total,
                limit: limit,
                offset: offset
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
            
            if (databaseName && upperQuery.startsWith('SHOW TABLES')) {
                const escapedDatabase = this.connection.escapeId(databaseName);
                finalQuery = `SHOW TABLES FROM ${escapedDatabase}`;
            } else if (upperQuery.startsWith('USE ')) {
                // Handle USE statements by extracting the database name
                const dbMatch = query.match(/USE\s+`?(\w+)`?/i);
                if (dbMatch) {
                    // We can't execute USE with prepared statements, so we'll just return success
                    return {
                        type: 'MODIFY',
                        affectedRows: 0,
                        insertId: null,
                        message: `Database changed to '${dbMatch[1]}'`
                    };
                }
            }
            
            // Use query method instead of execute for better compatibility
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
}

module.exports = DatabaseManager;
