// 测试云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  console.log('测试云函数被调用')
  
  try {
    const wxContext = cloud.getWXContext()
    console.log('微信上下文:', wxContext)
    
    return {
      success: true,
      message: '云函数调用成功',
      wxContext: wxContext,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('测试云函数错误:', error)
    return {
      success: false,
      message: '云函数调用失败',
      error: error.message
    }
  }
}
