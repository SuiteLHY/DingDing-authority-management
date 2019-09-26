import axios from 'axios'
import Qs from 'qs'
import store from '@/store'
import router from '@/router'
import Vue from 'vue'
import {
	Loading,
	Message
} from 'element-ui' // 引用element-ui的加载和消息提示组件

import {
	refreshToken,
	getInfo
} from '@/api/login'

const $axios = axios.create({
	// 基础url，会在请求url中自动添加前置链接
	baseURL: /* 'http://192.168.124.33:8092/authorization-server' */process.env.VUE_APP_AUTHORIZATION_SERVER_API,
	// 设置超时时间
	timeout: 30000,
})

// 设置全局的请求次数 & 请求的间隙
$axios.defaults.retry = 6;
$axios.defaults.retryDelay = 500;

// 并发请求
Vue.prototype.$httpDingdingAuthorization = axios

// 在全局请求和响应拦截器中添加请求状态
let loading = null

/**
 * 设置认证令牌
 * 
 * @param {Object} config
 * 
 * @return {Object} config
 */
function setAuthorizationToken(config) {
	const token = store.getters.token
	const tokenType = store.getters.tokenType

	if (config && token) {
		// 请求头部添加 Token
		config.headers.Authorization = tokenType + ' ' + token
	}
	return config
}

// 请求拦截器
$axios.interceptors.request.use(
	config => {
		loading = Loading.service({
			text: '拼命加载中'
		})

		return setAuthorizationToken(config)
	},
	error => {
		return Promise.reject(error)
	}
)

// 响应拦截器
$axios.interceptors.response.use(
	response => {
		if (loading) {
			loading.close()
		}

		const code = response.status
		if ((code >= 200 && code < 300) || code === 304) {
			return Promise.resolve(response.data)
		} else {
			return Promise.reject(response)
		}
	},
	error => {
		if (loading) {
			loading.close()
		}

		const res = error.response
		const config = error.config
		
		if (res && res.status) {
			switch (res.status) {
				case 400:
					Message.error(msg)
					break
				case 401:
					//--- 返回401的情况
					const msg = res.data.error
					const msg_description = res.data.error_description

					if (msg === 'invalid_token') {
						//--- AccessToken 已过期的情况 -> 使用 RefreshToken 获取最新的 AccessToken.
						//=== 重新请求的次数和时间间隔处理; @Referece <a href='https://blog.csdn.net/roamingcode/article/details/81737611?utm_medium=distribute.pc_relevant.none-task-blog-BlogCommendFromMachineLearnPai2-2.add_param_isCf&depth_1-utm_source=distribute.pc_relevant.none-task-blog-BlogCommendFromMachineLearnPai2-2.add_param_isCf'>axios请求超时后重新请求_roamingcode的博客-CSDN博客_axios超时后重新请求两次</a> ===//
						// Set the variable for keeping track of the retry count
						config._retryCount = config._retryCount || 0

						// Check if we've maxed out the total number of retries
						if (config._retryCount >= config.retry) {
							console.log('=== (重新请求次数达到上限) ===')

							store.commit('user/DEL_TOKEN')

							router.replace({
								path: '/login',
								query: {
									redirect: router.currentRoute.fullPath
								}
							})

							return Promise.reject(error);
						}

						// Increase the retry count
						config._retryCount += 1

						// Create new promise to handle exponential backoff
						var backoff = new Promise(resolve => {
							setTimeout(() => {
								resolve()
							}, config.retryDelay || 200)
						});
						//======//

						return backoff.then(() => {
							if (store.getters.refreshingTokenFlag === true) {
								// 请求重发
								return $axios(config)
							} else {
								return getInfo()
									.then(res1 => {
										// 请求重发
										return $axios(config)
									}).catch(error1 => {
										return Promise.reject(error1)
									})
							}
						});
					} else {
						Message.error('401')
					}
					break
				case 404:
					Message.error('网络请求不存在')
					break
				default:
					console.log('--- res.status -> ' + res.status + ' ---')

					Message.error(res.data.error_description)
					break
			}
		} else {
			//--- 请求超时、网络有问题、认证令牌无效被拒绝访问
			//=== 重新请求的次数和时间间隔处理 ===//
			// Set the variable for keeping track of the retry count
			config._retryCount = config._retryCount || 0

			// Check if we've maxed out the total number of retries
			if (config._retryCount >= config.retry) {
				console.log('=== (重新请求次数达到上限) ===')

				store.commit('user/DEL_TOKEN')

				router.replace({
					path: '/login',
					query: {
						redirect: router.currentRoute.fullPath
					}
				})

				return Promise.reject(error);
			} else {
				//--- 网络错误 | 服务器接口异常 | AccessToken 已过期的情况
				//=== 重新请求的次数和时间间隔处理 ===//
				// Increase the retry count
				config._retryCount += 1

				// Create new promise to handle exponential backoff
				var backoff = new Promise(resolve => {
					setTimeout(() => {
						resolve()
					}, config.retryDelay || 200)
				});
				//======//
				
				return backoff.then(() => {
					if (store.getters.refreshingTokenFlag === true) {
						// 请求重发
						return $axios(config)
					} else {
						return /* refreshToken(store.getters.refreshToken) */getInfo()
							.then(res1 => {
								// 请求重发
								return $axios(config)
							}).catch(error1 => {
								return Promise.reject(error1)
							})
					}
				})
			}
			//======//

			if (error.message.includes('timeout')) {
				Message.error('请求超时！请检查网络是否正常')
			} else {
				Message.error('请求失败，请检查网络是否已连接')
			}
		}
		return Promise.reject(error)
	}
)

// get，post请求方法
export default {
	get(url, params) {
		return $axios({
			method: 'get',
			url,
			params
		})
	},
	delete(url, params) {
		return $axios({
			method: 'delete',
			url,
			params
		})
	},
	patch(url, params) {
		return $axios({
			method: 'patch',
			url,
			params,
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
			}
		})
	},
	post(url, data) {
		return $axios({
			method: 'post',
			url,
			data: Qs.stringify(data),
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
			}
		})
	},
	put(url, params) {
		return $axios({
			method: 'put',
			url,
			params,
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
			}
		})
	},
	/**
	 * 设置认证令牌
	 * 
	 * @param {Object} config
	 * 
	 * @return {Object} config
	 */
	setAuthorizationToken(config) {
		return setAuthorizationToken()
	},
}
