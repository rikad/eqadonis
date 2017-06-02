'use strict'

const Lucid = use('Lucid')

class PositionRole extends Lucid {
static get table () {
            return 'po_positions_roles'
          }

}

module.exports = PositionRole
