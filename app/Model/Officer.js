'use strict'

const Lucid = use('Lucid')

class Officer extends Lucid {
	static get table () {
	    return 'po_officers'
	  }
}

module.exports = Officer
