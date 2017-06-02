'use strict'

const Schema = use('Schema')

class AccTemplatesTableSchema extends Schema {

  up () {
    this.create('acc_templates', (table) => {
      table.increments()
      table.timestamps()
      table.integer('accreditation_id')
      table.integer('form_id')
      table.string('title', 256)
      table.text('description')
      table.dateTime('created_on')
      table.dateTime('modified_on')
    })
  }

  down () {
    this.drop('acc_templates')
  }

}

module.exports = AccTemplatesTableSchema
