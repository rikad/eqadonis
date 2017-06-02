'use strict'

const Lucid = use('Lucid')

class Form extends Lucid {
	static get table () {
	    return 'po_forms'
	  }
}

module.exports = Form
