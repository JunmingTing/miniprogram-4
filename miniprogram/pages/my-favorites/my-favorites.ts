// 我的收藏页面逻辑
interface FavoriteNews {
  id: string;
  title: string;
  image: string;
  time: string;
  isLiked: boolean;
  isFavorited: boolean;
  likeCount: number;
  commentCount: number;
  favoriteCount: number;
}

interface FavoritePost {
  id: string;
  coverImage: string;
  imageCount: number;
  favoriteTime: string;
}

Page({
  data: {
    activeTab: 'news',
    favoriteNews: [] as FavoriteNews[],
    favoritePosts: [] as FavoritePost[],
    loading: true
  },

  onLoad() {
    this.loadFavoriteData();
  },

  onShow() {
    // 页面显示时刷新数据
    this.loadFavoriteData();
  },

  // 加载收藏数据
  loadFavoriteData() {
    this.setData({ loading: true });

    // 模拟收藏的资讯数据
    const mockFavoriteNews: FavoriteNews[] = [
      {
        id: '1',
        title: '《原神》4.3版本更新：全新角色和活动上线',
        image: 'https://via.placeholder.com/320x240/4F46E5/FFFFFF?text=游戏',
        time: '2024-01-15 14:30',
        isLiked: true,
        isFavorited: true,
        likeCount: 1200,
        commentCount: 89,
        favoriteCount: 456
      },
      {
        id: '2',
        title: 'LPL春季赛：TES战队3:1战胜RNG',
        image: 'https://via.placeholder.com/320x240/10B981/FFFFFF?text=电竞',
        time: '2024-01-15 12:15',
        isLiked: false,
        isFavorited: true,
        likeCount: 856,
        commentCount: 23,
        favoriteCount: 123
      },
      {
        id: '3',
        title: '《王者荣耀》新英雄"镜"技能详解',
        image: 'https://via.placeholder.com/320x240/F59E0B/FFFFFF?text=手游',
        time: '2024-01-15 10:45',
        isLiked: true,
        isFavorited: true,
        likeCount: 2100,
        commentCount: 156,
        favoriteCount: 789
      }
    ];

    // 模拟收藏的帖子数据
    const mockFavoritePosts: FavoritePost[] = [
      {
        id: '1',
        coverImage: 'https://via.placeholder.com/200x200/4F46E5/FFFFFF?text=帖子1',
        imageCount: 3,
        favoriteTime: '2024-01-15 16:30'
      },
      {
        id: '2',
        coverImage: 'https://via.placeholder.com/200x200/10B981/FFFFFF?text=帖子2',
        imageCount: 2,
        favoriteTime: '2024-01-15 15:45'
      },
      {
        id: '3',
        coverImage: 'https://via.placeholder.com/200x200/F59E0B/FFFFFF?text=帖子3',
        imageCount: 1,
        favoriteTime: '2024-01-15 14:20'
      },
      {
        id: '4',
        coverImage: 'https://via.placeholder.com/200x200/EF4444/FFFFFF?text=帖子4',
        imageCount: 4,
        favoriteTime: '2024-01-15 13:10'
      },
      {
        id: '5',
        coverImage: 'https://via.placeholder.com/200x200/8B5CF6/FFFFFF?text=帖子5',
        imageCount: 2,
        favoriteTime: '2024-01-15 12:30'
      },
      {
        id: '6',
        coverImage: 'https://via.placeholder.com/200x200/EC4899/FFFFFF?text=帖子6',
        imageCount: 1,
        favoriteTime: '2024-01-15 11:45'
      }
    ];

    this.setData({
      favoriteNews: mockFavoriteNews,
      favoritePosts: mockFavoritePosts,
      loading: false
    });
  },

  // 标签切换
  onTabChange(e: any) {
    this.setData({ activeTab: e.detail.value });
  },

  // 资讯点击
  onNewsTap(e: any) {
    const news = e.currentTarget.dataset.news;
    wx.navigateTo({
      url: `/pages/news-detail/news-detail?id=${news.id}`
    });
  },

  // 帖子点击
  onPostTap(e: any) {
    const post = e.currentTarget.dataset.post;
    wx.navigateTo({
      url: `/pages/post-detail/post-detail?id=${post.id}`
    });
  },

  // 点赞
  onLikeTap(e: any) {
    const id = e.currentTarget.dataset.id;
    this.toggleLike(id);
  },

  // 评论
  onCommentTap(e: any) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/news-detail/news-detail?id=${id}&scrollToComment=true`
    });
  },

  // 收藏
  onFavoriteTap(e: any) {
    const id = e.currentTarget.dataset.id;
    this.toggleFavorite(id);
  },

  // 分享
  onShareTap(e: any) {
    const id = e.currentTarget.dataset.id;
    wx.showActionSheet({
      itemList: ['分享到微信', '分享到朋友圈', '复制链接'],
      success: (res) => {
        console.log('分享选项:', res.tapIndex);
        wx.showToast({
          title: '分享成功',
          icon: 'success'
        });
      }
    });
  },

  // 切换点赞状态
  toggleLike(id: string) {
    const favoriteNews = this.data.favoriteNews.map(item => {
      if (item.id === id) {
        return {
          ...item,
          isLiked: !item.isLiked,
          likeCount: item.isLiked ? item.likeCount - 1 : item.likeCount + 1
        };
      }
      return item;
    });

    this.setData({ favoriteNews });

    const item = favoriteNews.find(i => i.id === id);
    wx.showToast({
      title: item?.isLiked ? '已点赞' : '已取消点赞',
      icon: 'none'
    });
  },

  // 切换收藏状态
  toggleFavorite(id: string) {
    const favoriteNews = this.data.favoriteNews.map(item => {
      if (item.id === id) {
        return {
          ...item,
          isFavorited: !item.isFavorited,
          favoriteCount: item.isFavorited ? item.favoriteCount - 1 : item.favoriteCount + 1
        };
      }
      return item;
    });

    // 如果取消收藏，从列表中移除
    const filteredNews = favoriteNews.filter(item => item.isFavorited);

    this.setData({ favoriteNews: filteredNews });

    const item = favoriteNews.find(i => i.id === id);
    if (item && !item.isFavorited) {
      wx.showToast({
        title: '已取消收藏',
        icon: 'success'
      });
    }
  }
});
