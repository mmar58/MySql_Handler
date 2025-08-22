# 🗄️ MySQL Database Manager

A powerful, real-time web-based MySQL database management tool built with modern web technologies. This application provides a comprehensive interface for managing MySQL databases, tables, and data with advanced features like search, sorting, and table alteration capabilities.

[ ![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[ ![Node.js Version](https://img.shields.io/badge/node.js-v14%2B-green.svg)](https://nodejs.org/)
[ ![MySQL](https://img.shields.io/badge/mysql-v5.7%2B-blue.svg)](https://www.mysql.com/)

## 🚀 Features

### 🔗 **Database Connectivity**

* **Real-time Connection Management**: Connect/disconnect from MySQL databases with live status updates
* **Secure Authentication**: Support for username/password authentication with configurable host and port
* **Connection Persistence**: Maintains active connections per user session
* **Multi-user Support**: Handles multiple concurrent database connections

### 🗃️ **Database Management**

* **Database Operations**: Create, drop, and browse databases
* **Table Management**: View table lists, create/drop tables, and explore table relationships
* **Real-time Updates**: Instant UI updates when databases or tables are modified
* **Smart Refresh**: Automatic data refresh with manual refresh options

### 📊 **Advanced Data Viewing**

* **Paginated Data Display**: Efficient data loading with customizable page sizes (25, 50, 100, 200 records)
* **Advanced Search**: Search within specific columns with pattern matching
* **Dynamic Sorting**: Click-to-sort on any column with ascending/descending indicators
* **Data Type Handling**: Proper display of NULL values, numbers, strings, and dates
* **Responsive Tables**: Mobile-friendly table layouts with horizontal scrolling

### 🔧 **Table Structure Management**

* **Column Management**: Add, modify, and drop table columns
* **Data Type Support**: Full MySQL data type support (VARCHAR, INT, TEXT, DATE, etc.)
* **Index Management**: Create, view, and drop table indexes
* **Constraint Handling**: Primary keys, foreign keys, and unique constraints
* **Table Alteration GUI**: Intuitive interface for complex table modifications

### 📝 **SQL Query Interface**

* **Multi-query Execution**: Execute multiple SQL statements in a single operation
* **Syntax Highlighting**: Enhanced query input with proper formatting
* **Query Results Display**: Formatted results with proper data type handling
* **Query History**: Track and reuse previous queries
* **Error Handling**: Detailed error messages with line numbers

### 🎨 **Modern User Interface**

* **Tabbed Interface**: Organized tabs for Data, Structure, Indexes, Alter Table, and SQL Query
* **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
* **Real-time Notifications**: Toast notifications for all operations
* **Loading States**: Visual feedback during data loading operations
* **Dark Mode Ready**: CSS structure prepared for theme switching

## 🛠️ Technology Stack

### **Backend**

* **Node.js**: Server runtime environment
* **Express.js**: Web application framework
* **Socket.IO**: Real-time bidirectional communication
* **MySQL2**: MySQL database driver with Promise support
* **CORS**: Cross-origin resource sharing middleware

### **Frontend**

* **HTML5**: Modern semantic markup
* **CSS3**: Advanced styling with Flexbox and Grid
* **Vanilla JavaScript**: No framework dependencies, pure JS implementation
* **Socket.IO Client**: Real-time communication with the server

### **Database**

* **MySQL**: Primary database system (v5.7+ recommended)
* **Prepared Statements**: SQL injection protection
* **Connection Pooling**: Efficient connection management

## 📁 Project Structure

```
mysql_handler/
├── src/
│   ├── server.js              # Main server with Socket.IO handlers
│   ├── database/
│   │   └── DatabaseManager.js # Database operations class
│   └── public/
│       ├── index.html         # Main UI interface
│       ├── app.js             # Frontend JavaScript logic
│       └── style.css          # Responsive CSS styling
├── package.json               # Project dependencies and scripts
└── README.md                  # This file
```

## 🚀 Quick Start

### Prerequisites

* **Node.js** v14.0.0 or higher
* **MySQL Server** v5.7 or higher
* **npm** or **yarn** package manager

### Installation


1. **Clone the repository**

   ```bash
   git clone https://github.com/mmar58/mysql_handler.git
   cd mysql_handler
   npm install
   ```
2. **Start the server**

   ```bash
   npm start
   ```

   Or for development with auto-restart:

   ```bash
   npm run dev
   ```
3. **Access the application**
   Open your browser and navigate to:

   ```
   http://localhost:3000
   ```

### Environment Configuration

Create a `.env` file in the root directory for custom configuration:

```env
PORT=3000
NODE_ENV=production
```

## 💻 Usage Guide

### 🔌 **Connecting to a Database**


1. **Enter Connection Details**:
   * **Host**: Your MySQL server address (default: localhost)
   * **Port**: MySQL port number (default: 3306)
   * **Username**: Your MySQL username
   * **Password**: Your MySQL password
2. **Click Connect**: The application will establish a real-time connection
3. **Browse Databases**: Available databases will appear in the left sidebar

### 📋 **Managing Data**


1. **Select a Database**: Click on any database in the sidebar
2. **Choose a Table**: Tables will appear after database selection
3. **View Data**: Use the Data tab to browse table contents
4. **Search Data**: Select a column and enter search terms
5. **Sort Data**: Click any column header to sort

### 🔧 **Altering Tables**


1. **Navigate to Alter Table tab**
2. **Add Columns**: Specify name, data type, and constraints
3. **Modify Columns**: Change existing column properties
4. **Drop Columns**: Remove unwanted columns
5. **Manage Indexes**: Create or drop table indexes

### 📊 **Executing SQL Queries**


1. **Go to SQL Query tab**
2. **Select Target Database** from the dropdown
3. **Write Your Query** in the text area
4. **Execute**: View results in the formatted table below

## 🔧 API Documentation

### Socket.IO Events

#### Client → Server Events

| Event | Parameters | Description |
|----|----|----|
| `connect_database` | `{host, port, user, password}` | Establish database connection |
| `disconnect_database` | None | Close database connection |
| `get_databases` | None | Retrieve list of databases |
| `get_tables` | `databaseName` | Get tables in database |
| `get_table_structure` | `{database, table}` | Get table column structure |
| `get_table_data` | `{database, table, limit, offset, sortColumn, sortDirection, searchColumn, searchValue}` | Retrieve table data with pagination/search/sort |
| `execute_query` | `{database, query}` | Execute SQL query |
| `alter_table` | `{database, table, alterQuery}` | Modify table structure |
| `create_database` | `databaseName` | Create new database |
| `drop_database` | `databaseName` | Delete database |
| `drop_table` | `{database, table}` | Delete table |
| `get_table_indexes` | `{database, table}` | Get table indexes |

#### Server → Client Events

| Event | Data | Description |
|----|----|----|
| `connection_success` | `{message, connectionId}` | Successful database connection |
| `connection_error` | `{message}` | Connection failure |
| `databases_list` | `[database_names]` | Available databases |
| `tables_list` | `{database, tables}` | Tables in database |
| `table_structure` | `{columns}` | Table column information |
| `table_data` | `{data, total, page, searchColumn, searchValue, sortColumn, sortDirection}` | Table data with metadata |
| `query_result` | `{results, message}` | SQL query results |
| `error` | `{message}` | Error notification |

## 🛡️ Security Features

* **SQL Injection Prevention**: All queries use parameterized statements
* **Input Validation**: Client and server-side input validation
* **Connection Security**: Secure credential handling
* **Error Handling**: Comprehensive error management without exposing sensitive data

## 🔧 Development

### Development Mode

```bash
npm run dev
```

Uses nodemon for automatic server restart on file changes.

### Available Scripts

* `npm start`: Start production server
* `npm run dev`: Start development server with auto-restart
* `npm test`: Run test suite (placeholder)

### Code Structure

#### DatabaseManager Class

Located in `src/database/DatabaseManager.js`, this class handles:

* Connection management
* Database operations (CRUD)
* Table operations (structure, data, indexes)
* Query execution with proper escaping
* Search and sorting functionality

#### Server Configuration

The `src/server.js` file contains:

* Express.js server setup
* Socket.IO event handlers
* CORS configuration
* Static file serving
* Error handling middleware

#### Frontend Architecture

The `src/public/app.js` implements:

* Socket.IO client communication
* DOM manipulation and event handling
* Real-time UI updates
* Form validation and submission
* Pagination, search, and sorting logic

## 🐛 Troubleshooting

### Common Issues


1. **Connection Refused**
   * Verify MySQL server is running
   * Check host and port settings
   * Ensure user has proper permissions
2. **Authentication Failed**
   * Verify username and password
   * Check MySQL user privileges
   * Ensure user can connect from the host
3. **Tables Not Loading**
   * Verify database exists
   * Check user permissions for the database
   * Refresh the database list
4. **Search/Sort Not Working**
   * Ensure table has data
   * Verify column names are correct
   * Check for special characters in search terms

### Debug Mode

Enable detailed logging by setting:

```javascript
console.log('Debug mode enabled');
```

## 🤝 Contributing


1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature-name`
3. **Commit changes**: `git commit -am 'Add feature'`
4. **Push to branch**: `git push origin feature-name`
5. **Submit a pull request**

### Development Guidelines

* Follow existing code style and structure
* Add comments for complex functionality
* Test thoroughly before submitting
* Update documentation for new features

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

* **Socket.IO** for real-time communication
* **MySQL2** for robust database connectivity
* **Express.js** for the web framework foundation
* The open-source community for inspiration and tools

## 📞 Support

For support, issues, or feature requests:

* **Create an Issue**: [GitHub Issues](https://github.com/mmar58/mysql_handler/issues)
* **Email**: rahmanapu118@gmail.com
* **Documentation**: Check this README for common solutions


---

**Built with ❤️ by [mmar58](https://github.com/mmar58)**

*Happy Database Managing! 🎉*