'use strict'

const Schema = use('Schema')

class AccDocumentsTableSchema extends Schema {

  up () {
    this.create('acc_documents', (table) => {
      table.increments()
      table.timestamps()
      table.integer('borang_id')
      table.integer('template_id')
      table.dateTime('created_on')
      table.dateTime('modified_on')
    })
  }

  down () {
    this.drop('acc_documents')
  }

}

module.exports = AccDocumentsTableSchema
