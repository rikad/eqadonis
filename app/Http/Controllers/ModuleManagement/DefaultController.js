'use strict'

const Roles = use('App/Model/Roles')
const Module = use('App/Model/Module')
const RoleModule = use('App/Model/RoleModule')
const Database = use('Database')

const fs = require('fs')
const path = require('path')

const dirs = p => fs.readdirSync(p).filter(f => fs.statSync(p+'/'+f).isDirectory())
const pathDir = 'app/Http/Controllers'
const scannedDir = dirs(pathDir)

class DefaultController {
	* index(request, response) {
        	var oldModule = []
        	var newModule = []

        	for(var i=0, len=scannedDir.length; i<len; i++){
        		const module = yield Module.findBy('module', scannedDir[i])
        		if(module!=null){
        			oldModule.push(module)
        		}else{
        			newModule.push(scannedDir[i])
        		}
        	}

        yield response.sendView('moduleManagement/index', 
        	{oldModule:oldModule, newModule:newModule})
    }

    * newPost(request, response){
    	const name = request.input('moduleName')
    	const module = new Module()
    	module.module = name

    	/*var lineReader = require('readline').createInterface({
  			input: require('fs').createReadStream(pathDir+'/'+name+'/import.conf')
		});

		lineReader.on('line', function (line) {
			if(line.indexOf('description: ') > -1){
				var array = line.split(":")
				if(array.length>1){
					module.description = array[1].trim()
					
				}
			}else{
			console.log('Line from file:', line);
			}
		});*/

		var lines = fs.readFileSync(pathDir+'/'+name+'/import.conf').toString().split('\n')

		var start_custom = 0;
		for(var i=0, len=lines.length; i<len; i++){
			if(lines[i].indexOf('description:') > -1){
				var array = lines[i].split(":")
				if(array.length>1){
					module.description = array[1].trim()					
				}
			}else if(lines[i].indexOf('permission:') > -1){
				var array = lines[i].split(":")
				if(array.length>1){
					var permission = array[1].trim()
					if(permission.length==4){
						module.can_create=permission.charAt(0)
						module.can_read=permission.charAt(1)
						module.can_update=permission.charAt(2)
						module.can_delete=permission.charAt(3)
					}
				}
			}else{
				if(start_custom==0){
					if(lines[i].indexOf('custom') > -1){
						start_custom=1
						yield module.save()
					}
				}else{
					var parameter = lines[i].split(",")
					if(parameter.length>1){
						console.log(parameter)
						var roles = yield Roles.findBy('id',parameter[0])
						if(roles==null){
							roles = yield Roles.findBy('role_name',parameter[0])
						}
						if(roles!=null&&parameter[1].length==4){
							const roleModule = new RoleModule()
							roleModule.role_id=roles.role_id
							roleModule.module_id=module.id
							roleModule.can_create=parameter[1].charAt(0)
							roleModule.can_read=parameter[1].charAt(1)
							roleModule.can_update=parameter[1].charAt(2)
							roleModule.can_delete=parameter[1].charAt(3)

							if(parameter.length>2){roleModule.custom=parameter[2]}
							yield roleModule.save()
						}
						console.log(roles)
					}
				}
			}
		}
		
		console.log(module)
    	//yield module.save()
    	return response.redirect('/moduleManagement/manage/'+module.id)
    }

    * manage(request, response){
    	const module = yield Module.findBy('id', request.param(0))

		const permission = yield Database.select('roles_modules.*','roles.role_name').from('roles_modules')
                            .innerJoin('roles', 'roles.id', 'roles_modules.role_id')
                            .where('module_id', request.param(0))

        const registeredRole = Database.from('roles_modules').where('module_id', request.param(0)).select('role_id')
		const roles = yield Database.from('roles').whereNotIn('id', registeredRole)

    	yield response.sendView('moduleManagement/manage', {permission:permission, module:module, roles:roles})
    }

    * managePost(request, response){
    	const can_create = (request.input('create')==1)
    	const can_read = (request.input('read')==1)
    	const can_update = (request.input('update')==1)
    	const can_delete = (request.input('delete')==1)

    	const roleModule = yield RoleModule.findBy('id', request.input('id'))
    	roleModule.can_create = can_create
    	roleModule.can_read = can_read
    	roleModule.can_update = can_update
    	roleModule.can_delete = can_delete
    	roleModule.custom = request.input('custom')
    	yield roleModule.save()

    	return response.redirect('/moduleManagement/manage/'+request.param(0))
    }

    * updateModulePost(request, response){
    	const can_create = (request.input('create')==1)
    	const can_read = (request.input('read')==1)
    	const can_update = (request.input('update')==1)
    	const can_delete = (request.input('delete')==1)

    	const module = yield Module.findBy('id', request.input('id'))
    	module.can_create = can_create
    	module.can_read = can_read
    	module.can_update = can_update
    	module.can_delete = can_delete
    	yield module.save()

    	return response.redirect('/moduleManagement/manage/'+request.input('id'))
    }

    * createCustomPost(request, response){
    	const module = yield Module.findBy('id', request.input('module_id'))
    	const roleModule = new RoleModule()
    	roleModule.role_id = request.input('role_id')
    	roleModule.module_id = module.id
    	roleModule.can_create = module.can_create
    	roleModule.can_read = module.can_read
    	roleModule.can_update = module.can_update
    	roleModule.can_delete = module.can_delete
    	yield roleModule.save()

    	return response.redirect('/moduleManagement/manage/'+request.input('module_id'))
    }
}

module.exports = DefaultController