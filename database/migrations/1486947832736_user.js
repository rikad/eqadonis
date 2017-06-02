'use strict'

const Schema = use('Schema')

class UserTableSchema extends Schema {

  up () {
    this.table('user', (table) => {
      // alter user table
    })
  }

  down () {
    this.table('user', (table) => {
      // opposite of up goes here
    })
  }

}

module.exports = UserTableSchema
