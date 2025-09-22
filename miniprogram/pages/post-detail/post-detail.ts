// 帖子详情页逻辑
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

interface PostDetail {
  id: string;
  author: PostAuthor;
  time: string;
  images: string[];
  currentImageIndex: number;
  isLiked: boolean;
  isFavorited: boolean;
  likeCount: number;
  commentCount: number;
  favoriteCount: number;
  tags: PostTag[];
  isRejected?: boolean;
  rejectReason?: string;
}

Page({
  data: {
    postId: '',
    isMyPost: false,
    postDetail: {} as PostDetail,
    showDeleteDialog: false,
    scrollToComment: false
  },

  onLoad(options: any) {
    const { id, isMyPost, scrollToComment } = options;
    this.setData({
      postId: id,
      isMyPost: isMyPost === 'true',
      scrollToComment: scrollToComment === 'true'
    });
    this.loadPostDetail();
  },

  onShow() {
    // 页面显示时刷新数据
    this.loadPostDetail();
  },

  onReady() {
    // 如果需要滚动到评论区
    if (this.data.scrollToComment) {
      setTimeout(() => {
        this.scrollToComments();
      }, 500);
    }
  },

  // 加载帖子详情
  loadPostDetail() {
    // 模拟数据
    const mockPostDetail: PostDetail = {
      id: this.data.postId,
      author: {
        name: '游戏达人',
        avatar: 'https://via.placeholder.com/80x80/10B981/FFFFFF?text=用户'
      },
      time: '2024-01-15 16:30',
      images: [
        'https://via.placeholder.com/750x600/4F46E5/FFFFFF?text=游戏截图1',
        'https://via.placeholder.com/750x600/10B981/FFFFFF?text=游戏截图2',
        'https://via.placeholder.com/750x600/F59E0B/FFFFFF?text=游戏截图3'
      ],
      currentImageIndex: 0,
      isLiked: false,
      isFavorited: false,
      likeCount: 128,
      commentCount: 23,
      favoriteCount: 45,
      tags: [
        { id: '1', text: '原神', likeCount: 12, isLiked: false },
        { id: '2', text: '角色', likeCount: 8, isLiked: false },
        { id: '3', text: '攻略', likeCount: 5, isLiked: false }
      ],
      isRejected: this.data.isMyPost && Math.random() > 0.5, // 随机模拟驳回状态
      rejectReason: this.data.isMyPost ? '图片内容不符合社区规范' : undefined
    };

    this.setData({ postDetail: mockPostDetail });
  },

  // 滚动到评论区
  scrollToComments() {
    // 这里可以实现滚动到评论区的逻辑
    console.log('滚动到评论区');
  },

  // 图片切换
  onImageChange(e: any) {
    const { current } = e.detail;
    this.setData({
      'postDetail.currentImageIndex': current
    });
  },

  // 点赞
  onLikeTap() {
    const postDetail = {
      ...this.data.postDetail,
      isLiked: !this.data.postDetail.isLiked,
      likeCount: this.data.postDetail.isLiked 
        ? this.data.postDetail.likeCount - 1 
        : this.data.postDetail.likeCount + 1
    };

    this.setData({ postDetail });

    wx.showToast({
      title: postDetail.isLiked ? '已点赞' : '已取消点赞',
      icon: 'none'
    });
  },

  // 评论
  onCommentTap() {
    // 这里可以实现评论功能
    wx.showToast({
      title: '评论功能开发中',
      icon: 'none'
    });
  },

  // 收藏
  onFavoriteTap() {
    const postDetail = {
      ...this.data.postDetail,
      isFavorited: !this.data.postDetail.isFavorited,
      favoriteCount: this.data.postDetail.isFavorited 
        ? this.data.postDetail.favoriteCount - 1 
        : this.data.postDetail.favoriteCount + 1
    };

    this.setData({ postDetail });

    wx.showToast({
      title: postDetail.isFavorited ? '已收藏' : '已取消收藏',
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

  // 标签点击
  onTagTap(e: any) {
    const tag = e.currentTarget.dataset.tag;
    this.toggleTagLike(tag);
  },

  // 切换标签点赞状态
  toggleTagLike(tag: PostTag) {
    const tags = this.data.postDetail.tags.map(t => {
      if (t.id === tag.id) {
        return {
          ...t,
          isLiked: !t.isLiked,
          likeCount: t.isLiked ? t.likeCount - 1 : t.likeCount + 1
        };
      }
      return t;
    });

    this.setData({
      'postDetail.tags': tags
    });
  },

  // 删除帖子
  onDeleteTap() {
    this.setData({ showDeleteDialog: true });
  },

  onDeleteConfirm() {
    this.setData({ showDeleteDialog: false });
    
    // 模拟删除操作
    wx.showLoading({
      title: '删除中...'
    });

    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({
        title: '删除成功',
        icon: 'success'
      });

      // 删除成功后返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }, 1000);
  },

  onDeleteCancel() {
    this.setData({ showDeleteDialog: false });
  },

  // 重新发布
  onRepublishTap() {
    wx.showModal({
      title: '重新发布',
      content: '确定要重新发布这个帖子吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '已提交重新审核',
            icon: 'success'
          });
        }
      }
    });
  }
});
