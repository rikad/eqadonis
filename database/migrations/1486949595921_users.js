'use strict'

const Schema = use('Schema')

class UsersTableSchema extends Schema {

  up () {
    this.table('users', (table) => {
      // alter users table
	table.renameColumn('password', 'password_hash')
	table.dateTime('last_login')
	table.string('last_ip', 45)
	table.integer('deleted')
	table.integer('reset_by')
	table.integer('banned')
	table.string('ban_message', 255)
	table.date('display_name_changed')
	table.string('timezone', 40)
	table.string('language', 20)
	table.integer('active')
	table.string('activate_hash', 40)
	table.integer('force_password_reset')
    })
  }

  down () {
    this.table('users', (table) => {
      // opposite of up goes here
    })
  }

}

module.exports = UsersTableSchema
