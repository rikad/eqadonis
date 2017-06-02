'use strict'

const Lucid = use('Lucid')

class Position extends Lucid {
static get table () {
            return 'po_positions'
          }

}

module.exports = Position
