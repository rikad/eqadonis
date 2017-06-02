'use strict'

const Lucid = use('Lucid')

class Template extends Lucid {
	static get table () {
    	return 'acc_templates'
    }
}

module.exports = Template
