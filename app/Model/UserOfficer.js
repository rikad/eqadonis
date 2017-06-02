'use strict'

const Lucid = use('Lucid')

class UserOfficer extends Lucid {
static get table () {
            return 'po_users_officers'
          }
}

module.exports = UserOfficer
