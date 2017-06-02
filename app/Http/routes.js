'use strict'

/*
|--------------------------------------------------------------------------
| Router
|--------------------------------------------------------------------------
|
| AdonisJs Router helps you in defining urls and their actions. It supports
| all major HTTP conventions to keep your routes file descriptive and
| clean.
|
| @example
| Route.get('/user', 'UserController.index')
| Route.post('/user', 'UserController.store')
| Route.resource('user', 'UserController')
*/

const Route = use('Route')

const Helpers = use('Helpers')
const Ioc = require('adonis-fold').Ioc

Route.on('/').render('welcome')
Route.get('/login', 'AuthController.index')
Route.post('/login', 'AuthController.login')
Route.get('/logout', 'AuthController.logout')
Route.get('/pick_role', 'AuthController.list')
Route.get('/pick_role/:id', 'AuthController.listPick')


Route.get('/register', 'RegisterController.index')
Route.post('register', 'RegisterController.doRegister')

/*
GET URL: /user memanggil method UserController.index
GET URL: /user/create memanggil method UserController.create
POST URL: /user/create memanggil method UserController.createPost
GET URL: /user/view/1/2/3 memanggil method UserController.view dengan array parameter [1, 2, 3]
*/
Route.any('/:controller/:action?/*', function * (request, response) {
  
  if(request.fileController==null){request.fileController='Default'}

  request.gets = request.param(0).split('/')
  var action = request.param('action')
  if(action==null){action='index'}

  const method = request.method() //get, post
  if(method!='GET'){action=action+''+method.charAt(0).toUpperCase()+''+method.slice(1).toLowerCase()}

  const controllerPath = `${Helpers.appNameSpace()}/Http/Controllers/`
  const controllerInstance = Ioc.makeFunc(
  	`${controllerPath}/${request.controller}/${request.fileController}Controller.${action}`)
  yield controllerInstance.instance[controllerInstance.method](request, response)
}).middleware('authUser')


/*Route.get('/register', 'RegisterController.index')
Route.post('register', 'RegisterController.doRegister')

Route.get('/users', 'UserController.index')
Route.get('/users/edit/:id', 'UserController.profile')
Route.post('/users/edit/:id', 'UserController.profileSave')
Route.post('/users/index/:index', 'UserController.index')
Route.get('/users/ajax', 'UserController.ajax')
*/
