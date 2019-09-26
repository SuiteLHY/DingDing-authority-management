import axios from 'axios'
import axiosDingdingAuthorization from './dingdingAuthorizationServer'
import Qs from 'qs'
import store from '@/store'
import router from '@/router'
import Vue from 'vue'
import { Loading, Message } from 'element-ui' // 引用element-ui的加载和消息提示组件

import { refreshToken } from '@/api/login'

const $axios = axios.create({
  // 基础url，会在请求url中自动添加前置链接
  baseURL: /* 'http://127.0.0.1:9999/authorization-server' */process.env.VUE_APP_SSO_SERVER_API,
  // 设置超时时间
  timeout: 30000,
})

// 设置全局的请求次数 & 请求的间隙
$axios.defaults.retry = 10;
$axios.defaults.retryDelay = 300;

// 并发请求
Vue.prototype.$httpDingdingSso = axios 

// 在全局请求和响应拦截器中添加请求状态
let loading = null

/**
 * 设置令牌参数
 * 
 * @param {Object} config
 * 
 * @return true || false
 */
function setParameterToken(config) {
	let token = store.getters.token
	
	if (config && token) {
		try {
			if (!config.params) {
				config.params = {}
			}
			
			config.params['token'] = token
			
			return true
		} catch (err) {
			return false
		}
	}
	return false
}

// 请求拦截器
$axios.interceptors.request.use(
  config => {
    loading = Loading.service({ text: '拼命加载中' })
	
		axiosDingdingAuthorization.setAuthorizationToken(config)
		setParameterToken(config)
		
		return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
const interceptor = $axios.interceptors.response.use(
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
		
		// console.log(error)
		
		const res = error.response
		const config = error.config
		if (res) {
			switch (res.status) {
				case 400:
					let msg = res.data.error_description 
						? res.data.error_description 
						: '用户名或密码错误'
					
					if (msg === 'Token was not recognised') {
						//--- AccessToken 已过期的情况 -> 使用 RefreshToken 获取最新的 AccessToken.
						console.log('=== Access Token 已过期 ===')
						
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
						})
						//======//
						
						return backoff.then(() => {
							if (store.getters.refreshingTokenFlag === true) {
								// 请求重发
								return $axios(config)
							} else {
								return refreshToken(store.getters.refreshToken)
									.then(res1 => {
									// 请求重发
									return $axios(config)
								}).catch(error1 => {
									return Promise.reject(error1)
								})
							}
						})
					} else {
						Message.error(msg)
					}
					break
				case 401:
					//--- 返回401的情况 -> 清除token信息并跳转到登陆页面
					store.commit('DEL_TOKEN')
					
					router.replace({
						path: '/login',
						query: {
							redirect: router.currentRoute.fullPath
						}
					})
					break
				case 404:
					Message.error('网络请求不存在')
					break
				default:
					// Message.error(error.response.data.message)
					Message.error(res.data.error_description)
					break
			}
		} else {
			// 请求超时或者网络有问题
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
  post(url, params) {
    return $axios({
      method: 'post',
      url,
      data: Qs.stringify(params),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
      }
    })
  },
  get(url, params) {
    return $axios({
      method: 'get',
      url,
      params
    })
  },
	/**
	 * 设置令牌参数
	 * 
	 * @param {Object} config
	 * 
	 * @return true || false
	 */
	setParameterToken(config) {
		return setParameterToken(config)
	}
}
