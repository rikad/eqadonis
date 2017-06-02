'use strict'

const Lucid = use('Lucid')

class Roles extends Lucid {
        static get table () {
            return 'roles'
          }
}

module.exports = Roles
