'use strict'

const Schema = use('Schema')

class AccNotesTableSchema extends Schema {

  up () {
    this.create('acc_notes', (table) => {
      table.increments()
      table.timestamps()
      table.integer('document_id')
      table.integer('structure_id')
      table.dateTime('created_on')
      table.dateTime('modified_on')
    })
  }

  down () {
    this.drop('acc_notes')
  }

}

module.exports = AccNotesTableSchema
