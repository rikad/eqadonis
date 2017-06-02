'use strict'

const Schema = use('Schema')

class AccLevelTableSchema extends Schema {

  up () {
    this.create('acc_level', (table) => {
      table.increments()
      table.timestamps()
      table.string('level',8)
      table.dateTime('created_on')
      table.dateTime('modified_on')
    })
  }

  down () {
    this.drop('acc_level')
  }

}

module.exports = AccLevelTableSchema
