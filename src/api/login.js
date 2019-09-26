/*
API - 登录

@description ...

@param {Object} data
*/
import $axios from './index'
import $axiosDingdingSso from './dingdingSsoServer'

import router from '@/router'
import store from '@/store'
import {
	Loading,
	Message
} from 'element-ui' // 引用element-ui的加载和消息提示组件

import { getUserDetail } from '@/api/user'

/**
 * 登录
 * 
 * @param {Object} data
 */
export function login(data) {
	/* const url = '/login'
	return $axios.post(url, data) */

	/* const url = '/oauth/authorize'
	
  data['client_id'] = 'dingding1'
  data['redirect_uri'] = 'https://www.baidu.com'
  data['response_type'] = 'code'
  data['scope'] = 'all'
  data['state'] = 'normal' */

	const url = '/oauth/token'

	data['client_id'] = 'dingding1'
	data['client_secret'] = 'dingding_secret1'
	data['grant_type'] = 'password'
	data['scope'] = 'all'
	data['username'] = data['user']

	return $axiosDingdingSso.post(url, data)
}

/**
 * 登出
 */
export function loginOut() {
	const url = '/logout'

	const data = {
		'access_token': store.getters.token
	}

	return $axiosDingdingSso.post(url, data)
}

/**
 * 刷新令牌
 * 
 * @param {Object} refreshToken
 */
export function refreshToken(refreshToken) {
	const url = '/oauth/token'
	let data = {
		'client_id': 'dingding1',
		'client_secret': 'dingding_secret1',
		'grant_type': 'refresh_token',
		'refresh_token': refreshToken
	}

	// 更新全局刷新 Token 标记
	store.commit('user/SET_REFRESHING_TOKEN_FLAG', true)

	return $axiosDingdingSso.post(url, data)
		.then(res => {
			if (res.access_token) {
				store.commit('user/SET_TOKEN', res.access_token)
				store.commit('user/SET_TOKEN_TYPE', res.token_type)

				console.log('=== 令牌刷新成功 ===')

				// 更新全局刷新 Token 标记
				store.commit('user/SET_REFRESHING_TOKEN_FLAG', false)
			}
		}).catch(err => {
			//--- Refresh Token 已过期的情况 => 清除 Token 信息并跳转到登陆页面 ---//
			console.log('=== Refresh Token 已过期 ===')

			// 更新全局刷新 Token 标记
			store.commit('user/SET_REFRESHING_TOKEN_FLAG', false)

			store.commit('user/DEL_TOKEN')

			router.replace({
				path: '/login',
				query: {
					redirect: router.currentRoute.fullPath
				}
			})

			Message.error('登录信息已过期，请重新登录')
			//------//
			throw err
		})
}

/**
 * 获取用户基础信息
 */
export function getInfo() {
	/* const url = '/getInfo'
	return $axios.get(url) */

	const url = '/oauth/check_token'
	
	return $axiosDingdingSso.post(url)
		.then(res => {
		if (res 
			&& res.active 
			&& res.exp
			&& res.active === true 
			&& res.exp > 0) {
			const name = res.user_name
			const roles = res.authorities
			
			// debugger
			store.commit('user/SET_NAME', name)
			store.commit('user/SET_ROLES', roles)
			
			// 获取用户简介
			try {
				getUserDetail()
					.then(res1 => {
					const introduction = res1.introduction
					
					store.commit('user/SET_INTRODUCE', introduction)
				}).catch(error2 => {
					throw error2
				})
			} catch (error1) {
				console.log('=== 获取用户简介 外部捕获异常 => error1:' + error1 + ' ===')
				Message.error(error1)
			}
		} else {
			Message.error('获取用户信息失败')
		}
	})
}
