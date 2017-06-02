'use strict'

const Lucid = use('Lucid')

class Document extends Lucid {
	static get table () {
    	return 'acc_documents'
    }
}

module.exports = Document
