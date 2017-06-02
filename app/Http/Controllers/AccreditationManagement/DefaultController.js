'use strict'


const Database = use('Database')
const Accreditation = use('App/Model/Accreditation')
const AccreditationLevel = use('App/Model/AccreditationLevel')
const Template = use('App/Model/Template')
const TemplateStructure = use('App/Model/TemplateStructure')
const Form = use('App/Model/Form')

class DefaultController {
    
    * index(request, response) {
        /*const toDo = yield Database.select('todo.*','todo_tag.tag').from('todo')
                            .innerJoin('todo_tag', 'todo_tag.id', 'todo.tag_id')*/
        
        const accreditations = yield Accreditation.all()
        
        yield response.sendView('accreditationManagement/index', {list:accreditations.toJSON()})
    }

    * addNew(request,response){
        const level = yield AccreditationLevel.all()
        yield response.sendView('accreditationManagement/addNew', {level:level.toJSON()})
    }

    * addNewPost(request, response){
        const accreditations = new Accreditation()
        accreditations.title=request.input('title')
        accreditations.year=request.input('year')
        accreditations.level_id=request.input('level')
        accreditations.description=request.input('description')

        yield accreditations.save()

        return response.redirect('/accreditationManagement/')
    }

    * deleteAccreditation(request, response){
        const accreditation = yield Accreditation.findBy('id', request.param(0))
        yield accreditation.delete()

        return response.redirect('/accreditationManagement/')
    }

    * info(request, response){
        const level = yield AccreditationLevel.all()

        var success
        if(request.gets[1]>0){success="Saved"}

        const accreditation = yield Accreditation.findBy('id', request.param(0))
        yield response.sendView('accreditationManagement/info', {info:accreditation,
            level:level.toJSON(), success:success, id:request.gets[0]})
    }

    * infoUpdatePost(request, response){
        const accreditation = yield Accreditation.findBy('id', request.param(0))
        accreditation.title=request.input('title')
        accreditation.year=request.input('year')
        accreditation.level_id=request.input('level')
        accreditation.description=request.input('description')

        yield accreditation.save()

        return response.redirect('/accreditationManagement/info/'+request.param(0)+'/1')
    }

    * template(request, response){
        const templates = yield Database.select('acc_templates.*','po_forms.form').from('acc_templates')
                            .innerJoin('po_forms', 'po_forms.id', 'acc_templates.form_id')
                            .where('accreditation_id', request.gets[0])

        const accreditation = yield Accreditation.findBy('id', request.param(0))

        yield response.sendView('accreditationManagement/template', {list:templates, id:request.gets[0],
            accreditation:accreditation})
    }

    * addTemplate(request, response){
        const form = yield Form.all()

        yield response.sendView('accreditationManagement/templateNew', {form:form.toJSON()  , id:request.gets[0]})
    }

    * addTemplatePost(request, response){
        const template = new Template()
        template.accreditation_id = request.gets[0]
        template.form_id = request.input('form')
        template.description = request.input('description')

        yield template.save()

        return response.redirect('/accreditationManagement/template/'+request.gets[0])
    }

    * deleteTemplate(request, response){
        const template = yield Template.findBy('id', request.gets[0])
        yield template.delete()

        return response.redirect('/accreditationManagement/template/'+request.gets[0])
    }

    * infoTemplate(request, response){
        const form = yield Form.all()
        const template = yield Template.findBy('id', request.gets[0])

        yield response.sendView('accreditationManagement/infoTemplate', {template:template,
            form:form.toJSON()  , id:request.gets[0]})
    }

    * templateUpdatePost(request, response){
        const template = yield Template.findBy('id', request.gets[0])
        template.form_id = request.input('form')
        template.description = request.input('description')

        yield template.save()

        return response.redirect('/accreditationManagement/template/'+template.accreditation_id)
    }


