'use strict'

const User = use('App/Model/User')
const Database = use('Database')
class UserController {
    * index(request, response) {
	const users = yield User.all()
        yield response.sendView('usersIndex', { users: users.toJSON() })

    }

    * profile(request, response) {
	yield response.sendView('userProfile')
    }

    * profileSave(request, response){
    }

    * ajax(request, response){
	const searchKey = request.all().search.value
	var result = { }
	result.draw=1
	result.recordsTotal=57
	result.recordsFiltered=57

//	const users = yield User.findBy('username', 'a')//
	const users = yield Database.from('users').whereRaw('username like "%'+searchKey+'%"')

	result.data = users
	response.status(200).json(result)

	console.log(result)
    }
}

module.exports = UserController
