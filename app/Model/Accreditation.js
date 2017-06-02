'use strict'

const Lucid = use('Lucid')

class Accreditation extends Lucid {
	static get table () {
    	return 'acc_accreditations'
    }
}

module.exports = Accreditation
