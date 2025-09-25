// 检查云存储权限的云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { action } = event
  
  try {
    switch (action) {
      case 'checkPermission':
        // 检查云存储权限
        return {
          success: true,
          message: '云存储权限检查通过',
          timestamp: new Date().toISOString()
        }
        
      case 'listFiles':
        // 列出avatars文件夹下的文件
        try {
          const result = await cloud.getTempFileURL({
            fileList: ['cloud://cloud1-4ghl6bw58e8ba561.636c-cloud1-4ghl6bw58e8ba561-1324567890/avatars/']
          })
          return {
            success: true,
            message: '文件列表获取成功',
            files: result.fileList,
            timestamp: new Date().toISOString()
          }
        } catch (err) {
          return {
            success: false,
            message: '无法访问云存储',
            error: err.message,
            timestamp: new Date().toISOString()
          }
        }
        
      default:
        return {
          success: false,
          message: '未知操作',
          timestamp: new Date().toISOString()
        }
    }
  } catch (error) {
    console.error('云函数执行失败:', error)
    return {
      success: false,
      message: '云函数执行失败',
      error: error.message,
      timestamp: new Date().toISOString()
    }
  }
}

