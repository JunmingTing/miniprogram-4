// 我的页面逻辑
interface UserInfo {
  nickName: string;
  avatar: string;
  openId: string;
  _id?: string;
}

interface LoginResult {
  code: string;
  encryptedData?: string;
  iv?: string;
}

Page({
  data: {
    isLoggedIn: false,
    userInfo: {
      nickName: '',
      avatar: '',
      openId: ''
    } as UserInfo,
    hasRejectedPosts: false,
    showAvatarDialog: false,
    // 测试图片上传相关
    testImage: '', // 当前测试图片的临时URL
    testImagePath: '', // 云存储路径
    testImageTime: '', // 上传时间
    uploadingTest: false, // 上传中状态
    deletingTest: false // 删除中状态
  },

  onLoad() {
    // 初始化云开发
    this.initCloud();
    this.checkLoginStatus();
    this.checkRejectedPosts();
    this.loadTestImage();
  },

  // 初始化云开发
  initCloud() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
      return;
    }
    wx.cloud.init({
      env: 'cloud1-4ghl6bw58e8ba561',
      traceUser: true
    });
  },

  onShow() {
    // 页面显示时检查登录状态和帖子状态
    this.checkLoginStatus();
    this.checkRejectedPosts();
    this.loadTestImage();
    
    // 调试：显示当前用户信息
    console.log('Profile页面显示，当前用户信息:', this.data.userInfo);
    console.log('用户头像URL:', this.data.userInfo.avatar);
  },

  // 检查登录状态
  checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      console.log('从本地存储获取的用户信息:', userInfo);
      console.log('用户头像URL:', userInfo.avatar);
      this.setData({
        isLoggedIn: true,
        userInfo: userInfo
      });
    } else {
      this.setData({
        isLoggedIn: false,
        userInfo: {
          nickName: '',
          avatar: '',
          openId: ''
        }
      });
    }
  },

  // 检查是否有被驳回的帖子
  checkRejectedPosts() {
    // 模拟检查被驳回的帖子
    const hasRejectedPosts = Math.random() > 0.5; // 随机模拟
    this.setData({ hasRejectedPosts });
  },

  // 登录相关
  onLoginTap() {
    if (this.data.isLoggedIn) return;
    
    // 直接显示确认对话框
    wx.showModal({
      title: '微信登录',
      content: '是否使用微信账号登录？登录后可以发布帖子、收藏内容等功能。',
      showCancel: true,
      cancelText: '取消',
      confirmText: '确认登录',
      success: (res) => {
        if (res.confirm) {
          this.wxLogin();
        }
      }
    });
  },

  // 微信登录
  wxLogin() {
    wx.showLoading({
      title: '登录中...'
    });

    // 1. 调用微信登录接口
    wx.login({
      success: (res: LoginResult) => {
        if (res.code) {
          // 2. 直接调用云函数进行登录（不获取用户信息）
          this.callCloudLogin(res.code);
        } else {
          wx.hideLoading();
          wx.showToast({
            title: '登录失败',
            icon: 'error'
          });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({
          title: '登录失败',
          icon: 'error'
        });
      }
    });
  },

  // 调用云函数登录
  callCloudLogin(code: string) {
    wx.cloud.callFunction({
      name: 'login',
      data: {
        code: code
      },
      success: (res: any) => {
        if (res.result && res.result.success) {
          const userData: UserInfo = {
            nickName: res.result.userInfo.nickName,
            avatar: res.result.userInfo.avatarUrl,
            openId: res.result.openId,
            _id: res.result._id
          };

          // 保存用户信息到本地存储
          wx.setStorageSync('userInfo', userData);

          this.setData({
            isLoggedIn: true,
            userInfo: userData
          });

          wx.hideLoading();
          wx.showToast({
            title: '登录成功',
            icon: 'success'
          });
        } else {
          wx.hideLoading();
          wx.showToast({
            title: res.result?.message || '登录失败',
            icon: 'error'
          });
        }
      },
      fail: (err) => {
        console.error('云函数调用失败:', err);
        wx.hideLoading();
        wx.showModal({
          title: '登录失败',
          content: `云函数调用失败: ${err.errMsg || '未知错误'}\n\n请检查：\n1. 云函数是否已部署\n2. 云开发环境是否正确\n3. 网络连接是否正常`,
          showCancel: false,
          confirmText: '知道了'
        });
      }
    });
  },

  // 点击头像设置
  onAvatarTap() {
    console.log('=== 头像点击事件触发 ===');
    console.log('用户登录状态:', this.data.isLoggedIn);
    console.log('用户信息:', this.data.userInfo);
    
    if (!this.data.isLoggedIn) {
      console.log('用户未登录，不显示头像设置弹窗');
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    
    console.log('显示头像上传弹窗');
    // 显示自定义头像上传弹窗
    this.setData({
      showAvatarDialog: true
    });
    
    console.log('弹窗状态已设置为true');
  },

  // 点击昵称设置
  onNicknameTap() {
    if (!this.data.isLoggedIn) return;
    
    wx.showModal({
      title: '设置昵称',
      editable: true,
      placeholderText: '请输入昵称',
      success: (res) => {
        if (res.confirm && res.content) {
          this.updateNickname(res.content.trim());
        }
      }
    });
  },

  // 头像上传弹窗关闭
  onAvatarDialogClose() {
    this.setData({
      showAvatarDialog: false
    });
  },

  // 头像上传成功
  onAvatarUploadSuccess(e: any) {
    console.log('=== 收到头像上传成功事件 ===');
    console.log('事件详情:', e.detail);
    const { fileID, cloudPath } = e.detail;
    
    if (!fileID) {
      console.error('fileID为空，无法更新头像');
      wx.showToast({
        title: '头像更新失败',
        icon: 'error'
      });
      return;
    }
    
    console.log('开始更新头像，fileID:', fileID);
    console.log('云存储路径:', cloudPath);
    console.log('当前用户信息:', this.data.userInfo);
    
    // 保存旧头像URL用于后续删除
    const oldAvatar = this.data.userInfo.avatar;
    console.log('旧头像URL:', oldAvatar);
    
    // 立即更新界面显示 - 添加时间戳参数避免缓存
    const newUserInfo = {
      ...this.data.userInfo,
      avatar: fileID + '?v=' + new Date().getTime()
    };
    
    console.log('准备更新界面，新用户信息:', newUserInfo);
    
    this.setData({
      userInfo: newUserInfo,
      showAvatarDialog: false
    });
    
    console.log('界面已更新，新头像:', fileID);
    console.log('更新后的用户信息:', this.data.userInfo);

    // 更新本地存储
    wx.setStorageSync('userInfo', newUserInfo);
    console.log('本地存储已更新');

    // 更新数据库中的用户信息
    this.updateUserInfo({ avatar: fileID }, oldAvatar);
    
    wx.showToast({
      title: '头像更新成功',
      icon: 'success'
    });
  },

  // 更新昵称
  updateNickname(nickName: string) {
    if (!nickName) {
      wx.showToast({
        title: '昵称不能为空',
        icon: 'error'
      });
      return;
    }

    wx.showLoading({
      title: '更新中...'
    });

    this.updateUserInfo({ nickName: nickName });
  },

  // 更新用户信息
  updateUserInfo(updateData: { nickName?: string; avatar?: string }, oldAvatar?: string) {
    console.log('开始更新用户信息:', updateData);
    console.log('用户ID:', this.data.userInfo._id);
    console.log('旧头像URL:', oldAvatar);
    
    wx.cloud.callFunction({
      name: 'updateUserInfo',
      data: {
        userId: this.data.userInfo._id,
        ...updateData
      },
      success: (res: any) => {
        console.log('云函数调用成功:', res);
        
        if (res.result && res.result.success) {
          console.log('数据库更新成功');
          
          // 更新本地数据
          const newUserInfo = {
            ...this.data.userInfo,
            ...updateData
          };
          
          console.log('新的用户信息:', newUserInfo);
          
          this.setData({
            userInfo: newUserInfo
          });
          
          // 更新本地存储
          wx.setStorageSync('userInfo', newUserInfo);
          console.log('本地存储已更新');
          
          wx.hideLoading();
          
          // 如果是头像更新且有旧头像，删除旧头像
          if (updateData.avatar && oldAvatar && oldAvatar.trim() !== '') {
            this.deleteOldAvatar(oldAvatar);
          }
          
          // 如果是头像更新，不显示额外的成功提示（因为组件已经显示了）
          if (!updateData.avatar) {
            wx.showToast({
              title: '更新成功',
              icon: 'success'
            });
          }
        } else {
          console.error('数据库更新失败:', res.result);
          wx.hideLoading();
          wx.showToast({
            title: res.result?.message || '更新失败',
            icon: 'error'
          });
        }
      },
      fail: (err) => {
        console.error('云函数调用失败:', err);
        wx.hideLoading();
        wx.showToast({
          title: '更新失败',
          icon: 'error'
        });
      }
    });
  },

  // 删除旧头像
  deleteOldAvatar(oldAvatar: string) {
    console.log('=== 开始删除旧头像 ===');
    console.log('旧头像URL:', oldAvatar);
    
    // 检查是否是有效的云存储fileID
    if (!oldAvatar || !oldAvatar.startsWith('cloud://')) {
      console.log('旧头像不是云存储文件，跳过删除');
      return;
    }
    
    // 移除URL参数（如?v=1234567890）
    const cleanFileID = oldAvatar.split('?')[0];
    console.log('清理后的fileID:', cleanFileID);
    
    wx.cloud.callFunction({
      name: 'deleteFile',
      data: {
        fileList: [cleanFileID]
      },
      success: (res: any) => {
        console.log('删除旧头像云函数调用成功:', res);
        
        if (res.result && res.result.success) {
          console.log('旧头像删除成功，删除数量:', res.result.deletedCount);
          if (res.result.failedCount > 0) {
            console.warn('部分文件删除失败，失败数量:', res.result.failedCount);
            console.warn('删除详情:', res.result.details);
          }
        } else {
          console.error('旧头像删除失败:', res.result);
        }
      },
      fail: (err) => {
        console.error('删除旧头像云函数调用失败:', err);
      }
    });
  },


  // 我的收藏
  onMyFavoritesTap() {
    if (!this.data.isLoggedIn) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    wx.navigateTo({
      url: '/pages/my-favorites/my-favorites'
    });
  },

  // 设置
  onSettingsTap() {
    wx.showToast({
      title: '设置功能开发中',
      icon: 'none'
    });
  },


  // 关于我们
  onAboutTap() {
    wx.showModal({
      title: '关于我们',
      content: '游戏资讯小程序 v1.0.0\n\n这是一个让大家可以查看各种最新游戏资讯的小程序，用户可以在社区板块分享自己的游戏图片。',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 退出登录
  onLogoutTap() {
    wx.showModal({
      title: '确认退出',
      content: '您确定要退出登录吗？',
      confirmText: '确认',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 用户点击了确认按钮，执行退出登录操作
          this.performLogout();
        } else if (res.cancel) {
          // 用户点击了取消按钮，不执行任何操作
          console.log('用户取消退出登录');
        }
      }
    });
  },

  // 执行退出登录操作
  performLogout() {
    // 清除本地存储的用户信息
    wx.removeStorageSync('userInfo');
    
    this.setData({
      isLoggedIn: false,
      userInfo: {
        nickName: '',
        avatar: '',
        openId: ''
      },
      hasRejectedPosts: false
    });

    wx.showToast({
      title: '已退出登录',
      icon: 'success'
    });
  },

  // ========== 测试图片上传功能 ==========

  // 加载测试图片
  loadTestImage() {
    console.log('=== 加载测试图片 ===');
    const testImageInfo = wx.getStorageSync('testImageInfo');
    if (testImageInfo) {
      console.log('从本地存储加载测试图片信息:', testImageInfo);
      
      // 获取临时URL
      this.getTestImageTempUrl(testImageInfo.fileID, testImageInfo.path, testImageInfo.time);
    } else {
      console.log('本地存储中没有测试图片信息');
      this.setData({
        testImage: '',
        testImagePath: '',
        testImageTime: ''
      });
    }
  },

  // 获取测试图片的临时URL
  async getTestImageTempUrl(fileID: string, path: string, time: string) {
    try {
      console.log('获取测试图片临时URL，fileID:', fileID);
      const result = await wx.cloud.getTempFileURL({
        fileList: [fileID]
      });

      if (result.fileList && result.fileList.length > 0) {
        const file = result.fileList[0];
        if (file.status === 0) {
          console.log('获取测试图片临时URL成功:', file.tempFileURL);
          this.setData({
            testImage: file.tempFileURL,
            testImagePath: path,
            testImageTime: time
          });
        } else {
          console.error('获取测试图片临时URL失败，状态码:', file.status);
          // 清除无效的本地存储
          wx.removeStorageSync('testImageInfo');
          this.setData({
            testImage: '',
            testImagePath: '',
            testImageTime: ''
          });
        }
      }
    } catch (err) {
      console.error('获取测试图片临时URL异常:', err);
      // 清除无效的本地存储
      wx.removeStorageSync('testImageInfo');
      this.setData({
        testImage: '',
        testImagePath: '',
        testImageTime: ''
      });
    }
  },

  // 测试上传图片
  onTestUploadTap() {
    console.log('=== 点击测试上传图片 ===');
    
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        console.log('选择图片成功:', res);
        if (res.tempFiles && res.tempFiles.length > 0) {
          const tempFile = res.tempFiles[0];
          this.uploadTestImage(tempFile.tempFilePath);
        }
      },
      fail: (err) => {
        console.error('选择图片失败:', err);
        wx.showToast({
          title: '选择图片失败',
          icon: 'error'
        });
      }
    });
  },

  // 上传测试图片
  async uploadTestImage(tempFilePath: string) {
    console.log('=== 开始上传测试图片 ===');
    console.log('临时文件路径:', tempFilePath);

    this.setData({ uploadingTest: true });

    try {
      // 如果有旧图片，先删除
      if (this.data.testImagePath) {
        console.log('删除旧的测试图片:', this.data.testImagePath);
        await this.deleteTestImageFromCloud(this.data.testImagePath);
      }

      // 生成新的文件名
      const timestamp = new Date().getTime();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const fileName = `test_${timestamp}_${randomStr}.jpg`;
      const cloudPath = `images/${fileName}`;

      console.log('上传到云存储，路径:', cloudPath);

      // 上传到云存储
      const uploadResult = await wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: tempFilePath
      });

      console.log('上传成功:', uploadResult);

      // 获取临时URL用于显示
      const tempUrlResult = await wx.cloud.getTempFileURL({
        fileList: [uploadResult.fileID]
      });

      if (tempUrlResult.fileList && tempUrlResult.fileList.length > 0) {
        const tempFileURL = tempUrlResult.fileList[0].tempFileURL;
        const uploadTime = new Date().toLocaleString();

        console.log('获取临时URL成功:', tempFileURL);

        // 保存到本地存储
        const testImageInfo = {
          fileID: uploadResult.fileID,
          path: cloudPath,
          time: uploadTime
        };
        wx.setStorageSync('testImageInfo', testImageInfo);

        // 更新界面
        this.setData({
          testImage: tempFileURL,
          testImagePath: cloudPath,
          testImageTime: uploadTime,
          uploadingTest: false
        });

        wx.showToast({
          title: '上传成功',
          icon: 'success'
        });

        console.log('测试图片上传完成');
      }
    } catch (err) {
      console.error('上传测试图片失败:', err);
      this.setData({ uploadingTest: false });
      
      wx.showToast({
        title: '上传失败',
        icon: 'error'
      });
    }
  },

  // 删除测试图片
  onTestDeleteTap() {
    console.log('=== 点击删除测试图片 ===');
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除当前测试图片吗？',
      confirmText: '删除',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.deleteTestImage();
        }
      }
    });
  },

  // 执行删除测试图片
  async deleteTestImage() {
    console.log('=== 开始删除测试图片 ===');
    
    if (!this.data.testImagePath) {
      console.log('没有测试图片可删除');
      return;
    }

    this.setData({ deletingTest: true });

    try {
      // 从云存储删除文件
      await this.deleteTestImageFromCloud(this.data.testImagePath);

      // 清除本地存储
      wx.removeStorageSync('testImageInfo');

      // 更新界面
      this.setData({
        testImage: '',
        testImagePath: '',
        testImageTime: '',
        deletingTest: false
      });

      wx.showToast({
        title: '删除成功',
        icon: 'success'
      });

      console.log('测试图片删除完成');
    } catch (err) {
      console.error('删除测试图片失败:', err);
      this.setData({ deletingTest: false });
      
      wx.showToast({
        title: '删除失败',
        icon: 'error'
      });
    }
  },

  // 从云存储删除测试图片
  async deleteTestImageFromCloud(cloudPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('从云存储删除文件:', cloudPath);
      
      // 构建完整的fileID
      const fileID = `cloud://cloud1-4ghl6bw58e8ba561.636c-cloud1-4ghl6bw58e8ba561-1330048256/${cloudPath}`;
      console.log('完整fileID:', fileID);

      wx.cloud.deleteFile({
        fileList: [fileID],
        success: (res) => {
          console.log('云存储删除文件成功:', res);
          if (res.fileList && res.fileList.length > 0) {
            const deleteResult = res.fileList[0];
            if (deleteResult.status === 0) {
              console.log('文件删除成功');
              resolve();
            } else {
              console.error('文件删除失败，状态码:', deleteResult.status);
              reject(new Error(`删除失败，状态码: ${deleteResult.status}`));
            }
          } else {
            resolve(); // 没有返回结果也视为成功
          }
        },
        fail: (err) => {
          console.error('云存储删除文件失败:', err);
          reject(err);
        }
      });
    });
  }
});
