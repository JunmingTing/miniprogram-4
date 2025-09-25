// 测试上传页面
Page({
  data: {
    testResult: '',
    isUploading: false,
    uploadProgress: 0
  },

  onLoad() {
    console.log('测试上传页面加载');
    this.initCloud();
  },

  // 初始化云开发
  initCloud() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
      this.setData({
        testResult: '云开发环境未加载'
      });
      return;
    }
    
    wx.cloud.init({
      env: 'cloud1-4ghl6bw58e8ba561',
      traceUser: true
    });
    
    console.log('云开发环境初始化完成');
    this.setData({
      testResult: '云开发环境初始化完成'
    });
  },

  // 测试基础云函数
  testCloudFunction() {
    console.log('开始测试基础云函数...');
    this.setData({
      testResult: '正在测试基础云函数...'
    });

    wx.cloud.callFunction({
      name: 'test',
      success: (res) => {
        console.log('基础云函数测试成功:', res);
        this.setData({
          testResult: `基础云函数测试成功: ${JSON.stringify(res.result)}`
        });
      },
      fail: (err) => {
        console.error('基础云函数测试失败:', err);
        this.setData({
          testResult: `基础云函数测试失败: ${err.errMsg}`
        });
      }
    });
  },

  // 测试云存储权限
  testStoragePermission() {
    console.log('开始测试云存储权限...');
    this.setData({
      testResult: '正在测试云存储权限...'
    });

    wx.cloud.callFunction({
      name: 'checkStorage',
      data: { action: 'checkPermission' },
      success: (res) => {
        console.log('云存储权限测试成功:', res);
        this.setData({
          testResult: `云存储权限测试成功: ${JSON.stringify(res.result)}`
        });
      },
      fail: (err) => {
        console.error('云存储权限测试失败:', err);
        this.setData({
          testResult: `云存储权限测试失败: ${err.errMsg}`
        });
      }
    });
  },

  // 选择测试图片
  chooseTestImage() {
    console.log('开始选择测试图片...');
    
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: (res) => {
        console.log('选择图片成功:', res);
        const tempFile = res.tempFiles[0];
        const tempFilePath = tempFile.tempFilePath;
        
        console.log('临时文件信息:', {
          path: tempFilePath,
          size: tempFile.size,
          type: tempFile.fileType
        });
        
        this.setData({
          testResult: `选择图片成功: ${tempFilePath}`
        });
        
        // 开始上传测试
        this.testUpload(tempFilePath);
      },
      fail: (err) => {
        console.error('选择图片失败:', err);
        this.setData({
          testResult: `选择图片失败: ${err.errMsg}`
        });
      }
    });
  },

  // 测试上传
  testUpload(filePath: string) {
    console.log('开始测试上传...');
    this.setData({
      isUploading: true,
      uploadProgress: 0,
      testResult: '开始上传测试...'
    });

    const cloudPath = `test-uploads/test-${Date.now()}.jpg`;
    console.log('云存储路径:', cloudPath);

    const uploadTask = wx.cloud.uploadFile({
      cloudPath: cloudPath,
      filePath: filePath,
      success: (res) => {
        console.log('上传成功:', res);
        this.setData({
          isUploading: false,
          uploadProgress: 100,
          testResult: `上传成功！文件ID: ${res.fileID}`
        });
      },
      fail: (err) => {
        console.error('上传失败:', err);
        this.setData({
          isUploading: false,
          uploadProgress: 0,
          testResult: `上传失败: ${err.errMsg}`
        });
      }
    });

    // 监听上传进度
    uploadTask.onProgressUpdate((res) => {
      console.log('上传进度:', res.progress + '%');
      this.setData({
        uploadProgress: res.progress,
        testResult: `上传中... ${res.progress}%`
      });
    });
  },

  // 清空测试结果
  clearResult() {
    this.setData({
      testResult: '',
      isUploading: false,
      uploadProgress: 0
    });
  }
});

