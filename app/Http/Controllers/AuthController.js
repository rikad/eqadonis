'use strict'


const User = use('App/Model/User')
const PeopleUser = use('App/Model/PeopleUser')
const UserOfficer = use('App/Model/UserOfficer')
const Role = use('App/Model/Role')

const Officer = use('App/Model/Officer')
const Position = use('App/Model/Position')
const PositionRole = use('App/Model/PositionRole')
const Organization = use('App/Model/Organization')

const Database = use('Database')

const Hash = use('Hash')

class AuthController {
    * index(request, response) {
        yield response.sendView('login')
    }

    * login(request, response) {
		const username = request.input('username')
        const password = request.input('password')

		try {
	  	const authCheck = yield request.auth.attempt(username, password)
	      	if (authCheck) {

		    	const user = yield User.findBy('id', request.auth.user.id)
		    	user.last_login = new Date()
		    	user.last_ip = request.ip()
		    	yield user.save()

                const role = yield Role.findBy('id', request.auth.user.basic_role)
 


                yield request.session.forget('current_role_id')
                yield request.session.forget('current_role')
                yield request.session.forget('current_position_id')
                yield request.session.forget('current_position')
                yield request.session.forget('current_organization_id')
                yield request.session.forget('current_organization')

               
                yield request.session.put({ current_role_id: request.auth.user.basic_role})
                yield request.session.put({ current_role: role.role_name})
                
				return response.redirect('/pick_role')
	      	}	
		} catch (e) {
			yield response.sendView('login', { error: e.message })
		}
    }

    * logout(request, response) {
        yield request.session.forget('current_role_id')
        yield request.session.forget('current_role')
        yield request.session.forget('current_position_id')
        yield request.session.forget('current_position')
        yield request.session.forget('current_organization_id')
        yield request.session.forget('current_organization')

        yield request.auth.logout()

        return response.redirect('/')
    }

    * list(request, response){
    	//const userOfficer = yield Database.from('po_users_officers').where('user_id', request.auth.user.id).select('officer_id')
    	const officer = yield Database.select('po_users_officers.id','po_people.name', 'organization', 'position').from('po_officers')
    						.innerJoin('po_positions', 'po_officers.position_id', 'po_positions.id')
    						.innerJoin('po_organizations', 'po_officers.organization_id', 'po_organizations.id')
    						.innerJoin('po_people', 'po_officers.person_id', 'po_people.id')
    						.innerJoin('po_users_officers', 'po_users_officers.officer_id', 'po_officers.id')
    						.whereIn('po_users_officers.user_id', request.auth.user.id)

    	//console.log(officer)
        const role = yield Role.findBy('id', request.auth.user.basic_role) 	

    	yield response.sendView('pickRole', { officers: officer, basic: role})
    }

    * listPick(request, response){
        if(request.param('id')=='basic'){
            const role = yield Role.findBy('id', request.auth.user.basic_role)  
            yield request.session.put({ current_role_id: request.auth.user.basic_role})
            yield request.session.put({ current_role: role.role_name})
            
            yield request.session.forget('current_position_id')
            yield request.session.forget('current_position')
            yield request.session.forget('current_organization_id')
            yield request.session.forget('current_organization')            
            
            return response.redirect('/')
        }

    	const userOfficer = yield UserOfficer.findBy('id', request.param('id'))
    	
    	if(userOfficer!=null && userOfficer.user_id==request.auth.user.id){
    		//console.log("ID match")

    		//const user = yield User.findBy('id', request.auth.user.id)
    		//user.current_officer_id = userOfficer.officer_id

    		//console.log(user.current_officer_id)
    		//console.log(userOfficer.officer_id)
    		//yield user.save()

            const officer = yield Officer.findBy('id', userOfficer.officer_id)
            const positionRole = yield PositionRole.findBy('position_id', officer.position_id)

            request.currentUser.position_id = officer.position_id
            request.currentUser.role_id = positionRole.role_id
            request.currentUser.organization_id = officer.organization_id

            const position = yield Position.findBy('id', officer.position_id)
            const organization = yield Organization.findBy('id', officer.organization_id)
            const role = yield Role.findBy('id', positionRole.role_id)

            yield request.session.put({ 
                current_position_id: officer.position_id,
                current_role_id: positionRole.role_id,
                current_organization_id: officer.organization_id,
                current_position: position.position,
                current_organization: organization.organization,
                current_role: role.role_name
            })

    		return response.redirect('/')
    	}else{
    		const error = 'Improper way to choose role is detected'
    		yield response.sendView('error', {error: error})
    	}
    }
}

module.exports = AuthController
