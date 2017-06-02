'use strict'

const Schema = use('Schema')

class UsersTableSchema extends Schema {

  up () {
    this.table('users', (table) => {
      table.integer('role_id')
      table.string('reset_hash')
      table.dateTime('created_on')
      table.string('display_name', 254)
    })
  }

  down () {
    this.drop('users')
  }

}

module.exports = UsersTableSchema
