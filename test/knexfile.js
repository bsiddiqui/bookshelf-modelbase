var path = require('path')
// Update with your config settings.

module.exports = {
  development: {
    client: 'sqlite3',
    connection: ':memory:',
    pool: {
      max: 1,
      min: 1
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.resolve(__dirname, 'migrations')
    }
  }
}
