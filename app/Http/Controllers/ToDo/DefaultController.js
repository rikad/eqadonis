'use strict'


const Database = use('Database')
const ToDo = use('App/Model/ToDo')
const ToDoTag = use('App/Model/ToDoTag')
const ToDoComment = use('App/Model/ToDoComment')

const People = use('App/Model/People')
const PeopleUser = use('App/Model/PeopleUser')



class DefaultController {
    
    * index(request, response) {
        /*console.log(fs.readdirSync('app/Http/Controllers/')
        .filter(file => fs.statSync(path.join('app/Http/Controllers/', file)).isDirectory()))*/

        const toDo = yield Database.select('todo.*','todo_tag.tag').from('todo')
                            .innerJoin('todo_tag', 'todo_tag.id', 'todo.tag_id')
        yield response.sendView('toDo/index', {permission : request.permission, todos:toDo})
    }

    * addNew(request, response) {
        if(request.permission.can_create==0){
            yield response.sendView('errors/index', {error:'You dont have permission to access this module'})
        }

        yield response.sendView('toDo/new')
    }

    * addNewPost(request, response) {
        if(request.permission.can_create==0){
            yield response.sendView('errors/index', {error:'You dont have permission to access this module'})
        }

        var tag = null
        if(request.input('customtag')==''){
            tag = request.input('tag')
        }else{
            tag = request.input('customtag')
        }

        var toDoTagCheck = yield ToDoTag.findBy('tag', tag)
        if(toDoTagCheck==null){
            const toDoTag = new ToDoTag()    
            toDoTag.tag = tag
            yield toDoTag.save()

            toDoTagCheck = yield ToDoTag.findBy('tag', tag)
        }

        const toDo = new ToDo()
        toDo.title = request.input('title')
        toDo.description = request.input('description')
        toDo.tag_id = toDoTagCheck.id
        
        yield toDo.save()

        return response.redirect('/toDo/')
    }

    * delete(request, response) {
        if(request.permission.can_delete==0){
            yield response.sendView('errors/index', {error:'You dont have permission to access this module'})
        }

        const toDo = yield ToDo.findBy('id', request.param(0))
        yield toDo.delete()

        return response.redirect('/toDo/')
    }

    * detail(request, response) {
        const toDo = yield Database.select('todo.*','todo_tag.tag').from('todo')
                            .innerJoin('todo_tag', 'todo_tag.id', 'todo.tag_id')
                            .where('todo.id', request.param(0)).first()
                            

        const toDoComment = yield Database.select('todo_comment.*','po_people.name').from('todo_comment')
                            .leftJoin('po_people', 'po_people.id', 'todo_comment.person_id')
                            .where('todo_comment.todo_id', parseInt(request.param(0)))
                            //console.log(toDoComment)
                                                
        yield response.sendView('toDo/detail', {permission : request.permission, todo:toDo, comments:toDoComment})   
    }

    * progressPost(request, response) {
        const peopleUser = yield PeopleUser.findBy('user_id', request.auth.user.id)
        const people = yield People.findBy('id', peopleUser.person_id)

        const toDo = yield ToDo.findBy('id', request.param(0))
        toDo.progress = request.input('progress')
        yield toDo.save()

        const toDoComment = new ToDoComment()
        toDoComment.todo_id=request.param(0)
        toDoComment.person_id='-1'
        toDoComment.comment=people.name+' change progress to '+request.input('progress')+'%'
        yield toDoComment.save()

        return response.redirect('/toDo/detail/'+request.param(0))
    }

    * commentPost(request, response) {
        const peopleUser = yield PeopleUser.findBy('user_id', request.auth.user.id)

        const toDoComment = new ToDoComment()
        toDoComment.todo_id=request.param(0)
        toDoComment.person_id=peopleUser.person_id
        toDoComment.comment=request.input('comment')
        yield toDoComment.save()

        return response.redirect('/toDo/detail/'+request.param(0))
    }

}

module.exports = DefaultController