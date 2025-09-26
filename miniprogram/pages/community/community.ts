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

    // 从云数据库加载真实的帖子数据
    this.loadPostsFromCloud();

    // 停止下拉刷新
    wx.stopPullDownRefresh();
  },

  // 从云数据库加载帖子
  loadPostsFromCloud() {
    console.log('开始从云数据库加载帖子...');
    
    wx.cloud.database().collection('posts')
      .orderBy('createTime', 'desc')
      .limit(10)
      .get()
      .then((res: any) => {
        console.log('从云数据库加载帖子成功:', res);
        
        const posts: Post[] = res.data.map((item: any) => ({
          id: item._id,
          author: {
            name: '',
            avatar: ''
          },
          time: this.formatTime(item.createTime),
          images: item.images || [],
          currentImageIndex: 0,
          tags: (item.tags || []).map((tag: string, index: number) => ({
            id: `${item._id}_tag_${index}`,
            text: tag,
            likeCount: 0,
            isLiked: false
          }))
        }));

        this.setData({
          posts,
          loading: false
        });

        // 停止下拉刷新
        wx.stopPullDownRefresh();
      })
      .catch((err: any) => {
        console.error('从云数据库加载帖子失败:', err);
        this.setData({
          posts: [],
          loading: false
        });
        
        // 停止下拉刷新
        wx.stopPullDownRefresh();
        
        wx.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        });
      });
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

    // 从云数据库加载更多帖子
    const skip = this.data.posts.length;
    
    wx.cloud.database().collection('posts')
      .orderBy('createTime', 'desc')
      .skip(skip)
      .limit(10)
      .get()
      .then((res: any) => {
        console.log('加载更多帖子成功:', res);
        
        if (res.data.length === 0) {
          // 没有更多数据
          this.setData({
            hasMore: false,
            loading: false
          });
          return;
        }
        
        const morePosts: Post[] = res.data.map((item: any) => ({
          id: item._id,
          author: {
            name: '',
            avatar: ''
          },
          time: this.formatTime(item.createTime),
          images: item.images || [],
          currentImageIndex: 0,
          tags: (item.tags || []).map((tag: string, index: number) => ({
            id: `${item._id}_tag_${index}`,
            text: tag,
            likeCount: 0,
            isLiked: false
          }))
        }));

        this.setData({
          posts: [...this.data.posts, ...morePosts],
          page: this.data.page + 1,
          loading: false,
          hasMore: res.data.length === 10 // 如果返回的数据少于10条，说明没有更多了
        });
      })
      .catch((err: any) => {
        console.error('加载更多帖子失败:', err);
        this.setData({ loading: false });
        
        wx.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        });
      });
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
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    const postId = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '添加标签',
      editable: true,
      placeholderText: '请输入标签内容（最多12字）',
      success: (res) => {
        if (res.confirm && res.content && res.content.trim()) {
          const tagText = res.content.trim();
          if (tagText.length > 12) {
            wx.showToast({
              title: '标签内容不能超过12字',
              icon: 'none'
            });
            return;
          }
          this.addTagToDatabase(postId, tagText);
        }
      }
    });
  },


  // 添加标签到数据库
  addTagToDatabase(postId: string, tagText: string) {
    console.log('开始添加标签到数据库:', { postId, tagText });
    
    wx.cloud.database().collection('posts').doc(postId).update({
      data: {
        tags: wx.cloud.database().command.push(tagText)
      }
    }).then((res: any) => {
      console.log('标签添加到数据库成功:', res);
      
      // 更新本地数据
      const posts = this.data.posts.map(post => {
        if (post.id === postId) {
          const newTag: PostTag = {
            id: Date.now().toString(),
            text: tagText,
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
    }).catch((err: any) => {
      console.error('标签添加到数据库失败:', err);
      wx.showToast({
        title: '添加失败，请重试',
        icon: 'none'
      });
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
