import $axiosDingdingUserServiceClient from './dingdingUserServiceClient'

export function getUserDetail() {
  const url = '/user/userDetail'
  return $axiosDingdingUserServiceClient.get(url)
}
