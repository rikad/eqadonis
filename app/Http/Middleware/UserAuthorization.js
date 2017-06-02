'use strict'

const Module = use('App/Model/Module')
const RoleModule = use('App/Model/RoleModule')

class UserAuthorization {

  * handle (request, response, next) {
    // here goes your middleware logic
    // yield next to pass the request to next middleware or controller
    const controller = request.param('controller').charAt(0).toUpperCase() + request.param('controller').slice(1)
    
    request.controller = controller
    const module = yield Module.findBy('module', controller)

    if(request.currentUser==null){
        return response.redirect('/login')
    }

    if(module==null){
        yield response.sendView('errors/index', {error:'Module '+controller+' not found'})
        return
    }

    var roleModule = yield RoleModule.query().where({'role_id':request.currentUser.role_id,
    													'module_id':module.id}).first()

    if(roleModule==null){
    	/*roleModule = yield RoleModule.query().where({'role_id':'-1',
    													'module_id':module.id}).first()*/
        var roleModule = yield RoleModule.query().where({'role_id':request.currentUser.basic_role,
                                                        'module_id':module.id}).first()
    }

    if(roleModule==null){
        //Default permission from module, not used anymore
        var roleModule = new RoleModule()
        roleModule.module_id = module.id
        roleModule.can_create = module.can_create
        roleModule.can_read = module.can_read
        roleModule.can_update = module.can_update
        roleModule.can_delete = module.can_delete
    }

    if(roleModule==null){
        yield response.sendView('errors/index', {error:'You dont have permission to access this module'})
        return
    }

    if(roleModule.custom!=null&&roleModule.custom!=''){
        request.fileController=roleModule.custom.charAt(0).toUpperCase()+roleModule.custom.slice(1)
    }

    if(roleModule.can_read==0){
    	yield response.sendView('errors/index', {error:'You dont have permission to access this module'})
        return
    }

    request.permission = roleModule

    if(request.auth.user==null){
	return response.redirect('/login')
    }
    yield next
  }

}

module.exports = UserAuthorization
