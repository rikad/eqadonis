'use strict'

const TreeMenu = use('App/Tools/TreeMenu')
const Database = use('Database')

const AccreditationNote = use('App/Model/AccreditationNote')

class DefaultController {
    
    * index(request, response) {

    	var current_section = []
    	
    	var treeMenu = function *(parent_id, prefix, deepness, deepness_limit){
			const query = yield Database.select('borang_isian.*').from('borang_isian').where('parent_id', parent_id)
			var result = []

			if(query==null || deepness > deepness_limit){return result}

			for(var i=0, len = query.length; i < len; i++ ){
				if(query[i].id==request.param(0)){
					current_section.id = query[i].id
					current_section.title = query[i].title
					current_section.prefix = prefix+query[i].no+"."
					current_section.type = query[i].format
					current_section.tooltip = query[i].tooltip
					current_section.model = query[i].model
					current_section.description = query[i].description
				}

				var tmp = []
				tmp.title = prefix+query[i].no+". "+query[i].title
				tmp.parent_id = query[i].parent_id 
				tmp.id = query[i].id
				tmp.format = query[i].format
				tmp.model = query[i].model
				tmp.children = yield treeMenu(query[i].id, query[i].no+".", deepness+1, deepness_limit)
				//console.log(tmp.title)
				result.push(tmp)

    			//console.log(prefix+query[i].no+". "+query[i].title)
    		}

    		return result
    	}

		var result = yield* treeMenu(null, "", 0, 1)
    	
		var content
		if(request.param(0)!=null){
			if(current_section.type=='link'||current_section.type==null){
    			var result2 = yield* treeMenu(request.param(0), "", 0, 2)
    		}
    		else if(current_section.type=='note'){
				content = yield Database.select('content').from('accreditation_notes').
								where({organization_id: request.currentUser.organization_id,
										form_id: request.param(0)})
								//console.log(content)
    		}
		}

		yield response.sendView('BANPTS1Prodi/index', {tree:result, form:result2, section:current_section, content:content})
    }

	* addNotePost(request, response){
		var note = yield AccreditationNote.findBy({organization_id: request.currentUser.organization_id,
										form_id: request.param(0)})
		if(note==null){
			note = new AccreditationNote()	
		}
		/*const note = new AccreditationNote()*/
		note.organization_id = request.currentUser.organization_id
		note.form_id = request.param(0)
		note.contents = request.input('content')

		console.log(note.content)
		yield note.save()

		return response.redirect('/BAN-PT_S1_Prodi/index/'+request.param(0))
	}

}

module.exports = DefaultController