var path = require('path')
// Update with your config settings.

module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: path.resolve(__dirname, 'dev.sqlite3')
    },
    migrations: {
      directory: path.resolve(__dirname, 'migrations')
    }
  }
}
