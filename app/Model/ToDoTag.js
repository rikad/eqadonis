'use strict'

const Lucid = use('Lucid')

class ToDoTag extends Lucid {
        static get table () {
            return 'todo_tag'
          }

}

module.exports = ToDoTag
