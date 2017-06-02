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
    
    * index(request, response){
        const people = yield People.all()
        yield response.sendView('userManagement/admin/index', {people:people.toJSON()})
    }

    * person(request, response) {
        const people = yield People.findBy('id', request.gets[0])

        //const userOfficer = Database.from('po_users_officers').where('user_id', request.auth.user.id).select('officer_id')
        if(request.gets[1]==null){
        var queries = yield Database.select('po_officers.id','organization', 'position').from('po_officers')
                            .innerJoin('po_positions', 'po_officers.position_id', 'po_positions.id')
                            .innerJoin('po_organizations', 'po_officers.organization_id', 'po_organizations.id')
                            .whereIn('po_officers.person_id', people.id)
        }else{
        var queries = yield Database.select('user_id','username', 'is_primary').from('po_people_users')
                            .innerJoin('users', 'po_people_users.user_id', 'users.id')
                            .whereIn('po_people_users.person_id', people.id)
        }

        yield response.sendView('userManagement/admin/person', { person: people, queries: queries, tab: request.gets[1]})
    }

    * primary(request, response) {
        //const peopleUser = yield PeopleUser.findBy('user_id', request.auth.user.id)

        yield Database.table('po_people_users').where('person_id', request.gets[0])
                                .update('is_primary', '0')
        
        yield Database.table('po_people_users')
                                .where({person_id: request.gets[0], user_id: request.gets[1]})
                                .update('is_primary', '1')

        return response.redirect('/userManagement/person/'+request.gets[0]+'/2')
    }

    * addNew(request, response){
        //const peopleUser = yield PeopleUser.findBy('user_id', request.auth.user.id)
        
        const people = yield People.findBy('id', request.gets[0])

        yield response.sendView('userManagement/admin/new', {person:people})   
    }

    * addNewPost(request, response){
        const officer = yield Officer.query().where('person_id', request.gets[0]).first()
        const people = yield People.findBy('id', request.gets[0])
        const peopleUser = yield PeopleUser.query().where({person_id: request.gets[0], is_primary: 1}).first()
        const user0 = yield User.findBy('id', peopleUser.user_id)

        const user = new User()
        user.display_name = request.input('displayname')
        user.username = request.input('username')
        user.email = request.input('email')
        user.password_hash = yield Hash.make(request.input('password'))
        user.current_officer_id = user0.current_officer_id
        user.basic_role = user0.basic_role

        try {
            yield user.save()

            const newUser = yield User.findBy('username', request.input('username'))
            
            const peopleUser = new PeopleUser()
            peopleUser.user_id = newUser.id
            peopleUser.person_id = request.gets[0]
            peopleUser.is_primary = 0

            const userOfficer = new UserOfficer()
            userOfficer.user_id = newUser.id
            userOfficer.officer_id = officer.id

            try {
                yield peopleUser.save()
                yield userOfficer.save()

                return response.redirect('/userManagement/person/'+request.gets[0]+'/2')           
            }catch(e){
                yield response.sendView('userManagement/admin/new', { error: e , person:people})
            }
        }catch(e){
        yield response.sendView('userManagement/admin/new', { error: 'Email/username already used', person:people })
        }
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
        

        const people = yield People.findBy('id', request.gets[0])

        const info = yield Database.select('organization', 'position').from('po_officers')
                            .innerJoin('po_positions', 'po_officers.position_id', 'po_positions.id')
                            .innerJoin('po_organizations', 'po_officers.organization_id', 'po_organizations.id')
                            .where('po_officers.id', request.gets[1]).first()
                            

        const officer = yield Officer.query().where({'id':request.gets[1],'person_id':people.id}).first()

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
                                    .andOn('po_users_officers.officer_id', parseInt(request.gets[1]))
                            })
                            .where({
                                'po_people_users.person_id': request.gets[0]
                            })

        yield response.sendView('userManagement/admin/officer', {users: users, info: info, person: people, officer_id: request.gets[1]})
        }
    } 

    * officerGrant(request, response){
        const peopleUserCheck = yield PeopleUser.query().where({'user_id':request.gets[0],'person_id':request.gets[2]}).first()
        const officerCheck = yield Officer.query().where({'id':request.gets[1],'person_id':request.gets[2]}).first()

        if(peopleUserCheck==null||officerCheck==null){yield response.sendView('errors/index', 
                            {error:'Violation of Access. Please turn back'}) 
                            return}

        const userOfficer = new UserOfficer()
        userOfficer.user_id = request.gets[0]
        userOfficer.officer_id = request.gets[1]

        try {
             yield userOfficer.save()

            return response.redirect('/userManagement/officer/'+request.gets[2]+'/'+request.gets[1])
            }catch(e){
                yield response.sendView('errors/index', { error: e })
            }
    }

    * officerRevoke(request, response){
        const userOfficerCheck = yield UserOfficer.query().where({'id':request.gets[0]}).first()
        const officerCheck = yield Officer.query().where({'id':userOfficerCheck.officer_id,'person_id':request.gets[2]}).first()

        if(officerCheck==null){yield response.sendView('errors/index', 
                            {error:'Violation of Access. Please turn back'})
                            return}

        const userOfficer = yield UserOfficer.findBy('id', request.gets[0])
        

        try {
             yield userOfficer.delete()

            return response.redirect('/userManagement/officer/'+request.gets[2]+'/'+request.gets[1])           
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
        
        const people = yield People.findBy('id', request.gets[0])
        const user = yield User.findBy('id', request.gets[1])
        
        const peopleUserCheck = yield PeopleUser.query().where({'user_id':request.gets[1],'person_id':request.gets[0]}).first()

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
                                    .andOn('po_users_officers.user_id', parseInt(request.gets[1]))
                            })
                            .where({
                                'po_officers.person_id': request.gets[0]
                            })

        yield response.sendView('userManagement/admin/account', {user: user, person:people, officers:officers, 
                user_id: request.gets[1]})
        }
    }

    * accountGrant(request, response){
        const peopleUserCheck = yield PeopleUser.query().where({'user_id':request.gets[1],'person_id':request.gets[2]}).first()
        const officerCheck = yield Officer.query().where({'id':request.gets[0],'person_id':request.gets[2]}).first()

        if(peopleUserCheck==null||officerCheck==null){yield response.sendView('errors/index', 
                            {error:'Violation of Access. Please turn back'}) 
                            return}

        const userOfficer = new UserOfficer()
        userOfficer.user_id = request.gets[1]
        userOfficer.officer_id = request.gets[0]

        try {
             yield userOfficer.save()

            return response.redirect('/userManagement/account/'+request.gets[2]+'/'+request.gets[1])           
            }catch(e){
                yield response.sendView('errors/index', { error: e })
            }
    }

    * accountRevoke(request, response){
        const userOfficerCheck = yield UserOfficer.query().where({'id':request.gets[0]}).first()
        const officerCheck = yield Officer.query().where({'id':userOfficerCheck.officer_id,'person_id':request.gets[2]}).first()

        if(officerCheck==null){yield response.sendView('errors/index', 
                            {error:'Violation of Access. Please turn back'})
                            return}

        const userOfficer = yield UserOfficer.findBy('id', request.gets[0])
        

        try {
             yield userOfficer.delete()

            return response.redirect('/userManagement/account/'+request.gets[2]+'/'+request.gets[1])
            }catch(e){
                yield response.sendView('errors/index', { error: e })
            }
    }

}

module.exports = DefaultController