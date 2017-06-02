'use strict'

const People = use('App/Model/People')
const PeopleUser = use('App/Model/PeopleUser')

const User = use('App/Model/User')
const Hash = use('Hash')
const Officer = use('App/Model/Officer')
const UserOfficer = use('App/Model/UserOfficer')

const Database = use('Database')

const error_primary = 'Please use your primary account to access this feature'

class DefaultController {
    
    * index(request, response) {
        const peopleUser = yield PeopleUser.findBy('user_id', request.auth.user.id)
        if(peopleUser.is_primary==0){
            yield response.sendView('errors/index', {error:error_primary})
            return
        }

        const people = yield People.findBy('id', peopleUser.person_id)

        //const userOfficer = Database.from('po_users_officers').where('user_id', request.auth.user.id).select('officer_id')
        if(request.param(0)==0){
        var queries = yield Database.select('po_officers.id','organization', 'position').from('po_officers')
                            .innerJoin('po_positions', 'po_officers.position_id', 'po_positions.id')
                            .innerJoin('po_organizations', 'po_officers.organization_id', 'po_organizations.id')
                            .whereIn('po_officers.person_id', people.id)
        }else{
        var queries = yield Database.select('user_id','username', 'is_primary').from('po_people_users')
                            .innerJoin('users', 'po_people_users.user_id', 'users.id')
                            .whereIn('po_people_users.person_id', people.id)
        }


        yield response.sendView('userManagement/index', { person: people, queries: queries, tab: request.param(0)})
    }

    * primary(request, response) {
        const peopleUser = yield PeopleUser.findBy('user_id', request.auth.user.id)
        if(peopleUser.is_primary==0){
            yield response.sendView('errors/index', {error:error_primary})
            return
        }

        yield Database.table('po_people_users').where('person_id', peopleUser.person_id)
                                .update('is_primary', '0')
        
        yield Database.table('po_people_users')
                                .where({person_id: peopleUser.person_id, user_id: request.param(0)})
                                .update('is_primary', '1')

        return response.redirect('/userManagement/index/2')
    }

    * addNew(request, response){
        const peopleUser = yield PeopleUser.findBy('user_id', request.auth.user.id)
        if(peopleUser.is_primary==0){
            yield response.sendView('errors/index', {error:error_primary})
            return
        }

        const people = yield People.findBy('id', peopleUser.person_id)

        yield response.sendView('userManagement/new', {person:people})   
    }

    * addNewPost(request, response){
        const peopleUser0 = yield PeopleUser.findBy('user_id', request.auth.user.id)
        if(peopleUser0.is_primary==0){
            yield response.sendView('errors/index', {error:error_primary})
            return
        }

        const officer = yield Officer.query().where('person_id', peopleUser0.person_id).first()

        const user = new User()
        user.display_name = request.input('displayname')
        user.username = request.input('username')
        user.email = request.input('email')
        user.password_hash = yield Hash.make(request.input('password'))
        user.current_officer_id = officer.id
        user.basic_role = request.currentUser.basic_role

        try {
            yield user.save()

            const newUser = yield User.findBy('username', request.input('username'))
            
            const peopleUser = new PeopleUser()
            peopleUser.user_id = newUser.id
            peopleUser.person_id = peopleUser0.person_id
            peopleUser.is_primary = 0

            const userOfficer = new UserOfficer()
            userOfficer.user_id = newUser.id
            userOfficer.officer_id = officer.id


            try {
                yield peopleUser.save()
                yield userOfficer.save()

                return response.redirect('/userManagement/index/2')           
            }catch(e){
                yield response.sendView('userManagement/new', { error: e })
            }
        }catch(e){
        yield response.sendView('userManagement/new', { error: 'Email/username already used' })
        }
    }


