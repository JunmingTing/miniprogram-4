// 头像上传弹窗组件
Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    },
    currentAvatar: {
      type: String,
      value: ''
    },
    userId: {
      type: String,
      value: ''
    }
  },

  observers: {
    'visible': function(visible) {
      console.log('=== 头像上传弹窗状态变化 ===');
      console.log('弹窗可见性:', visible);
      console.log('当前头像:', this.data.currentAvatar);
      console.log('用户ID:', this.data.userId);
    }
  },

  data: {
    isUploading: false,
    uploadProgress: '准备上传...',
    uploadPercent: 0,
    selectedImage: '',
    selectedFilePath: ''
  },

  methods: {
    // 初始化云开发环境
    initCloud() {
      if (!wx.cloud) {
        console.error('请使用 2.2.3 或以上的基础库以使用云能力');
        return false;
      }
      
      // 检查是否已经初始化
      if (wx.cloud.env) {
        console.log('云开发环境已初始化，环境ID:', wx.cloud.env);
        return true;
      }
      
      console.log('初始化云开发环境...');
      wx.cloud.init({
        env: 'cloud1-4ghl6bw58e8ba561',
        traceUser: true
      });
      return true;
    },

    // 关闭弹窗
    onClose() {
      // 重置状态
      this.setData({
        selectedImage: '',
        selectedFilePath: '',
        isUploading: false,
        uploadProgress: '准备上传...',
        uploadPercent: 0
      });
      this.triggerEvent('close');
    },

    // 弹窗显示状态变化
    onVisibleChange(e: any) {
      if (!e.detail.visible) {
        this.triggerEvent('close');
      }
    },

    // 从相册选择
    onChooseFromAlbum() {
      this.chooseImage(['album']);
    },

    // 拍照
    onTakePhoto() {
      console.log('用户点击拍照按钮');
      this.chooseImage(['camera']);
    },

    // 选择图片
    chooseImage(sourceType: string[]) {
      console.log('开始选择图片，来源类型:', sourceType);
      
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: sourceType,
        sizeType: ['compressed'], // 使用压缩图片
        success: (res) => {
          console.log('选择图片成功:', res);
          const tempFile = res.tempFiles[0];
          const tempFilePath = tempFile.tempFilePath;
          
          console.log('临时文件信息:', {
            path: tempFilePath,
            size: tempFile.size,
            type: tempFile.fileType
          });
          
          // 检查文件大小（限制为5MB）
          if (tempFile.size > 5 * 1024 * 1024) {
            wx.showToast({
              title: '图片大小不能超过5MB',
              icon: 'error'
            });
            return;
          }
          
          // 先显示预览，不直接上传
          console.log('设置预览图片:', tempFilePath);
          console.log('来源类型:', sourceType);
          console.log('是否为拍照:', sourceType.includes('camera'));
          
          this.setData({
            selectedImage: tempFilePath,
            selectedFilePath: tempFilePath
          });
          
          console.log('预览图片设置完成，当前状态:', this.data);
          console.log('selectedImage:', this.data.selectedImage);
          console.log('selectedFilePath:', this.data.selectedFilePath);
        },
        fail: (err) => {
          console.error('选择图片失败:', err);
          let errorMsg = '选择图片失败';
          
          if (err.errMsg.includes('cancel')) {
            // 用户取消选择，不显示错误提示
            console.log('用户取消选择图片');
            return;
          } else if (err.errMsg.includes('permission')) {
            errorMsg = '请允许访问相册或相机';
          } else if (err.errMsg.includes('system')) {
            errorMsg = '系统错误，请重试';
          }
          
          wx.showToast({
            title: errorMsg,
            icon: 'error'
          });
        }
      });
    },

    // 确认上传
    onConfirmUpload() {
      console.log('用户点击确认上传按钮');
      console.log('当前选中的文件路径:', this.data.selectedFilePath);
      
      // 确保云开发环境已初始化
      if (!this.initCloud()) {
        wx.showToast({
          title: '云开发环境初始化失败',
          icon: 'error'
        });
        return;
      }
      
      if (this.data.selectedFilePath) {
        console.log('开始上传头像，文件路径:', this.data.selectedFilePath);
        this.uploadAvatar(this.data.selectedFilePath);
      } else {
        console.error('没有选中的文件路径，无法上传');
        wx.showToast({
          title: '请先选择图片',
          icon: 'error'
        });
      }
    },

    // 重新选择
    onReselect() {
      this.setData({
        selectedImage: '',
        selectedFilePath: ''
      });
    },

    // 上传头像
    uploadAvatar(filePath: string) {
      console.log('开始上传头像，用户ID:', this.data.userId, '文件路径:', filePath);
      
      if (!this.data.userId) {
        console.error('用户ID为空，无法上传');
        wx.showToast({
          title: '用户信息错误',
          icon: 'error'
        });
        return;
      }

      // 检查文件是否存在
      wx.getFileInfo({
        filePath: filePath,
        success: (fileInfo) => {
          console.log('文件信息验证成功:', fileInfo);
          this.performUpload(filePath);
        },
        fail: (err) => {
          console.error('文件不存在或无法访问:', err);
          wx.showToast({
            title: '文件不存在，请重新选择',
            icon: 'error'
          });
        }
      });
    },

    // 执行上传
    performUpload(filePath: string) {
      console.log('=== 开始执行上传 ===');
      console.log('文件路径:', filePath);
      console.log('用户ID:', this.data.userId);
      console.log('云开发环境状态:', wx.cloud ? '已加载' : '未加载');
      console.log('云开发环境ID:', wx.cloud?.env || '未设置');
      
      this.setData({
        isUploading: true,
        uploadProgress: '正在上传...',
        uploadPercent: 0
      });

      // 使用用户ID作为文件名，确保唯一性
      const cloudPath = `avatars/${this.data.userId}_${Date.now()}.jpg`;
      console.log('云存储路径:', cloudPath);

      // 先测试云开发环境
      this.testCloudEnvironment().then(() => {
        console.log('云开发环境测试通过，开始上传文件');
        this.actualUpload(filePath, cloudPath);
      }).catch((err) => {
        console.error('云开发环境测试失败:', err);
        this.setData({
          isUploading: false,
          uploadProgress: '环境检查失败',
          uploadPercent: 0
        });
        wx.showModal({
          title: '上传失败',
          content: `云开发环境检查失败: ${err.message || '未知错误'}\n\n请检查：\n1. 云开发环境是否正确配置\n2. 网络连接是否正常\n3. 云函数是否已部署`,
          showCancel: false,
          confirmText: '知道了'
        });
      });
    },

    // 测试云开发环境
    testCloudEnvironment() {
      return new Promise((resolve, reject) => {
        console.log('开始测试云开发环境...');
        
        // 测试基础云函数
        wx.cloud.callFunction({
          name: 'test',
          success: (res) => {
            console.log('基础云函数测试成功:', res);
            
            // 测试云存储权限
            wx.cloud.callFunction({
              name: 'checkStorage',
              data: { action: 'checkPermission' },
              success: (storageRes) => {
                console.log('云存储权限测试成功:', storageRes);
                resolve();
              },
              fail: (storageErr) => {
                console.error('云存储权限测试失败:', storageErr);
                reject(new Error(`云存储权限测试失败: ${storageErr.errMsg}`));
              }
            });
          },
          fail: (err) => {
            console.error('基础云函数测试失败:', err);
            reject(new Error(`基础云函数测试失败: ${err.errMsg}`));
          }
        });
      });
    },

    // 实际执行上传
    actualUpload(filePath: string, cloudPath: string) {
      console.log('开始实际上传文件...');
      
      const uploadTask = wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: filePath,
        success: (res) => {
          console.log('=== 头像上传成功 ===');
          console.log('上传结果:', res);
          console.log('文件ID:', res.fileID);
          console.log('文件大小:', res.size);
          
          this.setData({
            isUploading: false,
            uploadProgress: '上传成功！',
            uploadPercent: 100
          });

          // 延迟一下让用户看到成功状态
          setTimeout(() => {
            console.log('触发上传成功事件，fileID:', res.fileID);
            this.triggerEvent('upload-success', {
              fileID: res.fileID,
              cloudPath: cloudPath
            });
          }, 800);
        },
        fail: (err) => {
          console.error('=== 头像上传失败 ===');
          console.error('错误对象:', err);
          console.error('错误详情:', JSON.stringify(err, null, 2));
          console.error('错误消息:', err.errMsg);
          console.error('错误代码:', err.errCode);
          
          this.setData({
            isUploading: false,
            uploadProgress: '上传失败',
            uploadPercent: 0
          });
          
          let errorMsg = '上传失败，请重试';
          let errorDetail = '';
          
          // 根据错误类型提供更具体的错误信息
          if (err.errMsg.includes('network')) {
            errorMsg = '网络错误，请检查网络连接';
            errorDetail = '请检查网络连接是否正常';
          } else if (err.errMsg.includes('timeout')) {
            errorMsg = '上传超时，请重试';
            errorDetail = '上传时间过长，请重试';
          } else if (err.errMsg.includes('quota')) {
            errorMsg = '存储空间不足';
            errorDetail = '云存储空间已满，请联系管理员';
          } else if (err.errMsg.includes('permission')) {
            errorMsg = '权限不足，请重试';
            errorDetail = '没有上传文件的权限';
          } else if (err.errMsg.includes('file not found')) {
            errorMsg = '文件不存在，请重新选择';
            errorDetail = '选择的文件已被删除或移动';
          } else if (err.errMsg.includes('invalid file')) {
            errorMsg = '文件格式不支持';
            errorDetail = '请选择JPG或PNG格式的图片';
          } else if (err.errMsg.includes('cloud function')) {
            errorMsg = '云函数调用失败';
            errorDetail = '请检查云函数是否已部署';
          } else if (err.errMsg.includes('cloud storage')) {
            errorMsg = '云存储服务异常';
            errorDetail = '云存储服务暂时不可用';
          }
          
          console.error('显示错误提示:', errorMsg);
          
          // 显示详细的错误信息
          wx.showModal({
            title: errorMsg,
            content: `${errorDetail}\n\n错误详情: ${err.errMsg}\n错误代码: ${err.errCode || '无'}`,
            showCancel: true,
            cancelText: '知道了',
            confirmText: '重试',
            success: (modalRes) => {
              if (modalRes.confirm) {
                // 用户选择重试
                this.performUpload(filePath);
              }
            }
          });
        }
      });

      // 监听上传进度
      uploadTask.onProgressUpdate((res) => {
        console.log('上传进度:', res.progress + '%');
        this.setData({
          uploadPercent: res.progress,
          uploadProgress: `上传中... ${res.progress}%`
        });
      });
    }
  }
});
