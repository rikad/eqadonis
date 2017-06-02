'use strict'

const TreeMenu = use('App/Tools/TreeMenu')
const Database = use('Database')

class Menu {
    
    * index(request, response) {
        /*console.log(fs.readdirSync('app/Http/Controllers/')
        .filter(file => fs.statSync(path.join('app/Http/Controllers/', file)).isDirectory()))*/

		yield response.sendView('errors/index', {error:'Testing'})
    }

    test(storage, parent_id){
    	const query = Database.select('borang_isian.*').from('borang_isian').where('parent_id', parent_id)

    	if(query == null){ return storage}
console.log(query.length)
    	for(var i=0, len = query.length; i < len; i++ ){
    		storage[i] = query[i]

    	}console.log(storage)

    	return storage
    }
}

module.exports = Menu