'use strict'

const Lucid = use('Lucid')

class ToDo extends Lucid {
        static get table () {
            return 'todo'
          }

}

module.exports = ToDo
