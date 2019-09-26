const getters = {
  token: state => state.user.token,
	tokenType: state => state.user.tokenType,
  userName: state => state.user.userName,
  refreshToken: state => state.user.refreshToken,
	refreshingTokenFlag: state => state.user.refreshingTokenFlag,
  roles: state => state.user.roles,
  introduce: state => state.user.introduce,
  routes: state => state.permission.routes,
  addRoutes: state => state.permission.addRoutes,
  opened: state => {
    if (state.app.opened === 'false') {
      return false
    } else if (state.app.opened === 'true') {
      return true
    }
  },
  msgIsShow: state => state.app.msgIsShow,
  showDriver: state => state.app.showDriver
}

export default getters
