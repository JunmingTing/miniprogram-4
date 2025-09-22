// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const { code } = event
  
  console.log('登录云函数被调用，参数:', event)
  
  try {
    // 1. 通过 code 获取 openId
    const wxContext = cloud.getWXContext()
    console.log('微信上下文:', wxContext)
    
    const { OPENID } = wxContext
    
    if (!OPENID) {
      console.error('无法获取OPENID，微信上下文:', wxContext)
      return {
        success: false,
        message: '获取用户openid失败，请检查云函数配置'
      }
    }
    
    console.log('成功获取OPENID:', OPENID)

    // 2. 查询用户是否已存在
    const userQuery = await db.collection('users').where({
      openId: OPENID
    }).get()

    let userData
    let isNewUser = false

    if (userQuery.data.length === 0) {
      // 新用户，创建用户记录（使用默认信息）
      const now = new Date()
      userData = {
        openId: OPENID,
        nickName: '微信用户',
        avatar: '',
        gender: 0,
        country: '',
        province: '',
        city: '',
        language: 'zh_CN',
        createTime: now,
        updateTime: now
      }

      const createResult = await db.collection('users').add({
        data: userData
      })

      userData._id = createResult._id
      isNewUser = true
    } else {
      // 现有用户，直接返回用户信息
      const existingUser = userQuery.data[0]
      userData = existingUser
    }

    return {
      success: true,
      openId: OPENID,
      _id: userData._id,
      userInfo: {
        nickName: userData.nickName,
        avatarUrl: userData.avatar
      },
      isNewUser: isNewUser,
      message: isNewUser ? '注册成功' : '登录成功'
    }

  } catch (error) {
    console.error('登录云函数错误:', error)
    return {
      success: false,
      message: '登录失败，请重试'
    }
  }
}