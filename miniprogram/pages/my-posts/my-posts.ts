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
    loading: true
  },

  onLoad() {
    this.loadMyPosts();
  },

  onShow() {
    // 页面显示时刷新数据
    this.loadMyPosts();
  },

  // 加载我的帖子
  loadMyPosts() {
    this.setData({ loading: true });

    // 模拟数据
    const mockPosts: MyPost[] = [
      {
        id: '1',
        coverImage: 'https://via.placeholder.com/200x200/4F46E5/FFFFFF?text=帖子1',
        imageCount: 3,
        isRejected: false,
        publishTime: '2024-01-15 16:30'
      },
      {
        id: '2',
        coverImage: 'https://via.placeholder.com/200x200/EF4444/FFFFFF?text=帖子2',
        imageCount: 2,
        isRejected: true,
        rejectReason: '图片内容不符合社区规范',
        publishTime: '2024-01-15 15:45'
      },
      {
        id: '3',
        coverImage: 'https://via.placeholder.com/200x200/10B981/FFFFFF?text=帖子3',
        imageCount: 1,
        isRejected: false,
        publishTime: '2024-01-15 14:20'
      },
      {
        id: '4',
        coverImage: 'https://via.placeholder.com/200x200/F59E0B/FFFFFF?text=帖子4',
        imageCount: 4,
        isRejected: false,
        publishTime: '2024-01-15 13:10'
      },
      {
        id: '5',
        coverImage: 'https://via.placeholder.com/200x200/8B5CF6/FFFFFF?text=帖子5',
        imageCount: 2,
        isRejected: true,
        rejectReason: '标签内容不当',
        publishTime: '2024-01-15 12:30'
      },
      {
        id: '6',
        coverImage: 'https://via.placeholder.com/200x200/EC4899/FFFFFF?text=帖子6',
        imageCount: 1,
        isRejected: false,
        publishTime: '2024-01-15 11:45'
      },
      {
        id: '7',
        coverImage: 'https://via.placeholder.com/200x200/06B6D4/FFFFFF?text=帖子7',
        imageCount: 3,
        isRejected: false,
        publishTime: '2024-01-15 10:20'
      },
      {
        id: '8',
        coverImage: 'https://via.placeholder.com/200x200/84CC16/FFFFFF?text=帖子8',
        imageCount: 2,
        isRejected: false,
        publishTime: '2024-01-15 09:15'
      },
      {
        id: '9',
        coverImage: 'https://via.placeholder.com/200x200/F97316/FFFFFF?text=帖子9',
        imageCount: 1,
        isRejected: true,
        rejectReason: '重复发布相似内容',
        publishTime: '2024-01-15 08:30'
      }
    ];

    this.setData({
      posts: mockPosts,
      loading: false
    });
  },

  // 帖子点击
  onPostTap(e: any) {
    const post = e.currentTarget.dataset.post;
    wx.navigateTo({
      url: `/pages/post-detail/post-detail?id=${post.id}&isMyPost=true`
    });
  }
});
