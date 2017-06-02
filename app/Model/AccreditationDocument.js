'use strict'

const Lucid = use('Lucid')

class AccreditationDocument extends Lucid {
	static get table () {
    	return 'acc_documents'
    }
}

module.exports = AccreditationDocument
