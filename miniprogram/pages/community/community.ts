// 社区页面逻辑
interface PostAuthor {
  name: string;
  avatar: string;
}

interface PostTag {
  id: string;
  text: string;
  likeCount: number;
  isLiked: boolean;
}

interface Post {
  id: string;
  author: PostAuthor;
  time: string;
  images: string[];
  currentImageIndex: number;
  tags: PostTag[];
}

interface UserInfo {
  nickName: string;
  avatar: string;
  openId: string;
  _id?: string;
}

Page({
  data: {
    posts: [] as Post[],
    loading: false,
    page: 1,
    hasMore: true,
    showTagDialog: false,
    tagText: '',
    currentPostId: '',
    userInfo: {
      nickName: '',
      avatar: '',
      openId: ''
    } as UserInfo
  },

  onLoad() {
    this.getUserInfo();
    this.loadPosts();
  },

  onShow() {
    // 页面显示时刷新数据
    this.getUserInfo();
    this.refreshData();
  },

  // 获取用户信息
  getUserInfo() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({ userInfo });
    }
  },

  onReachBottom() {
    // 触底加载更多
    if (this.data.hasMore && !this.data.loading) {
      this.loadMorePosts();
    }
  },

  onPullDownRefresh() {
    // 下拉刷新
    this.refreshData();
  },

  // 加载帖子数据
  loadPosts() {
    this.setData({ loading: true });

    // 获取用户信息作为作者信息
    const userInfo = this.data.userInfo;
    const authorInfo = {
      name: userInfo.nickName || '我的精彩时刻',
      avatar: userInfo.avatar || 'https://via.placeholder.com/80x80/4F46E5/FFFFFF?text=我'
    };

    // 模拟数据 - 所有帖子都使用用户本人的信息
    const mockPosts: Post[] = [
      {
        id: '1',
        author: authorInfo,
        time: '2024-01-15 16:30',
        images: [
          'https://via.placeholder.com/750x400/4F46E5/FFFFFF?text=游戏截图1',
          'https://via.placeholder.com/750x400/10B981/FFFFFF?text=游戏截图2',
          'https://via.placeholder.com/750x400/F59E0B/FFFFFF?text=游戏截图3'
        ],
        currentImageIndex: 0,
        tags: [
          { id: '1', text: '原神', likeCount: 12, isLiked: false },
          { id: '2', text: '角色', likeCount: 8, isLiked: false },
          { id: '3', text: '攻略', likeCount: 5, isLiked: false }
        ]
      },
      {
        id: '2',
        author: authorInfo,
        time: '2024-01-15 15:45',
        images: [
          'https://via.placeholder.com/750x400/EF4444/FFFFFF?text=电竞截图1',
          'https://via.placeholder.com/750x400/8B5CF6/FFFFFF?text=电竞截图2'
        ],
        currentImageIndex: 0,
        tags: [
          { id: '4', text: 'LOL', likeCount: 15, isLiked: false },
          { id: '5', text: '电竞', likeCount: 9, isLiked: false }
        ]
      },
      {
        id: '3',
        author: authorInfo,
        time: '2024-01-15 14:20',
        images: [
          'https://via.placeholder.com/750x400/8B5CF6/FFFFFF?text=游戏截图1',
          'https://via.placeholder.com/750x400/EC4899/FFFFFF?text=游戏截图2',
          'https://via.placeholder.com/750x400/06B6D4/FFFFFF?text=游戏截图3',
          'https://via.placeholder.com/750x400/84CC16/FFFFFF?text=游戏截图4'
        ],
        currentImageIndex: 0,
        tags: [
          { id: '6', text: '手游', likeCount: 6, isLiked: false },
          { id: '7', text: '攻略', likeCount: 3, isLiked: false }
        ]
      }
    ];

    this.setData({
      posts: mockPosts,
      loading: false
    });

    // 停止下拉刷新
    wx.stopPullDownRefresh();
  },

  // 刷新数据
  refreshData() {
    this.setData({
      page: 1,
      hasMore: true,
      posts: []
    });
    this.loadPosts();
  },

  // 加载更多帖子
  loadMorePosts() {
    if (!this.data.hasMore) return;

    this.setData({ loading: true });

    // 获取用户信息作为作者信息
    const userInfo = this.data.userInfo;
    const authorInfo = {
      name: userInfo.nickName || '我的精彩时刻',
      avatar: userInfo.avatar || 'https://via.placeholder.com/80x80/4F46E5/FFFFFF?text=我'
    };

    // 模拟加载更多数据 - 所有帖子都使用用户本人的信息
    setTimeout(() => {
      const morePosts: Post[] = [
        {
          id: `${this.data.page + 1}_1`,
          author: authorInfo,
          time: '2024-01-14 20:30',
          images: [
            'https://via.placeholder.com/750x400/FF6B6B/FFFFFF?text=新帖子'
          ],
          currentImageIndex: 0,
          tags: [
            { id: '8', text: '新手', likeCount: 2, isLiked: false }
          ]
        }
      ];

      this.setData({
        posts: [...this.data.posts, ...morePosts],
        page: this.data.page + 1,
        loading: false,
        hasMore: this.data.page < 3 // 模拟只有3页数据
      });
    }, 1000);
  },

  // 图片切换
  onImageChange(e: any) {
    const { postId } = e.currentTarget.dataset;
    const { current } = e.detail;
    
    const posts = this.data.posts.map(post => {
      if (post.id === postId) {
        return { ...post, currentImageIndex: current };
      }
      return post;
    });

    this.setData({ posts });
  },

  // 帖子点击
  onPostTap(e: any) {
    const post = e.currentTarget.dataset.post;
    wx.navigateTo({
      url: `/pages/post-detail/post-detail?id=${post.id}`
    });
  },

  // 发布按钮
  onPublishTap() {
    wx.navigateTo({
      url: '/pages/publish/publish'
    });
  },


  // 添加标签
  onAddTagTap(e: any) {
    const id = e.currentTarget.dataset.id;
    this.setData({
      showTagDialog: true,
      currentPostId: id,
      tagText: ''
    });
  },

  onTagTextChange(e: any) {
    this.setData({ tagText: e.detail.value });
  },

  onTagConfirm() {
    if (!this.data.tagText.trim()) {
      wx.showToast({
        title: '请输入标签内容',
        icon: 'none'
      });
      return;
    }

    if (this.data.tagText.length > 12) {
      wx.showToast({
        title: '标签内容不能超过12字',
        icon: 'none'
      });
      return;
    }

    // 添加标签到对应帖子
    const posts = this.data.posts.map(post => {
      if (post.id === this.data.currentPostId) {
        const newTag: PostTag = {
          id: Date.now().toString(),
          text: this.data.tagText,
          likeCount: 0,
          isLiked: false
        };
        return {
          ...post,
          tags: [...post.tags, newTag]
        };
      }
      return post;
    });

    this.setData({ posts });

    wx.showToast({
      title: '标签添加成功',
      icon: 'success'
    });

    this.setData({
      showTagDialog: false,
      tagText: '',
      currentPostId: ''
    });
  },

  onTagCancel() {
    this.setData({
      showTagDialog: false,
      tagText: '',
      currentPostId: ''
    });
  },

  // 标签点击
  onTagTap(e: any) {
    const tag = e.currentTarget.dataset.tag;
    this.toggleTagLike(tag);
  },


  // 切换标签点赞状态
  toggleTagLike(tag: PostTag) {
    const posts = this.data.posts.map(post => {
      const updatedTags = post.tags.map(t => {
        if (t.id === tag.id) {
          return {
            ...t,
            isLiked: !t.isLiked,
            likeCount: t.isLiked ? t.likeCount - 1 : t.likeCount + 1
          };
        }
        return t;
      });
      return { ...post, tags: updatedTags };
    });

    this.setData({ posts });
  }
});
