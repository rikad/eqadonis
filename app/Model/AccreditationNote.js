'use strict'

const Lucid = use('Lucid')

class AccreditationNote extends Lucid {
		static get table () {
            return 'accreditation_notes'
        }
}

module.exports = AccreditationNote
