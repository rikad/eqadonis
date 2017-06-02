'use strict'


const Database = use('Database')
const Accreditation = use('App/Model/Accreditation')
const AccreditationLevel = use('App/Model/AccreditationLevel')
const Template = use('App/Model/Template')
const TemplateStructure = use('App/Model/TemplateStructure')
const Form = use('App/Model/Form')

const Organization = use('App/Model/Organization')
const AccreditationBorang = use('App/Model/AccreditationBorang')
const AccreditationDocument = use('App/Model/AccreditationDocument')

class DefaultController {
    
    * index(request, response) {
        /*const toDo = yield Database.select('todo.*','todo_tag.tag').from('todo')
                            .innerJoin('todo_tag', 'todo_tag.id', 'todo.tag_id')*/
        
        const accreditations = yield Database.select('acc_accreditations.*','acc_borang.id as borang_id').from('acc_accreditations')
                            .leftJoin('acc_borang', 'acc_accreditations.id', 'acc_borang.accreditation_id')
                            .where('acc_borang.organization_id', request.currentUser.organization_id)
                            .orWhere('acc_borang.organization_id', null)
                            
        //const accreditations = yield Accreditation.all()
        
        yield response.sendView('accreditation/index', {list:accreditations})
    }

    * signAccreditation(request, response){
        const organization = yield Organization.findBy('id', request.currentUser.organization_id)

        if(organization.form_id!=3&&organization.form_id!=4){
            return response.redirect('/accreditation/')    
        }
        const borang = new AccreditationBorang()
        borang.organization_id=request.currentUser.organization_id
        borang.accreditation_id=request.gets[0]
        yield borang.save()

        return response.redirect('/accreditation/')
    }

    * template(request, response){
        const borang = yield AccreditationBorang.findBy('id', request.gets[0])
        if(borang.organization_id!=request.currentUser.organization_id){
            return response.redirect('/accreditation/')       
        }

        const templates = yield Database.select('acc_templates.*', 'po_forms.form', 'acc_documents.id as document_id').from('acc_templates')
                            .innerJoin('po_forms', 'po_forms.id', 'acc_templates.form_id')
                            .leftJoin('acc_documents', 'acc_templates.id', 'acc_documents.template_id')
                            .where({accreditation_id:borang.accreditation_id, borang_id:request.gets[0]})
                            .orWhere({accreditation_id:borang.accreditation_id, borang_id:null})

        const accreditation = yield Accreditation.findBy('id', request.param(0))

        yield response.sendView('accreditation/template', {list:templates, id:request.gets[0],
            accreditation:accreditation})
    }

    * signDocument(request, response){
        const template = yield Template.findBy('id', request.gets[0])
        const borang = yield AccreditationBorang.findBy({accreditation_id:template.accreditation_id, 
            organization_id:request.currentUser.organization_id})

        if(borang==null){
            return response.redirect('/accreditation/')          
        }

        const document = new AccreditationDocument()
        document.borang_id=borang.id
        document.template_id=request.gets[0]
        yield document.save()

        return response.redirect('/accreditation/template/'+borang.id)
    }

    * templateStructure(request,response){
        const document = yield AccreditationDocument.findBy('id', request.gets[0])
        if(document==null){yield response.redirect('/accreditation/')}
        const template = yield Template.findBy('id', document.template_id)
        if(template==null){yield response.redirect('/accreditation/')}

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
                if(query[i].format=='note'){
                    tmp.content = yield Database.select('description').from(query[i].model).
                                where({organization_id: request.currentUser.organization_id})
                }
                //console.log(tmp.title)
                result.push(tmp)

                //console.log(prefix+query[i].no+". "+query[i].title)
            }