    * templateStructure(request,response){
        const template = yield Template.findBy('id', request.gets[0])
        if(template==null){yield response.redirect('/accreditationManagement/')}

        var current_section = []
        
        var treeMenu = function *(parent_id, prefix, deepness, deepness_limit, template_id){
            const query = yield Database.select('acc_template_structures.*').from('acc_template_structures').where(
                {template_id: template_id, parent_id: parent_id})

            var result = []

            if(query==null || deepness > deepness_limit){return result}

            for(var i=0, len = query.length; i < len; i++ ){
                if(query[i].id==request.gets[1]){
                    current_section.id = query[i].id
                    current_section.title = query[i].title
                    current_section.prefix = prefix+query[i].no+"."
                    current_section.type = query[i].format
                    current_section.tooltip = query[i].tooltip
                    current_section.model = query[i].model
                    current_section.description = query[i].description

                    //
                    if(query[i].format=='table'){
                        current_section.columns = []
                            const columns = yield Database.raw('SHOW COLUMNS FROM `'+query[i].model+'`')

                            for(var j=0, jlen = columns[0].length; j < jlen; j++ ){
                                if(columns[0][j].Field!='id'&&columns[0][j].Field!='organization_id'
                                &&columns[0][j].Field!='created_at'&&columns[0][j].Field!='updated_at'){
                                    current_section.columns.push(columns[0][j].Field.replace(/_/gi, " "))
                                }                
                            }
                    }
                    //
                }

                var tmp = []
                tmp.title = prefix+query[i].no+". "+query[i].title
                tmp.parent_id = query[i].parent_id 
                tmp.id = query[i].id
                tmp.no = query[i].no
                tmp.format = query[i].format
                tmp.model = query[i].model
                tmp.description = query[i].description
                tmp.children = yield treeMenu(query[i].id, query[i].no+".", deepness+1, deepness_limit, template_id)

                if(query[i].format=='table'){
                        tmp.columns = []
                            const columns = yield Database.raw('SHOW COLUMNS FROM `'+query[i].model+'`')

                            for(var j=0, jlen = columns[0].length; j < jlen; j++ ){
                                if(columns[0][j].Field!='id'&&columns[0][j].Field!='organization_id'
                                &&columns[0][j].Field!='created_at'&&columns[0][j].Field!='updated_at'){
                                    tmp.columns.push(columns[0][j].Field.replace(/_/gi, " "))
                                }                
                            }
                    }
                //console.log(tmp.title)
                result.push(tmp)

                //console.log(prefix+query[i].no+". "+query[i].title)
            }

            return result
        }

        var result = yield* treeMenu(null, "", 0, 1, request.gets[0])
        
        var content
        if(request.gets[1]!=null){
            if(current_section.type=='link'||current_section.type==null){
                var result2 = yield* treeMenu(request.gets[1], "", 0, 2, request.gets[0])
                //console.log(result2[0].children[0])
            }
            else if(current_section.type=='note'){
                content = yield Database.select('content').from('accreditation_notes').
                                where({organization_id: request.currentUser.organization_id,
                                        form_id: request.param(0)})
                                //console.log(content)
            }
        }

        yield response.sendView('accreditationManagement/templateStructure', {tree:result, form:result2, 
            id:request.gets[0], section:current_section, content:content})
    }

    * templateNewSection(request, response){
        yield response.sendView('accreditationManagement/newSection', {id:request.gets[0]})
    }

    * newSectionPost(request, response){
        const existingStructures = yield Database.select('no').from('acc_template_structures')
                            .where({template_id: request.gets[0], parent_id: null})

        console.log(existingStructures.length)
        const structure = new TemplateStructure()
        structure.template_id=request.gets[0]
        structure.title=request.input('title')
        structure.description=request.input('description')
        structure.tooltip=request.input('tooltip')
        structure.no=existingStructures.length+1

        yield structure.save()

        return response.redirect('/accreditationManagement/templateStructure/'+request.gets[0])
    }

    * templateNewChildren(request, response){
        yield response.sendView('accreditationManagement/newSection', {id:request.param(0), parent:request.gets[1]})
    }
    * newChildrenPost(request, response){
        const existingStructures = yield Database.select('no').from('acc_template_structures')
                            .where({template_id: request.gets[0], parent_id: request.input('parent')})

        const structure = new TemplateStructure()
        structure.template_id=request.gets[0]
        structure.parent_id=request.input('parent')
        structure.no=existingStructures.length+1
        structure.title=request.input('title')
        structure.format=request.input('type')
        structure.description=request.input('description')
        structure.tooltip=request.input('tooltip')
        
        yield structure.save()

        const template = yield Template.findBy('id', structure.template_id)
        const form = yield Form.findBy('id', template.form_id)
        const accreditation = yield Accreditation.findBy('id', template.accreditation_id)

        var model = accreditation.title+"S"+accreditation.level_id+accreditation.year+"_"+form.abbreviation
        model = model.replace(/ /g,"_")
        console.log(model)

        const newStructure = yield TemplateStructure.findBy({no: existingStructures.length+1, parent_id: request.input('parent')})

        newStructure.model='acc_'+structure.format+'s_'+model+newStructure.id
        yield newStructure.save()

        if(structure.format=='note'){
            yield Database.raw(
                'CREATE TABLE IF NOT EXISTS `acc_'+structure.format+'s_'+model+newStructure.id+'` ( \
                `id` int(10) unsigned NOT NULL AUTO_INCREMENT, \
                `created_at` datetime DEFAULT NULL, \
                `updated_at` datetime DEFAULT NULL, \
                `organization_id` int(11) DEFAULT NULL, \
                `description` text, \
                    PRIMARY KEY (`id`) \
                )')
        }
        
        if(structure.format=='table'){
            yield Database.raw(
                'CREATE TABLE IF NOT EXISTS `acc_'+structure.format+'s_'+model+newStructure.id+'` ( \
                `id` int(10) unsigned NOT NULL AUTO_INCREMENT, \
                `created_at` datetime DEFAULT NULL, \
                `updated_at` datetime DEFAULT NULL, \
                `organization_id` int(11) DEFAULT NULL, \
                    PRIMARY KEY (`id`) \
                )')
        }

        return response.redirect('/accreditationManagement/templateStructure/'+request.param(0))
    }

