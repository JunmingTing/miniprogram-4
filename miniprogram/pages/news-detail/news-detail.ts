// 资讯详情页逻辑
interface NewsDetail {
  id: string;
  title: string;
  image: string;
  time: string;
  content: string;
  isLiked: boolean;
  isFavorited: boolean;
  likeCount: number;
  favoriteCount: number;
}

interface Comment {
  id: string;
  author: string;
  avatar: string;
  content: string;
  time: string;
  isLiked: boolean;
  likeCount: number;
}

Page({
  data: {
    newsId: '',
    newsDetail: null as NewsDetail | null,
    comments: [] as Comment[],
    commentText: '',
    loading: true,
    showReportDialog: false,
    selectedReportReason: '',
    reportOptions: [
      { label: '内容不当', value: 'inappropriate' },
      { label: '虚假信息', value: 'false_info' },
      { label: '垃圾信息', value: 'spam' },
      { label: '其他', value: 'other' }
    ],
    scrollToComment: false
  },

  onLoad(options: any) {
    const { id, scrollToComment } = options;
    this.setData({
      newsId: id,
      scrollToComment: scrollToComment === 'true'
    });
    this.loadNewsDetail();
    this.loadComments();
  },

  onShow() {
    // 页面显示时刷新数据
    this.loadNewsDetail();
    this.loadComments();
  },

  onReady() {
    // 如果需要滚动到评论区
    if (this.data.scrollToComment) {
      setTimeout(() => {
        this.scrollToComments();
      }, 500);
    }
  },

  // 加载资讯详情
  loadNewsDetail() {
    this.setData({ loading: true });

    // 模拟数据
    const mockNewsDetail: NewsDetail = {
      id: this.data.newsId,
      title: '《原神》4.3版本更新：全新角色和活动上线',
      image: 'https://via.placeholder.com/750x400/4F46E5/FFFFFF?text=游戏截图',
      time: '2024-01-15 14:30',
      content: `米哈游今日正式发布了《原神》4.3版本"千朵玫瑰带来的黎明"，本次更新带来了全新的角色、活动和系统优化。

新角色"娜维娅"作为岩元素角色加入游戏，拥有独特的战斗机制和精美的技能特效。同时，新活动"千朵玫瑰"将为玩家带来丰富的奖励和挑战。

此外，本次更新还优化了游戏性能，修复了多个已知问题，提升了整体游戏体验。玩家们可以期待更加流畅的游戏体验和更多精彩的内容。`,
      isLiked: false,
      isFavorited: false,
      likeCount: 1200,
      favoriteCount: 456
    };

    this.setData({
      newsDetail: mockNewsDetail,
      loading: false
    });
  },

  // 加载评论
  loadComments() {
    // 模拟评论数据
    const mockComments: Comment[] = [
      {
        id: '1',
        author: '游戏达人',
        avatar: 'https://via.placeholder.com/80x80/10B981/FFFFFF?text=用户',
        content: '新角色娜维娅的技能看起来很不错，期待上线！',
        time: '2小时前',
        isLiked: false,
        likeCount: 23
      },
      {
        id: '2',
        author: '原神老玩家',
        avatar: 'https://via.placeholder.com/80x80/F59E0B/FFFFFF?text=玩家',
        content: '这次更新内容很丰富，新活动奖励也很不错，值得期待！',
        time: '3小时前',
        isLiked: false,
        likeCount: 45
      },
      {
        id: '3',
        author: '米哈游粉丝',
        avatar: 'https://via.placeholder.com/80x80/EF4444/FFFFFF?text=粉丝',
        content: '希望这次更新能解决一些卡顿问题，游戏体验会更好。',
        time: '4小时前',
        isLiked: false,
        likeCount: 12
      }
    ];

    this.setData({ comments: mockComments });
  },

  // 滚动到评论区
  scrollToComments() {
    wx.createSelectorQuery()
      .select('.comments-section')
      .boundingClientRect((rect) => {
        if (rect) {
          wx.pageScrollTo({
            scrollTop: rect.top - 100,
            duration: 500
          });
        }
      })
      .exec();
  },

  // 点赞
  onLikeTap() {
    if (!this.data.newsDetail) return;

    const newsDetail = {
      ...this.data.newsDetail,
      isLiked: !this.data.newsDetail.isLiked,
      likeCount: this.data.newsDetail.isLiked 
        ? this.data.newsDetail.likeCount - 1 
        : this.data.newsDetail.likeCount + 1
    };

    this.setData({ newsDetail });

    wx.showToast({
      title: newsDetail.isLiked ? '已点赞' : '已取消点赞',
      icon: 'none'
    });
  },

  // 收藏
  onFavoriteTap() {
    if (!this.data.newsDetail) return;

    const newsDetail = {
      ...this.data.newsDetail,
      isFavorited: !this.data.newsDetail.isFavorited,
      favoriteCount: this.data.newsDetail.isFavorited 
        ? this.data.newsDetail.favoriteCount - 1 
        : this.data.newsDetail.favoriteCount + 1
    };

    this.setData({ newsDetail });

    wx.showToast({
      title: newsDetail.isFavorited ? '已收藏' : '已取消收藏',
      icon: 'none'
    });
  },

  // 分享
  onShareTap() {
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

  // 举报
  onReportTap() {
    this.setData({ showReportDialog: true });
  },

  onSelectReportReason(e: any) {
    this.setData({ selectedReportReason: e.currentTarget.dataset.value });
  },

  onReportConfirm() {
    if (!this.data.selectedReportReason) {
      wx.showToast({
        title: '请选择举报原因',
        icon: 'none'
      });
      return;
    }

    wx.showToast({
      title: '举报已提交',
      icon: 'success'
    });

    this.setData({
      showReportDialog: false,
      selectedReportReason: ''
    });
  },

  onReportCancel() {
    this.setData({
      showReportDialog: false,
      selectedReportReason: ''
    });
  },

  // 评论相关
  onCommentTextChange(e: any) {
    this.setData({ commentText: e.detail.value });
  },

  onCommentSubmit() {
    if (!this.data.commentText.trim()) {
      wx.showToast({
        title: '请输入评论内容',
        icon: 'none'
      });
      return;
    }

    const newComment: Comment = {
      id: Date.now().toString(),
      author: '我',
      avatar: 'https://via.placeholder.com/80x80/4F46E5/FFFFFF?text=我',
      content: this.data.commentText,
      time: '刚刚',
      isLiked: false,
      likeCount: 0
    };

    this.setData({
      comments: [newComment, ...this.data.comments],
      commentText: ''
    });

    wx.showToast({
      title: '评论发布成功',
      icon: 'success'
    });
  },

  // 评论点赞
  onCommentLikeTap(e: any) {
    const commentId = e.currentTarget.dataset.id;
    const comments = this.data.comments.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          isLiked: !comment.isLiked,
          likeCount: comment.isLiked ? comment.likeCount - 1 : comment.likeCount + 1
        };
      }
      return comment;
    });

    this.setData({ comments });
  }
});
