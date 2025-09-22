// 首页逻辑
interface NewsItem {
  id: string;
  title: string;
  image: string;
  time: string;
  content: string;
  isLiked: boolean;
  isFavorited: boolean;
  likeCount: number;
  commentCount: number;
  favoriteCount: number;
  isPinned?: boolean;
}

Page({
  data: {
    searchValue: '',
    pinnedNews: [] as NewsItem[],
    newsList: [] as NewsItem[],
    loading: false,
    page: 1,
    hasMore: true
  },

  onLoad() {
    this.loadNewsData();
  },

  onShow() {
    // 页面显示时刷新数据
    this.refreshData();
  },

  onReachBottom() {
    // 触底加载更多
    if (this.data.hasMore && !this.data.loading) {
      this.loadMoreNews();
    }
  },

  onPullDownRefresh() {
    // 下拉刷新
    this.refreshData();
  },

  // 加载资讯数据
  loadNewsData() {
    this.setData({ loading: true });

    // 模拟数据
    const mockData: NewsItem[] = [
      {
        id: '1',
        title: '《原神》4.3版本更新：全新角色和活动上线',
        image: 'https://via.placeholder.com/160x120/4F46E5/FFFFFF?text=游戏',
        time: '2024-01-15 14:30',
        content: '米哈游今日正式发布了《原神》4.3版本"千朵玫瑰带来的黎明"...',
        isLiked: false,
        isFavorited: false,
        likeCount: 1200,
        commentCount: 89,
        favoriteCount: 456,
        isPinned: true
      },
      {
        id: '2',
        title: 'LPL春季赛：TES战队3:1战胜RNG',
        image: 'https://via.placeholder.com/160x120/10B981/FFFFFF?text=电竞',
        time: '2024-01-15 12:15',
        content: '在刚刚结束的LPL春季赛中，TES战队以3:1的比分战胜了RNG战队...',
        isLiked: false,
        isFavorited: false,
        likeCount: 856,
        commentCount: 23,
        favoriteCount: 123
      },
      {
        id: '3',
        title: '《王者荣耀》新英雄"镜"技能详解',
        image: 'https://via.placeholder.com/160x120/F59E0B/FFFFFF?text=手游',
        time: '2024-01-15 10:45',
        content: '王者荣耀新英雄镜正式上线，作为刺客型英雄，拥有独特的技能机制...',
        isLiked: false,
        isFavorited: false,
        likeCount: 2100,
        commentCount: 156,
        favoriteCount: 789
      },
      {
        id: '4',
        title: 'PS5独占游戏《战神：诸神黄昏》DLC发布',
        image: 'https://via.placeholder.com/160x120/EF4444/FFFFFF?text=主机',
        time: '2024-01-15 09:20',
        content: '索尼官方宣布《战神：诸神黄昏》全新DLC将于下月正式发布...',
        isLiked: false,
        isFavorited: false,
        likeCount: 3400,
        commentCount: 67,
        favoriteCount: 234
      }
    ];

    // 分离置顶和普通资讯
    const pinnedNews = mockData.filter(item => item.isPinned);
    const newsList = mockData.filter(item => !item.isPinned);

    this.setData({
      pinnedNews,
      newsList,
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
      newsList: [],
      pinnedNews: []
    });
    this.loadNewsData();
  },

  // 加载更多资讯
  loadMoreNews() {
    if (!this.data.hasMore) return;

    this.setData({ loading: true });

    // 模拟加载更多数据
    setTimeout(() => {
      const moreNews: NewsItem[] = [
        {
          id: `${this.data.page + 1}_1`,
          title: '《赛博朋克2077》2.1版本更新内容预览',
          image: 'https://via.placeholder.com/160x120/8B5CF6/FFFFFF?text=赛博朋克',
          time: '2024-01-14 16:30',
          content: 'CDPR公布了《赛博朋克2077》2.1版本的详细更新内容...',
          isLiked: false,
          isFavorited: false,
          likeCount: 567,
          commentCount: 34,
          favoriteCount: 123
        }
      ];

      this.setData({
        newsList: [...this.data.newsList, ...moreNews],
        page: this.data.page + 1,
        loading: false,
        hasMore: this.data.page < 3 // 模拟只有3页数据
      });
    }, 1000);
  },

  // 搜索相关
  onSearchChange(e: any) {
    this.setData({ searchValue: e.detail.value });
  },

  onSearchSubmit(e: any) {
    const keyword = e.detail.value;
    console.log('搜索关键词:', keyword);
    // 实现搜索逻辑
    wx.showToast({
      title: `搜索: ${keyword}`,
      icon: 'none'
    });
  },

  onSearchClear() {
    this.setData({ searchValue: '' });
  },

  // 资讯点击
  onNewsTap(e: any) {
    const news = e.currentTarget.dataset.news;
    wx.navigateTo({
      url: `/pages/news-detail/news-detail?id=${news.id}`
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
    const updateItem = (item: NewsItem) => {
      if (item.id === id) {
        return {
          ...item,
          isLiked: !item.isLiked,
          likeCount: item.isLiked ? item.likeCount - 1 : item.likeCount + 1
        };
      }
      return item;
    };

    this.setData({
      pinnedNews: this.data.pinnedNews.map(updateItem),
      newsList: this.data.newsList.map(updateItem)
    });

    wx.showToast({
      title: this.data.newsList.find(item => item.id === id)?.isLiked ? '已点赞' : '已取消点赞',
      icon: 'none'
    });
  },

  // 切换收藏状态
  toggleFavorite(id: string) {
    const updateItem = (item: NewsItem) => {
      if (item.id === id) {
        return {
          ...item,
          isFavorited: !item.isFavorited,
          favoriteCount: item.isFavorited ? item.favoriteCount - 1 : item.favoriteCount + 1
        };
      }
      return item;
    };

    this.setData({
      pinnedNews: this.data.pinnedNews.map(updateItem),
      newsList: this.data.newsList.map(updateItem)
    });

    wx.showToast({
      title: this.data.newsList.find(item => item.id === id)?.isFavorited ? '已收藏' : '已取消收藏',
      icon: 'none'
    });
  }
});
