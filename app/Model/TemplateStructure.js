'use strict'

const Lucid = use('Lucid')

class TemplateStructure extends Lucid {
	static get table () {
    	return 'acc_template_structures'
    }
}

module.exports = TemplateStructure
