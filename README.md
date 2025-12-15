# 🗄️ MySQL Database Manager

A powerful, real-time web-based MySQL database management tool built with modern web technologies. This application provides a comprehensive interface for managing MySQL databases, tables, and data with advanced features like search, sorting, table alteration, data export, and copy functionality.

[ ![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[ ![Node.js Version](https://img.shields.io/badge/node.js-v14%2B-green.svg)](https://nodejs.org/)
[ ![MySQL](https://img.shields.io/badge/mysql-v5.7%2B-blue.svg)](https://www.mysql.com/)
[ ![Socket.IO](https://img.shields.io/badge/socket.io-v4.0%2B-black.svg)](https://socket.io/)

## 🚀 Features

### 🔗 **Database Connectivity**

* **Real-time Connection Management**: Connect/disconnect from MySQL databases with live status updates
* **Secure Authentication**: Support for username/password authentication with configurable host and port
* **SSL/TLS Support**: Secure connections with SSL CA, Client Certificate, and Key support
* **Connection Persistence**: Maintains active connections per user session
* **Saved Configurations**: Locally save and manage frequently used connection profiles
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
* **Smart Scroll Indicators**: Visual indicators for horizontally scrollable content
* **Copy Functionality**: One-click copy for individual cells and entire rows
* **Long Text Handling**: Truncated display with hover tooltips for large text content
* **Column Interactions**: Copy individual cell data or entire rows easily

### 🔧 **Table Structure Management**

* **Column Management**: Add, modify, and drop table columns
* **Data Type Support**: Full MySQL data type support (VARCHAR, INT, TEXT, DATE, etc.)
* **Index Management**: Create, view, and drop table indexes
* **Constraint Handling**: Primary keys, foreign keys, and unique constraints
* **Table Alteration GUI**: Intuitive interface for complex table modifications

### 📝 **SQL Query Interface**

* **Multi-query Execution**: Execute multiple SQL statements in a single operation
* **Enhanced Query Input**: Large, full-width text area for writing complex queries
* **Query Results Display**: Formatted results with proper data type handling
* **Database Selection**: Choose target database for query execution
* **Error Handling**: Detailed error messages with clear feedback
* **Copy Results**: Copy functionality for query result data

### 📥 **Export & Backup Capabilities**

* **Database Export**: Complete database backup with structure and data
* **Table Export**: Individual table export with flexible options
* **Selective Export**: Choose specific tables for database export
* **Data Options**: Export structure only or include data
* **Custom Filtering**: Export data with custom WHERE clauses
* **Row Count Preview**: Preview number of rows before export
* **Multiple Formats**: SQL dump format with proper MySQL syntax
* **Automatic Downloads**: Browser-based file downloads with timestamped names

### 🎨 **Modern Premium User Interface**

* **Premium Design**: Modern, clean aesthetic with 'Inter' and 'Outfit' typography
* **Dark Sidebar**: Professional contrast with a sleek dark sidebar
* **Tabbed Interface**: Organized tabs for Data, Structure, Indexes, Alter Table, and SQL Query
* **Responsive Layouts**: Works seamlessly on all screen sizes with smart overflow handling
* **Real-time Notifications**: Toast notifications for all operations
* **Loading States**: Visual feedback during data loading operations
* **Modal Dialogs**: User-friendly modals for complex operations
* **Copy Buttons**: Intuitive copy buttons for rows and cells with visual feedback
* **Export Interfaces**: Comprehensive export dialogs with advanced options
* **Session Management**: Persistent login with credential storage
* **Smooth Animations**: CSS transitions and hover effects for better UX

## 🛠️ Technology Stack

### **Backend**

* **Node.js**: Server runtime environment
* **Express.js**: Web application framework
* **Socket.IO**: Real-time bidirectional communication
* **MySQL2**: MySQL database driver with Promise and SSL support
* **Express Session**: Session management for credential persistence
* **CORS**: Cross-origin resource sharing middleware
* **Custom DatabaseManager**: Comprehensive database operation handler

### **Frontend**

* **HTML5**: Modern semantic markup with accessibility features
* **CSS3**: Advanced styling with Flexbox, Grid, custom properties, and animations
* **Vanilla JavaScript**: No framework dependencies, pure JS implementation
* **Socket.IO Client**: Real-time communication with the server
* **Clipboard API**: Modern copy functionality with fallback support
* **File Download API**: Browser-based file downloads for exports
* **Responsive CSS**: Mobile-first design with media queries

### **Database**

* **MySQL**: Primary database system (v5.7+ recommended)
* **Prepared Statements**: SQL injection protection
* **Connection Pooling**: Efficient connection management
* **SSL Connections**: Secure data transmission supported

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
│       └── style.css          # Premium Responsive CSS styling
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
   * **Save Connection**: Check this box to save credentials locally for quick access later.
2. **Advanced Options (SSL)**:
   * Click the toggle to reveal SSL settings.
   * **SSL CA Certificate**: Paste your CA certificate content.
   * **SSL Client Certificate**: Paste your client certificate content.
   * **SSL Client Key**: Paste your client key content.
   * **Reject Unauthorized**: Check to verify server integrity (recommended).
3. **Click Connect**: The application will establish a real-time connection
4. **Saved Connections**:
   * Previously saved connections appear in a dropdown menu.
   * Select a saved connection to auto-fill the form.
   * Use the "Delete" (X) button to remove old configurations.
5. **Browse Databases**: Available databases will appear in the left sidebar

### 📋 **Managing Data**


1. **Select a Database**: Click on any database in the sidebar
2. **Choose a Table**: Tables will appear after database selection
3. **View Data**: Use the Data tab to browse table contents
4. **Search Data**: Select a column and enter search terms
5. **Sort Data**: Click any column header to sort
6. **Delete Data**:
   * **Delete All Data**: Quickly remove all records from a table (with confirmation).
   * **Delete Selected**: Select specific rows using checkboxes (requires Primary Key) and delete them in bulk.

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
5. **Copy Results**: Use copy buttons to copy query result data

### 📁 **Exporting Data**

#### **Database Export**
1. **Select a Database** from the sidebar
2. **Click Export DB** button
3. **Choose Options**:
   - Include data or structure only
   - Select specific tables to export
4. **Click Export Database** - file downloads automatically

#### **Table Export**
1. **Select a Table** from the Data or Structure tab
2. **Click Export Table** button
3. **Configure Export**:
   - Include data or structure only
   - Export all data, current filtered data, or custom WHERE clause
   - Preview row count for custom queries
4. **Click Export Table** - SQL file downloads with timestamp

#### **Quick Data Export**
1. **In Data tab**, use **Export Current Data** for filtered results
2. **Copy individual cells** with the copy button in each cell
3. **Copy entire rows** with the row copy button (JSON format)

### 🔄 **Copy Functionality**

* **Cell Copy**: Hover over any cell and click the 📋 button
* **Row Copy**: Click the 📄 button at the start of any row
* **Query Results**: Copy buttons available in SQL query results
* **Visual Feedback**: Buttons animate on successful copy

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
| `delete_all_data` | `{database, table}` | Delete all records from a table |
| `delete_selected_data` | `{database, table, targetColumn, targetValues}` | Delete specific rows by ID |
| `get_table_indexes` | `{database, table}` | Get table indexes |
| `export_database` | `{database, options}` | Export database with options |
| `export_table` | `{database, table, options}` | Export table with options |
| `get_row_count` | `{database, table, whereClause}` | Get row count for preview |

#### Server → Client Events

| Event | Data | Description |
|----|----|----|
| `connection_success` | `{message, connectionId}` | Successful database connection |
| `connection_error` | `{message}` | Connection failure |
| `databases_list` | `[database_names]` | Available databases |
| `tables_list` | `{database, tables}` | Tables in database |
| `table_structure` | `{columns}` | Table column information |
| `table_data` | `{data, total, page, searchColumn, searchValue, sortColumn, sortDirection}` | Table data with metadata |
| `data_deleted` | `{message}` | Confirmation of successful data deletion |
| `query_result` | `{results, message}` | SQL query results |
| `database_exported` | `{filename, content, size}` | Database export file data |
| `table_exported` | `{filename, content, size}` | Table export file data |
| `row_count_result` | `{database, table, count, whereClause}` | Row count for export preview |
| `error` | `{message}` | Error notification |

### Export Options

#### Database Export Options
```javascript
{
  includeData: true,           // Include table data or structure only
  selectedTables: ['table1', 'table2']  // Specific tables to export
}
```

#### Table Export Options
```javascript
{
  includeData: true,           // Include data or structure only
  whereClause: "id > 100",     // Custom WHERE condition
  selectedRows: [0, 1, 2]      // Specific row indices (future feature)
}
```

## 🛡️ Security Features

* **SQL Injection Prevention**: All queries use parameterized statements and proper escaping
* **Input Validation**: Client and server-side input validation
* **Connection Security**: Secure credential handling with session storage
* **Error Handling**: Comprehensive error management without exposing sensitive data
* **Export Security**: Proper data escaping in export files
* **Session Management**: Secure session handling with automatic cleanup

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

* Connection management and pooling
* Database operations (CRUD)
* Table operations (structure, data, indexes)
* Query execution with proper escaping
* Search and sorting functionality
* Export operations (database and table exports)
* Row count calculations for export previews

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
* Export functionality with modal interfaces
* Copy-to-clipboard operations
* File download handling

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
5. **Export Issues**
   * Verify sufficient disk space for large exports
   * Check browser download settings
   * Ensure proper permissions for selected tables
   * For large datasets, export in smaller chunks
6. **Copy Functionality Not Working**
   * Ensure browser supports Clipboard API
   * Check browser permissions for clipboard access
   * Try the copy buttons instead of keyboard shortcuts

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

* **Socket.IO** for real-time bidirectional communication
* **MySQL2** for robust database connectivity with Promise support
* **Express.js** for the lightweight and flexible web framework
* **Node.js** community for excellent ecosystem and tools
* **Modern Web APIs** (Clipboard API, File Download API) for enhanced user experience
* The open-source community for inspiration, tools, and continuous improvement

## 📞 Support

For support, issues, or feature requests:

* **Create an Issue**: [GitHub Issues](https://github.com/mmar58/mysql_handler/issues)
* **Email**: rahmanapu118@gmail.com
* **Documentation**: Check this README for common solutions


---

**Built with ❤️ by [mmar58](https://github.com/mmar58)**

*Happy Database Managing! 🎉*