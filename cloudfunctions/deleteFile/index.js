// 云函数：删除云存储文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  const { fileList } = event
  
  console.log('删除文件云函数被调用，参数:', event)
  
  try {
    if (!fileList || !Array.isArray(fileList) || fileList.length === 0) {
      return {
        success: false,
        message: '文件列表不能为空'
      }
    }

    // 过滤掉空字符串和无效的fileID
    const validFileList = fileList.filter(fileID => {
      return fileID && typeof fileID === 'string' && fileID.trim() !== ''
    })

    if (validFileList.length === 0) {
      return {
        success: true,
        message: '没有需要删除的有效文件',
        deletedCount: 0
      }
    }

    console.log('准备删除文件:', validFileList)

    // 调用云存储删除API
    const result = await cloud.deleteFile({
      fileList: validFileList
    })

    console.log('删除结果:', result)

    // 统计删除成功的文件数量
    const deletedCount = result.fileList.filter(item => item.status === 0).length
    const failedCount = result.fileList.filter(item => item.status !== 0).length

    return {
      success: true,
      message: `删除完成，成功: ${deletedCount}，失败: ${failedCount}`,
      deletedCount: deletedCount,
      failedCount: failedCount,
      details: result.fileList
    }

  } catch (error) {
    console.error('删除文件云函数错误:', error)
    return {
      success: false,
      message: '删除文件失败',
      error: error.message
    }
  }
}
