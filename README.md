# MySQL Database Manager

A web-based MySQL database management tool built with Node.js, Express.js, Socket.IO, and HTML/CSS/JavaScript.

## Features

- **Real-time Database Connection**: Connect to MySQL databases using Socket.IO for real-time communication
- **Database Management**: View, create, and drop databases
- **Table Operations**: Browse tables, view structure, and data
- **Data Viewing**: Paginated data viewing with customizable page sizes
- **SQL Query Execution**: Execute custom SQL queries with results display
- **Responsive UI**: Clean, modern interface that works on desktop and mobile
- **Real-time Notifications**: Get instant feedback on operations

## Prerequisites

- Node.js (v14 or higher)
- MySQL Server
- npm or yarn package manager

## Installation

1. Clone or download this repository
2. Navigate to the project directory:
   ```bash
   cd mysql_handler
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. (Optional) Configure environment variables:
   - Copy `.env` file and modify as needed
   - Default port is 3000

## Usage

### Starting the Server

#### Development Mode (with auto-restart):
```bash
npm run dev
```

#### Production Mode:
```bash
npm start
```

The application will be available at `http://localhost:3000`

### Connecting to Database

1. Open your web browser and go to `http://localhost:3000`
2. Fill in your MySQL connection details:
   - **Host**: MySQL server hostname (default: localhost)
   - **Port**: MySQL server port (default: 3306)
   - **Username**: Your MySQL username
   - **Password**: Your MySQL password

3. Click "Connect" to establish connection

### Using the Interface

#### Database Operations
- **View Databases**: All available databases are listed in the sidebar
- **Select Database**: Click on a database name to select it and view its tables
- **Create Database**: Click "Create DB" button and enter the new database name
- **Refresh**: Click "Refresh" to reload the databases list

#### Table Operations
- **View Tables**: Tables from the selected database appear in the sidebar
- **Select Table**: Click on a table name to view its data and structure
- **Data Tab**: View table data with pagination controls
- **Structure Tab**: View table schema (columns, types, keys, etc.)
- **Pagination**: Navigate through data using Previous/Next buttons and page size selector

#### SQL Query Execution
- **Query Tab**: Switch to the SQL Query tab
- **Database Selection**: Choose which database to run queries against
- **Write Queries**: Enter SQL commands in the text area
- **Execute**: Click "Execute Query" or use Ctrl+Enter
- **View Results**: Results appear below the query area

### Supported SQL Operations

- **SELECT**: View query results in a formatted table
- **INSERT**: Add new data to tables
- **UPDATE**: Modify existing data
- **DELETE**: Remove data from tables
- **CREATE**: Create new tables or databases
- **DROP**: Remove tables or databases
- **ALTER**: Modify table structures
- **And more**: Most standard SQL commands are supported

## Security Notes

⚠️ **Important Security Considerations:**

1. **Development Use**: This tool is designed for development and administrative use
2. **Network Security**: Avoid exposing this application to public networks without proper security measures
3. **Database Credentials**: Never commit real database credentials to version control
4. **SQL Injection**: While the tool uses parameterized queries where possible, be careful with dynamic query construction
5. **Access Control**: Consider implementing authentication if deploying in multi-user environments

## Configuration

### Environment Variables

Create a `.env` file to customize settings:

```env
PORT=3000                    # Server port
CORS_ORIGIN=*               # CORS configuration
DB_CONNECTION_TIMEOUT=60000 # Database connection timeout
DB_ACQUIRE_TIMEOUT=60000    # Connection acquire timeout
MAX_ROWS_PER_PAGE=1000      # Maximum rows per page
DEFAULT_PAGE_SIZE=100       # Default page size
```

### Database Connection Settings

The application supports standard MySQL connection parameters:
- Host (IP address or hostname)
- Port (default: 3306)
- Username
- Password
- Connection timeout settings

## File Structure

```
mysql_handler/
├── src/
│   ├── server.js                 # Main server file
│   ├── database/
│   │   └── DatabaseManager.js    # Database operations class
│   └── public/
│       ├── index.html            # Main HTML interface
│       ├── style.css             # Styling
│       └── app.js                # Frontend JavaScript
├── package.json                  # Dependencies and scripts
├── .env                         # Environment variables
└── README.md                    # This file
```

## API Events (Socket.IO)

### Client to Server
- `connect_database` - Establish database connection
- `disconnect_database` - Close database connection
- `get_databases` - Retrieve list of databases
- `get_tables` - Get tables from a database
- `get_table_structure` - Get table schema
- `get_table_data` - Retrieve table data with pagination
- `execute_query` - Run custom SQL query
- `create_database` - Create new database
- `drop_database` - Delete database

### Server to Client
- `connection_success` - Database connected successfully
- `connection_error` - Database connection failed
- `databases_list` - List of available databases
- `tables_list` - List of tables in database
- `table_structure` - Table schema information
- `table_data` - Table data with pagination info
- `query_result` - SQL query execution results
- `error` - Error messages

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check if MySQL server is running
   - Verify host and port settings
   - Check firewall settings

2. **Authentication Failed**
   - Verify username and password
   - Check MySQL user permissions
   - Ensure user has necessary privileges

3. **Permission Denied**
   - Grant appropriate MySQL privileges to user
   - For database creation: GRANT CREATE ON *.* TO 'username'@'host'
   - For data modification: GRANT INSERT, UPDATE, DELETE ON database.* TO 'username'@'host'

4. **Large Result Sets**
   - Use pagination controls to limit data retrieval
   - Adjust page size for better performance
   - Use WHERE clauses in custom queries to filter data

### Performance Tips

- Use appropriate page sizes for large tables
- Create indexes on frequently queried columns
- Use LIMIT clauses in custom queries
- Close connections when not needed

## License

MIT License - see package.json for details

## Contributing

Feel free to submit issues, feature requests, or pull requests to improve this tool.
