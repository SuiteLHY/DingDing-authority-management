// import $axios from './index'
import $axiosDingdingAuthorization from './dingdingAuthorizationServer'

export function getAllRoles() {
  /* const url = '/getRoles'
  return $axios.get(url) */
	const url = '/security/role/allRoleList'
	return $axiosDingdingAuthorization.get(url)
}

/**
 * 添加一个角色
 * 
 * @param {Object} newRole	指定角色的数据对象
 */
export function addRole(newRole) {
	const url = '/security/role/assignedRole'
	
	let params = {
		'code': newRole['code'],
		'name': newRole['name'],
		'description': newRole['description']
	}
	
	return $axiosDingdingAuthorization.put(url, params)
}

/**
 * 更新指定角色
 * 
 * @param {Object} oldRole	指定角色的最新版本数据对象
 * @param {Object} newRole	指定角色的被更新数据对象
 */
export function updateRole(oldRole, newRole) {
	const url = '/security/role/assignedRole'
	
	let params = {
		'old_code': oldRole['code'],
		'old_name': oldRole['name'],
		'old_description': oldRole['description']
	}
	
	if (newRole) {
		let newRole_name = newRole['name']
		let newRole_description = newRole['description']
		if (newRole_name) {
			params['new_name'] = newRole_name
		}
		if (newRole_description) {
			params['new_description'] = newRole_description
		}
	}
	
	return $axiosDingdingAuthorization.patch(url, params)
}

/**
 * 删除一个角色
 * 
 * @param {Object} role	指定角色的数据对象
 */
export function deleteRole(role) {
	const url = '/security/role/assignedRole'
	
	let params = {
		'role_code': role['code']
	}
	
	return $axiosDingdingAuthorization.delete(url, params)
}
