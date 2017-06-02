'use strict'

const Schema = use('Schema')

class AccAccreditationsTableSchema extends Schema {

  up () {
    this.create('acc_accreditations', (table) => {
      table.increments()
      table.timestamps()
      table.string('title', 256)
      table.text('description')
      table.integer('year')
      table.integer('level_id')
    })
  }

  down () {
    this.drop('acc_accreditations')
  }

}

module.exports = AccAccreditationsTableSchema
