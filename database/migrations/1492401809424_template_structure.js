'use strict'

const Schema = use('Schema')

class AccTemplateStructuresTableSchema extends Schema {

  up () {
    this.create('acc_template_structures', (table) => {
      table.increments()
      table.timestamps()
      table.integer('template_id')
      table.integer('parent_id')
      table.string('title', 256)
      table.text('description')
      table.text('tooltip')
      table.string('format', 64)
      table.string('model', 64)
      table.dateTime('created_on')
      table.dateTime('modified_on')
    })
  }

  down () {
    this.drop('acc_template_structures')
  }

}

module.exports = AccTemplateStructuresTableSchema
