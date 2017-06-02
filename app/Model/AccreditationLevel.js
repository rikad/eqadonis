'use strict'

const Lucid = use('Lucid')

class AccreditationLevel extends Lucid {
	static get table () {
    	return 'acc_level'
    }
}

module.exports = AccreditationLevel
