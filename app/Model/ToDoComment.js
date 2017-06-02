'use strict'

const Lucid = use('Lucid')

class ToDoComment extends Lucid {
        static get table () {
            return 'todo_comment'
          }

}

module.exports = ToDoComment
