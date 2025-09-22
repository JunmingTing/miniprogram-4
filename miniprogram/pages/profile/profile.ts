// 我的页面逻辑
interface UserInfo {
  nickName: string;
  avatar: string;
  openId: string;
}

Page({
  data: {
    isLoggedIn: false,
    userInfo: {} as UserInfo,
    hasRejectedPosts: false,
    showLoginDialog: false,
    showLogoutDialog: false
  },

  onLoad() {
    this.checkLoginStatus();
    this.checkRejectedPosts();
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
        userInfo: {}
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
    
    this.setData({ showLoginDialog: true });
  },

  onLoginConfirm() {
    this.setData({ showLoginDialog: false });
    
    // 模拟微信登录
    wx.showLoading({
      title: '登录中...'
    });

    setTimeout(() => {
      // 模拟登录成功
      const mockUserInfo: UserInfo = {
        nickName: '游戏玩家',
        avatar: 'https://via.placeholder.com/160x160/4F46E5/FFFFFF?text=头像',
        openId: 'mock_openid_' + Date.now()
      };

      // 保存用户信息到本地存储
      wx.setStorageSync('userInfo', mockUserInfo);

      this.setData({
        isLoggedIn: true,
        userInfo: mockUserInfo
      });

      wx.hideLoading();
      wx.showToast({
        title: '登录成功',
        icon: 'success'
      });
    }, 1500);
  },

  onLoginCancel() {
    this.setData({ showLoginDialog: false });
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
      userInfo: {},
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
