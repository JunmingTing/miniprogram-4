// 我的帖子管理页面逻辑
interface MyPost {
  id: string;
  coverImage: string;
  imageCount: number;
  isRejected: boolean;
  rejectReason?: string;
  publishTime: string;
}

Page({
  data: {
    posts: [] as MyPost[],
    loading: true,
    userInfo: null,
  },

  onLoad() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({ userInfo });
      this.loadMyPosts();
    } else {
      // Handle case where user info is not available
      this.setData({ loading: false });
      wx.showToast({
        title: '请先登录',
        icon: 'none',
      });
    }
  },

  onShow() {
    // 页面显示时刷新数据
    if (this.data.userInfo) {
      this.loadMyPosts();
    }
  },

  // 加载我的帖子
  async loadMyPosts() {
    if (!this.data.userInfo || !this.data.userInfo.openId) {
      console.error('无法加载帖子，未找到用户信息或 openId');
      this.setData({ loading: false });
      return;
    }

    this.setData({ loading: true });

    try {
      const db = wx.cloud.database();
      const res = await db.collection('posts')
        .where({
          _openid: this.data.userInfo.openId
        })
        .orderBy('createTime', 'desc')
        .get();

      const myPosts = await Promise.all(res.data.map(async (post: any) => {
        const coverImage = post.images && post.images.length > 0 ? post.images[0] : '';
        const tempImageUrls = await this.getTempImageUrls([coverImage]);

        return {
          id: post._id,
          coverImage: tempImageUrls[0] || '',
          imageCount: post.images ? post.images.length : 0,
          isRejected: post.isRejected || false,
          rejectReason: post.rejectReason,
          publishTime: this.formatTime(post.createTime),
        };
      }));

      this.setData({
        posts: myPosts,
        loading: false
      });

    } catch (err) {
      console.error('加载我的帖子失败:', err);
      this.setData({ loading: false });
      wx.showToast({
        title: '加载失败',
        icon: 'none',
      });
    }
  },

  // 获取图片的临时链接
  async getTempImageUrls(fileIDs: string[]): Promise<string[]> {
    if (!fileIDs || fileIDs.length === 0 || !fileIDs[0]) {
      return [];
    }
    try {
      const result = await wx.cloud.getTempFileURL({
        fileList: fileIDs,
      });
      return result.fileList.map((file: any) => file.tempFileURL);
    } catch (err) {
      console.error('获取图片临时链接失败:', err);
      return [];
    }
  },

  // 格式化时间
  formatTime(date: Date): string {
    const now = new Date();
    const postDate = new Date(date);
    const diff = now.getTime() - postDate.getTime();
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) {
      return '刚刚';
    } else if (minutes < 60) {
      return `${minutes}分钟前`;
    } else if (hours < 24) {
      return `${hours}小时前`;
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return postDate.toLocaleDateString();
    }
  },

  // 帖子点击
  onPostTap(e: any) {
    const post = e.currentTarget.dataset.post;
    wx.navigateTo({
      url: `/pages/post-detail/post-detail?id=${post.id}&isMyPost=true`
    });
  }
});