    * edit(request, response){
        const peopleUser = yield PeopleUser.findBy('user_id', request.auth.user.id)
        if(peopleUser.is_primary==0){
            yield response.sendView('errors/index', {error:error_primary})
            return
        }

        const people = yield People.findBy('id', peopleUser.person_id)
        const user = yield User.findBy('id', request.gets[0])

        yield response.sendView('userManagement/edit', {person:people, user:user})   
    }
    * editPost(request, response){
        const peopleUser = yield PeopleUser.findBy('user_id', request.auth.user.id)
        if(peopleUser.is_primary==0){
            yield response.sendView('errors/index', {error:error_primary})
            return
        }

        const user = yield User.findBy('id', request.gets[0])
        user.username = request.input('username')
        user.displayname = request.input('displayname')
        user.email = request.input('email')
    }

    /*

select username, uo.id
from po_people_users pu

inner join users
on pu.user_id=users.id

left join po_users_officers uo
on uo.user_id=pu.user_id and uo.officer_id=4
    */

    * officer(request, response) {
        const peopleUser = yield PeopleUser.findBy('user_id', request.auth.user.id)
        if(peopleUser.is_primary==0){
            yield response.sendView('errors/index', {error:error_primary})
            return
        }

        const people = yield People.findBy('id', peopleUser.person_id)

        const info = yield Database.select('organization', 'position').from('po_officers')
                            .innerJoin('po_positions', 'po_officers.position_id', 'po_positions.id')
                            .innerJoin('po_organizations', 'po_officers.organization_id', 'po_organizations.id')
                            .where('po_officers.id', request.param(0)).first()
                            

        const officer = yield Officer.query().where({'id':request.param(0),'person_id':people.id}).first()

        if(officer==null){
            yield response.sendView('userManagement/officer', {error: 'Violation of access. Please turn back',
                    info: info, person: people, link: '/userManagement/'})
        }else{

        
        const users = yield Database.select('username', 'po_people_users.user_id', 'po_users_officers.id')
                            .from('po_people_users')
                            .innerJoin('users', 'po_people_users.user_id', 'users.id')
                            .leftJoin('po_users_officers', function(){
                                this
                                    .on('po_users_officers.user_id', 'po_people_users.user_id')
                                    .andOn('po_users_officers.officer_id', parseInt(request.param(0)))
                            })
                            .where({
                                'po_people_users.person_id': peopleUser.person_id
                            })

        yield response.sendView('userManagement/officer', {users: users, info: info, person: people, officer_id: request.param(0)})
        }
    } 

    * officerGrant(request, response){
        const param = request.param(0).split("/")
        const peopleUser = yield PeopleUser.findBy('user_id', request.auth.user.id)
        if(peopleUser.is_primary==0){
            yield response.sendView('errors/index', {error:error_primary})
            return
        }

        const peopleUserCheck = yield PeopleUser.query().where({'user_id':param[0],'person_id':peopleUser.person_id}).first()
        const officerCheck = yield Officer.query().where({'id':param[1],'person_id':peopleUser.person_id}).first()

        if(param.length<2||peopleUserCheck==null||officerCheck==null){yield response.sendView('errors/index', 
                            {error:'Violation of Access. Please turn back'}) 
                            return}

        const userOfficer = new UserOfficer()
        userOfficer.user_id = param[0]
        userOfficer.officer_id = param[1]

        try {
             yield userOfficer.save()

            return response.redirect('/userManagement/officer/'+param[1])           
            }catch(e){
                yield response.sendView('errors/index', { error: e })
            }
    }

