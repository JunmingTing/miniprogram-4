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
    showLogoutDialog: false
  },

  onLoad() {
    // 初始化云开发
    this.initCloud();
    this.checkLoginStatus();
    this.checkRejectedPosts();
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
  },

  // 检查登录状态
  checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
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
    if (!this.data.isLoggedIn) return;
    
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.uploadAvatar(tempFilePath);
      },
      fail: (err) => {
        console.error('选择头像失败:', err);
        wx.showToast({
          title: '选择头像失败',
          icon: 'error'
        });
      }
    });
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

  // 上传头像
  uploadAvatar(filePath: string) {
    wx.showLoading({
      title: '上传中...'
    });

    wx.cloud.uploadFile({
      cloudPath: `avatars/${this.data.userInfo._id}_${Date.now()}.jpg`,
      filePath: filePath,
      success: (res) => {
        this.updateUserInfo({ avatar: res.fileID });
        wx.hideLoading();
        wx.showToast({
          title: '头像更新成功',
          icon: 'success'
        });
      },
      fail: (err) => {
        console.error('上传头像失败:', err);
        wx.hideLoading();
        wx.showToast({
          title: '上传失败',
          icon: 'error'
        });
      }
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
  updateUserInfo(updateData: { nickName?: string; avatar?: string }) {
    wx.cloud.callFunction({
      name: 'updateUserInfo',
      data: {
        userId: this.data.userInfo._id,
        ...updateData
      },
      success: (res: any) => {
        if (res.result && res.result.success) {
          // 更新本地数据
          const newUserInfo = {
            ...this.data.userInfo,
            ...updateData
          };
          
          this.setData({
            userInfo: newUserInfo
          });
          
          // 更新本地存储
          wx.setStorageSync('userInfo', newUserInfo);
          
          wx.hideLoading();
          wx.showToast({
            title: '更新成功',
            icon: 'success'
          });
        } else {
          wx.hideLoading();
          wx.showToast({
            title: res.result?.message || '更新失败',
            icon: 'error'
          });
        }
      },
      fail: (err) => {
        console.error('更新用户信息失败:', err);
        wx.hideLoading();
        wx.showToast({
          title: '更新失败',
          icon: 'error'
        });
      }
    });
  },


  // 管理帖子
  onMyPostsTap() {
    if (!this.data.isLoggedIn) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    wx.navigateTo({
      url: '/pages/my-posts/my-posts'
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

  // 测试云函数
  onTestCloudFunction() {
    wx.showLoading({
      title: '测试中...'
    });
    
    wx.cloud.callFunction({
      name: 'test',
      success: (res: any) => {
        console.log('测试云函数结果:', res);
        wx.hideLoading();
        const result = res.result || {};
        wx.showModal({
          title: '云函数测试结果',
          content: `成功: ${result.success || false}\n消息: ${result.message || '无消息'}\n时间: ${result.timestamp || '无时间'}`,
          showCancel: false,
          confirmText: '知道了'
        });
      },
      fail: (err) => {
        console.error('测试云函数失败:', err);
        wx.hideLoading();
        wx.showModal({
          title: '云函数测试失败',
          content: `错误: ${err.errMsg || '未知错误'}`,
          showCancel: false,
          confirmText: '知道了'
        });
      }
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
    this.setData({ showLogoutDialog: true });
  },

  onLogoutConfirm() {
    this.setData({ showLogoutDialog: false });
    
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

  onLogoutCancel() {
    this.setData({ showLogoutDialog: false });
  }
});
