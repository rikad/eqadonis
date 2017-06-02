'use strict'


const User = use('App/Model/User')
const Hash = use('Hash')

class RegisterController {
    * index(request, response) {
        yield response.sendView('register')
    }

    * doRegister(request, response) {
        const user = new User()
	user.display_name = request.input('displayname')
        user.username = request.input('username')
        user.email = request.input('email')
        user.password_hash = yield Hash.make(request.input('password'))

	try {
	        yield user.save()

	        var registerMessage = {
	            success: 'Registration Successful!'
	        }

	        yield response.sendView('register', { registerMessage : registerMessage })
	}catch(e){
		yield response.sendView('register', { error: 'Email/username already used' })
	}
    }
}

module.exports = RegisterController
