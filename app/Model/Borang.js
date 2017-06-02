'use strict'

const Lucid = use('Lucid')

class Borang extends Lucid {
	static get table () {
    	return 'acc_borang'
    }
}

module.exports = Borang
