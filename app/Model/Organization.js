'use strict'

const Lucid = use('Lucid')

class Organization extends Lucid {
        static get table () {
            return 'po_organizations'
          }

}

module.exports = Organization