    * officerRevoke(request, response){
        const param = request.param(0).split("/")
        const peopleUser = yield PeopleUser.findBy('user_id', request.auth.user.id)
        if(peopleUser.is_primary==0){
            yield response.sendView('errors/index', {error:error_primary})
            return
        }

        const userOfficerCheck = yield UserOfficer.query().where({'id':param[0]}).first()
        const officerCheck = yield Officer.query().where({'id':userOfficerCheck.officer_id,'person_id':peopleUser.person_id}).first()

        if(param.length<2||officerCheck==null){yield response.sendView('errors/index', 
                            {error:'Violation of Access. Please turn back'})
                            return}

        const userOfficer = yield UserOfficer.findBy('id', param[0])
        

        try {
             yield userOfficer.delete()

            return response.redirect('/userManagement/officer/'+param[1])           
            }catch(e){
                yield response.sendView('errors/index', { error: e })
            }
    }


/*
select position, organization, uo.id
from po_officers o

inner join po_positions p
on p.id=o.position_id

inner join po_organizations org
on org.id=o.organization_id

left join po_users_officers uo
on uo.officer_id=o.id and uo.user_id=34

where o.person_id=1
*/
    * account(request, response) {
        const peopleUser = yield PeopleUser.findBy('user_id', request.auth.user.id)
        if(peopleUser.is_primary==0){
            yield response.sendView('errors/index', {error:error_primary})
            return
        }

        const people = yield People.findBy('id', peopleUser.person_id)
        const user = yield User.findBy('id', request.param(0))
        
        const peopleUserCheck = yield PeopleUser.query().where({'user_id':request.param(0),'person_id':people.id}).first()

        if(peopleUserCheck==null){
            yield response.sendView('userManagement/account', {error: 'Violation of access. Please turn back',
                    person: people, user: user, link: '/userManagement/index/2'})
        }else{

        
        const officers = yield Database.select('position','organization',
                                 'po_officers.id as officer_id', 'po_users_officers.id')
                            .from('po_officers')
                            .innerJoin('po_positions', 'po_positions.id', 'po_officers.position_id')
                            .innerJoin('po_organizations', 'po_organizations.id', 'po_officers.organization_id')
                            .leftJoin('po_users_officers', function(){
                                this
                                    .on('po_users_officers.officer_id', 'po_officers.id')
                                    .andOn('po_users_officers.user_id', parseInt(request.param(0)))
                            })
                            .where({
                                'po_officers.person_id': peopleUser.person_id
                            })

        yield response.sendView('userManagement/account', {user: user, person:people, officers:officers, 
                user_id: request.param(0)})
        }
    }

    * accountGrant(request, response){
        const param = request.param(0).split("/")
        const peopleUser = yield PeopleUser.findBy('user_id', request.auth.user.id)
        if(peopleUser.is_primary==0){
            yield response.sendView('errors/index', {error:error_primary})
            return
        }

        const peopleUserCheck = yield PeopleUser.query().where({'user_id':param[1],'person_id':peopleUser.person_id}).first()
        const officerCheck = yield Officer.query().where({'id':param[0],'person_id':peopleUser.person_id}).first()

        if(param.length<2||peopleUserCheck==null||officerCheck==null){yield response.sendView('errors/index', 
                            {error:'Violation of Access. Please turn back'}) 
                            return}

        const userOfficer = new UserOfficer()
        userOfficer.user_id = param[1]
        userOfficer.officer_id = param[0]

        try {
             yield userOfficer.save()

            return response.redirect('/userManagement/account/'+param[1])           
            }catch(e){
                yield response.sendView('errors/index', { error: e })
            }
    }

    * accountRevoke(request, response){
        const param = request.param(0).split("/")
        const peopleUser = yield PeopleUser.findBy('user_id', request.auth.user.id)
        if(peopleUser.is_primary==0){
            yield response.sendView('errors/index', {error:error_primary})
            return
        }

        const userOfficerCheck = yield UserOfficer.query().where({'id':param[0]}).first()
        const officerCheck = yield Officer.query().where({'id':userOfficerCheck.officer_id,'person_id':peopleUser.person_id}).first()

        if(param.length<2||officerCheck==null){yield response.sendView('errors/index', 
                            {error:'Violation of Access. Please turn back'})
                            return}

        const userOfficer = yield UserOfficer.findBy('id', param[0])
        

        try {
             yield userOfficer.delete()

            return response.redirect('/userManagement/account/'+param[1])
            }catch(e){
                yield response.sendView('errors/index', { error: e })
            }
    }

}

module.exports = DefaultController