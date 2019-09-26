import { login, loginOut, refreshToken, getInfo } from '@/api/login'
import { getUserDetail } from '@/api/user'
import { Message } from 'element-ui'
import router, { resetRouter } from '@/router'

const state = {
  // 认证凭证
  token: localStorage.getItem('token') 
    ? localStorage.getItem('token') 
		: '',
	// 认证类型
	tokenType: localStorage.getItem('token_type') 
    ? localStorage.getItem('token_type') 
		: '',
  userName: '',
  refreshToken: localStorage.getItem('refresh_token') 
    ? localStorage.getItem('refresh_token') 
		: '',
	refreshingTokenFlag: false,
  roles: [],
  introduce: ''
}

const mutations = {
  SET_TOKEN(state, val) {
    state.token = val
    localStorage.setItem('token', val)
  },
  DEL_TOKEN(state) {
    state.token = ''
		state.tokenType = ''
    state.userName = ''
		state.refreshToken = ''
    state.roles = ''
    state.introduce = ''
		
    localStorage.removeItem('token')
		localStorage.removeItem('refresh_token')
  },
	SET_TOKEN_TYPE(state, val) {
	  state.tokenType = val
	  localStorage.setItem('token_type', val)
	},
  SET_REFRESH_TOKEN(state, val) {
    state.refreshToken = val
    localStorage.setItem('refresh_token', val)
  },
	SET_REFRESHING_TOKEN_FLAG(state, val) {
	  state.refreshingTokenFlag = (val === true)
	},
  SET_ROLES(state, payload) {
    state.roles = payload
  },
  SET_NAME(state, payload) {
    state.userName = payload
  },
  SET_INTRODUCE(state, payload) {
    state.introduce = payload
  }
}

const actions = {
  // user login
  _login({ commit }, formdatas) {
    return new Promise((resolve, reject) => {
      login(formdatas)
        .then(res => {
				/* if (res.code === 0) {
					if (res.data.success) {
						Message.success(res.data.msg)
						commit('SET_TOKEN', res.data.token)
					} else {
						Message.error(res.data.msg)
					}
					resolve(res)
				} */
				
				if (res.access_token) {
					Message.success("登陆成功")
					
					commit('SET_TOKEN', res.access_token)
					commit('SET_TOKEN_TYPE', res.token_type)
					commit('SET_REFRESH_TOKEN', res.refresh_token)
				} else {
					let msg;
					switch (res.error_description) {
					case 'Bad credentials':
						msg = '用户名或密码错误'
						break
					default:
						msg = '登录失败'
						break
					}
					
					Message.error(msg)
				}
				resolve(res)
			})
			.catch(error => {
				reject(error)
			})
    })
  },
  loginOut({ commit }) {
		//=== 服务器交互 ===//
		loginOut().then(res => {
			debugger
			if (res && res.content) {
				if (res.content.indexOf("注销成功") != -1) {
					//=== 浏览器处理 ===//
					commit('DEL_TOKEN')
					
					resetRouter()
					
					router.push({
					  path: '/login',
					  query: {
					    redirect: '/'
					  }
					})
					//======//
					
					Message.success('登出成功')
				} else if (res.content.indexOf("注销失败") != -1) {
					//=== 浏览器处理 ===//
					commit('DEL_TOKEN')
					
					resetRouter()
					
					router.push({
					  path: '/login',
					  query: {
					    redirect: '/'
					  }
					})
					//======//
					
					Message.success('用户已登出')
				}
			}
		}).error(err => {
			console.log('=== 登出失败 => ' + err + ' ===')
			Message.success('登出失败')
		})
		
		//=== 浏览器处理 ===//
    commit('DEL_TOKEN')
		
    resetRouter()
		
    router.push({
      path: '/login',
      query: {
        redirect: '/'
      }
    })
		//======//
  },
  _getInfo({ commit }) {
    return new Promise((resolve, reject) => {
      getInfo()
        .then(res => {
				/* if (res.code === 0) {
					const { name, roles, introduce } = res.data
					commit('SET_ROLES', roles)
					commit('SET_NAME', name)
					commit('SET_INTRODUCE', introduce)
				} else {
					Message.error(res.msg)
				} 
				resolve(res.data) */
				
				let data = {
					'name': state.userName,
					'roles': state.roles
				}
				
				resolve(data)
			}).catch(error => {
				// if (error.response 
				// 	&& error.response.data 
				// 	&& error.response.data.error_description === 'Token was not recognised') {
				// 	//--- AccessToken 过期的情况 -> 使用 RefreshToken 获取最新有效的 AccessToken.
				// 	console.log("=== (user) AccessToken 过期 ===")
				// } else {
				// 	console.log('===== 未知错误 => error:' + error + ' =====')
					
				// 	commit('DEL_TOKEN')
								
				// 	router.replace({
				// 		path: '/login',
				// 		query: {
				// 			redirect: router.currentRoute.fullPath
				// 		}
				// 	})
				// }
				
				reject(error)
			})
    })
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