            return result
        }

        var result = yield* treeMenu(null, "", 0, 1, document.template_id)
        
        var content
        if(request.gets[1]!=null){
            if(current_section.type=='link'||current_section.type==null){
                var result2 = yield* treeMenu(request.gets[1], "", 0, 2, document.template_id)
            }
            else if(current_section.type=='note'){
                content = yield Database.select('description').from(current_section.model).
                                where({organization_id: request.currentUser.organization_id})
            }
        }

        yield response.sendView('accreditation/templateStructure', {tree:result, form:result2, 
            id:request.gets[0], section:current_section, content:content, link:request.param(0)})
    }


    * addNotePost(request, response){
        const templateStructure = yield TemplateStructure.findBy('id', request.input('section'))
        if(templateStructure==null){return response.redirect('/accreditation/templateStructure/'+request.param(0))}

        const query = yield Database.raw('select * from `'+templateStructure.model+'` where \
            organization_id='+request.currentUser.organization_id)

        if(query[0]==''){
            yield Database.raw("insert into `"+templateStructure.model+"` (organization_id,description) \
            values ("+request.currentUser.organization_id+",?)", request.input('content'+request.input('section')))
        }else{
            var tmp = request.input('content'+request.input('section'))
            console.log(tmp)
            
            yield Database.raw("update `"+templateStructure.model+"` set \
                organization_id="+request.currentUser.organization_id+", \
                description=?  \
                where id="+query[0][0].id, tmp)
        }

        return response.redirect('/accreditation/templateStructure/'+request.param(0))
    }

    * table(request, response){
        const query = yield Database.select('acc_template_structures.*').from('acc_template_structures').where(
                {id: request.gets[0]})

        var columns = []
        const columnQuery = yield Database.raw('SHOW COLUMNS FROM `'+query[0].model+'`')

        for(var i=0, len = columnQuery[0].length; i < len; i++ ){
            console.log(columnQuery[0][i].Field)
            if(columnQuery[0][i].Field!='id'&&columnQuery[0][i].Field!='organization_id'
             &&columnQuery[0][i].Field!='created_at'&&columnQuery[0][i].Field!='updated_at'){
             columns.push(columnQuery[0][i].Field)//.replace(/_/gi, " ")
            }
        }console.log(columns)

        const content = yield Database.select(query[0].model+'.*').from(query[0].model).where(
                {organization_id: request.currentUser.organization_id})

        var prefix = query[0].no
        const level1 = yield TemplateStructure.findBy('id', query[0].parent_id)
        prefix = level1.no+"."+prefix
        if(level1.parent_id!=null){
            const level2 = yield TemplateStructure.findBy('id', level1.parent_id)
            prefix = level2.no+"."+prefix

            if(level2.parent_id!=null){
            const level3 = yield TemplateStructure.findBy('id', level2.parent_id)
            prefix = level3.no+"."+prefix
            }
        }

        yield response.sendView('accreditation/table', {section:query[0], columns:columns, content:content, prefix:prefix, selected:request.gets[1]})
    }

    * newRowPost(request, response){
        const structure = yield TemplateStructure.findBy('id', request.input('id'))

        var columns = []
        const columnQuery = yield Database.raw('SHOW COLUMNS FROM `'+structure.model+'`')

        for(var i=0, len = columnQuery[0].length; i < len; i++ ){
            if(columnQuery[0][i].Field!='id'&&columnQuery[0][i].Field!='organization_id'
             &&columnQuery[0][i].Field!='created_at'&&columnQuery[0][i].Field!='updated_at'){
             columns.push(columnQuery[0][i].Field)//.replace(/_/gi, " ")
            }
        }

        var query = "insert into `"+structure.model+"` (organization_id "
        for(var i=0, len=columns.length; i<len; i++){
            query = query+", "+columns[i]
        }
        query = query+") values ( "+request.currentUser.organization_id

        for(var i=0, len=columns.length; i<len; i++){
            query = query+", '"+request.input(columns[i])+"'"
        }
        query = query+")"

        yield Database.raw(query)

        return response.redirect('/accreditation/table/'+request.input('id'))
    }

    * deleteRow(request, response){
        const structure = yield TemplateStructure.findBy('id', request.gets[0])
        const query = "select * from `"+structure.model+"` where id="+request.gets[1]
        const result = yield Database.raw(query)

        if(result[0]==""||result[0]==null){return response.redirect('/accreditation/table/'+request.gets[0])}
        if(result[0][0]['organization_id']!=request.currentUser.organization_id){return response.redirect('/accreditation/table/'+request.gets[0])}

        yield Database.raw('delete from `'+structure.model+'` where id='+request.gets[1])    

        return response.redirect('/accreditation/table/'+request.gets[0])
    }

    * updateRowPost(request, response){
        const structure = yield TemplateStructure.findBy('id', request.input('id'))
        const query = "select * from `"+structure.model+"` where id="+request.input('rowId')
        const result = yield Database.raw(query)

        if(result[0]==""||result[0]==null){return response.redirect('/accreditation/table/'+request.gets[0])}
        if(result[0][0]['organization_id']!=request.currentUser.organization_id){return response.redirect('/accreditation/table/'+request.gets[0])}

        

        var columns = []
        const columnQuery = yield Database.raw('SHOW COLUMNS FROM `'+structure.model+'`')

        for(var i=0, len = columnQuery[0].length; i < len; i++ ){
            if(columnQuery[0][i].Field!='id'&&columnQuery[0][i].Field!='organization_id'
             &&columnQuery[0][i].Field!='created_at'&&columnQuery[0][i].Field!='updated_at'){
             columns.push(columnQuery[0][i].Field)//.replace(/_/gi, " ")
            }
        }

        var query2='update `'+structure.model+'` set organization_id='+request.currentUser.organization_id
        for(var i=0, len=columns.length; i<len; i++){
            query2 = query2+" , "+columns[i]+"='"+request.input(columns[i])+"' "
        }
        
        query2=query2+' where id='+request.input('rowId')

        yield Database.raw(query2)    

        return response.redirect('/accreditation/table/'+request.input('id'))
    }    

    * excelPost(request, response) {
        const Helpers = use('Helpers')
        const Excel = use('App/Helper/Excel')
        const uploadValidation = {
            allowedExtensions: ['xlsx']
        }
        const sheet = request.input('sheet')
        const id = request.input('id')
        const file = request.file('file',uploadValidation)
        const fileName = `${new Date().getTime()}.${file.extension()}`

        //get column database
        const query = yield Database.select('acc_template_structures.*').from('acc_template_structures').where(
                {id: id})

        var columns = []
        const columnQuery = yield Database.raw('SHOW COLUMNS FROM `'+query[0].model+'`')

        for(var i=0, len = columnQuery[0].length; i < len; i++ ){
            if(columnQuery[0][i].Field!='id'&&columnQuery[0][i].Field!='organization_id'
             &&columnQuery[0][i].Field!='created_at'&&columnQuery[0][i].Field!='updated_at'){
             columns.push(columnQuery[0][i].Field)//.replace(/_/gi, " ")
            }
        }

        //file handling
        yield file.move(Helpers.storagePath()+'/borang', fileName)
        if (!file.moved()) {
          response.badRequest(file.errors())
          return 
        }

        //will execute excel librarry
        const readExcel = new Excel(file.uploadPath(),3);
        let data = yield readExcel.getSheet(sheet,'data')

        //eksekusi query
        let organization_id = request.currentUser.organization_id;
        let sql = "insert into `"+query[0].model+"` (organization_id "

        for(let i=0, len=columns.length; i<len; i++) {
           sql += ", `"+columns[i]+"`"
        }
        sql += ") values "

        for(let i=0, len=data.length; i<len; i++){
            sql += '('+organization_id+',';
            for (let n=0,len2=data[i].length; n<len2; n++) {
                let out = (data[i][n] == null) ? '' : data[i][n]
                sql += "'"+out+"'"
                //add and remove comma on last value
                sql += (n == len2 - 1) ? '' : ',';
            }
            sql += ')';
            //add and remove comma on last value
            sql += (i == len - 1) ? '' : ',';
        }

        yield Database.raw(sql);
        return response.redirect('/accreditation/table/'+id)
    }
}

module.exports = DefaultController
