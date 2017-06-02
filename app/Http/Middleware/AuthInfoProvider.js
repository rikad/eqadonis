'use strict'


class AuthInfoProvider {

  * handle (request, response, next) {
    // here goes your middleware logic
    // yield next to pass the request to next middleware or controller


    if( typeof request.currentUser !== 'undefined' && request.currentUser){// && request.currentUser.current_officer_id!=null


	//ambil id role dan id organization
	

		request.currentUser.role_id = yield request.session.get('current_role_id')
		request.currentUser.role = yield request.session.get('current_role')
		request.currentUser.position_id = yield request.session.get('current_position_id')
		request.currentUser.position = yield request.session.get('current_position')
		request.currentUser.organization_id = yield request.session.get('current_organization_id')
		request.currentUser.organization = yield request.session.get('current_organization')


		//const sessionValues = yield request.session.all()
		//console.log(sessionValues)



	/*const officer = yield Officer.findBy('id', request.currentUser.current_officer_id)
	const positionRole = yield PositionRole.findBy('position_id', officer.position_id)

    	request.currentUser.position_id = officer.position_id
    	request.currentUser.role_id = positionRole.role_id
    	request.currentUser.organization_id = officer.organization_id

	const position = yield Position.findBy('id', officer.position_id)
	const organization = yield Organization.findBy('id', officer.organization_id)
	
	//simpan id role dan organization kedalam session
	request.currentUser.role = position.position
	request.currentUser.organization = organization.organization
	*/
	//check permission. Misal jika mengakses method UserController.create, tinggal dilihat
	//permission user.create untuk role_id yang mengakses

	//kalau definisi permission ada dan boleh lewat, lanjut ke pemanggilan method

	//kalau definisi permission tidak ada atau ada tapi tidak boleh lewat, redirect ke halaman tertentu
    }else{
    	
    }
    yield next
  }

}

module.exports = AuthInfoProvider
