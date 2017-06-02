'use strict'

const Lucid = use('Lucid')

class PeopleUser extends Lucid {
        static get table () {
            return 'po_people_users'
          }
}

module.exports = PeopleUser
