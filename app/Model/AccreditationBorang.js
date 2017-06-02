'use strict'

const Lucid = use('Lucid')

class AccreditationBorang extends Lucid {
	static get table () {
    	return 'acc_borang'
    }
}

module.exports = AccreditationBorang