    * editSection(request, response){
        const section = yield TemplateStructure.findBy('id', request.gets[0])

        yield response.sendView('accreditationManagement/editSection', {id:request.gets[0], parent:section.parent_id
            , section:section, template_id:section.template_id})
    }

    * deleteSection(request, response){
        const structure = yield TemplateStructure.findBy('id', request.gets[0])

        if (structure.model!=null){
            yield Database.raw('DROP TABLE `'+structure.model+'`')
        }

        const template_id = structure.template_id
        yield structure.delete()

        return response.redirect('/accreditationManagement/templateStructure/'+template_id)
    }

    * updateSectionPost(request, response){
        const structure = yield TemplateStructure.findBy('id', request.gets[0])

        structure.title=request.input('title')
        structure.description=request.input('description')
        structure.tooltip=request.input('tooltip')
        structure.format=request.input('type')
        yield structure.save()

        const template = yield Template.findBy('id', structure.template_id)
        const form = yield Form.findBy('id', template.form_id)
        const accreditation = yield Accreditation.findBy('id', template.accreditation_id)

        var model = accreditation.title+"S"+accreditation.level_id+accreditation.year+"_"+form.abbreviation
        model = model.replace(/ /g,"_")

        structure.model='acc_'+structure.format+'s_'+model+structure.id
        yield structure.save()

        if(structure.format=='note'){
            yield Database.raw(
                'CREATE TABLE IF NOT EXISTS `acc_'+structure.format+'s_'+model+structure.id+'` ( \
                `id` int(10) unsigned NOT NULL AUTO_INCREMENT, \
                `created_at` datetime DEFAULT NULL, \
                `updated_at` datetime DEFAULT NULL, \
                `organization_id` int(11) DEFAULT NULL, \
                `description` text, \
                    PRIMARY KEY (`id`) \
                )')
        }
        
        if(structure.format=='table'){
            yield Database.raw(
                'CREATE TABLE IF NOT EXISTS `acc_'+structure.format+'s_'+model+structure.id+'` ( \
                `id` int(10) unsigned NOT NULL AUTO_INCREMENT, \
                `created_at` datetime DEFAULT NULL, \
                `updated_at` datetime DEFAULT NULL, \
                `organization_id` int(11) DEFAULT NULL, \
                    PRIMARY KEY (`id`) \
                )')
        }

        return response.redirect('/accreditationManagement/templateStructure/'+structure.template_id)
    }

    * editTable(request, response){
        const section = yield TemplateStructure.findBy('id', request.gets[0])
        const columns = yield Database.raw('SHOW COLUMNS FROM `'+section.model+'`')

        var result = []
        for(var i=0, len = columns[0].length; i < len; i++ ){
            //if(columns[0][i].Field!='id'&&columns[0][i].Field!='organization_id'
              //  &&columns[0][i].Field!='created_at'&&columns[0][i].Field!='updated_at'){
                    var tmp = []
                    tmp.title=columns[0][i].Field//.replace("_", " ")

                    if(columns[0][i].Type.includes('int')){tmp.type='integer'}
                    else if(columns[0][i].Type.includes('datetime')){tmp.type='datetime'}
                    else{tmp.type='text'}

                    result.push(tmp)
            //}
        }
        console.log(result)

        yield response.sendView('accreditationManagement/editTable', {id:request.gets[0], parent:section.parent_id
            , section:section, template_id:section.template_id, columns:result})
    }

    * addColumnPost(request, response){
        const section = yield TemplateStructure.findBy('id', request.gets[0])

        yield Database.raw('ALTER TABLE `'+section.model+'` ADD COLUMN `'+request.input('title').replace(/ /g,"_")+'` '+request.input('type'))        

        return response.redirect('/accreditationManagement/editTable/'+section.id)   
    }

    * deleteColumnPost(request, response){
        const section = yield TemplateStructure.findBy('id', request.gets[0])

        yield Database.raw('ALTER TABLE `'+section.model+'` DROP COLUMN `'+request.input('column')+'`')        

        return response.redirect('/accreditationManagement/editTable/'+section.id)   
    }
}

module.exports = DefaultController