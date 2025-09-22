// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const { userId, nickName, avatar } = event
  
  try {
    if (!userId) {
      return {
        success: false,
        message: '用户ID不能为空'
      }
    }

    // 构建更新数据
    const updateData = {
      updateTime: new Date()
    }

    if (nickName !== undefined) {
      updateData.nickName = nickName
    }

    if (avatar !== undefined) {
      updateData.avatar = avatar
    }

    // 更新用户信息
    const result = await db.collection('users').doc(userId).update({
      data: updateData
    })

    if (result.stats.updated > 0) {
      return {
        success: true,
        message: '更新成功'
      }
    } else {
      return {
        success: false,
        message: '用户不存在或更新失败'
      }
    }

  } catch (error) {
    console.error('更新用户信息错误:', error)
    return {
      success: false,
      message: '更新失败，请重试'
    }
  }
}
