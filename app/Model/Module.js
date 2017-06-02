'use strict'

const Lucid = use('Lucid')

class Module extends Lucid {
static get table () {
            return 'modules'
          }
}

module.exports = Module
