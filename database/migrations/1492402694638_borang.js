'use strict'

const Schema = use('Schema')

class AccBorangTableSchema extends Schema {

  up () {
    this.create('acc_borang', (table) => {
      table.increments()
      table.timestamps()
      table.integer('organization_id')
      table.integer('accreditation_id')
      table.dateTime('created_on')
      table.dateTime('modified_on')
    })
  }

  down () {
    this.drop('acc_borang')
  }

}

module.exports = AccBorangTableSchema
