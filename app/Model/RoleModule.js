'use strict'

const Lucid = use('Lucid')

class RoleModule extends Lucid {
static get table () {
            return 'roles_modules'
          }

}

module.exports = RoleModule
