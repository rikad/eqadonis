'use strict'

const Lucid = use('Lucid')

class Note extends Lucid {
	static get table () {
    	return 'acc_notes'
    }
}

module.exports = Note
