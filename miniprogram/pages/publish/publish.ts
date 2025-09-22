// 发布页面逻辑
Page({
  data: {
    images: [] as string[],
    tags: [] as string[],
    tagInput: '',
    publishing: false
  },

  onLoad() {
    // 页面加载时的初始化
  },

  onShow() {
    // 页面显示时重置数据
    this.setData({
      images: [],
      tags: [],
      tagInput: '',
      publishing: false
    });
  },

  // 添加图片
  onAddImage() {
    if (this.data.images.length >= 5) {
      wx.showToast({
        title: '最多只能上传5张图片',
        icon: 'none'
      });
      return;
    }

    wx.chooseImage({
      count: 5 - this.data.images.length,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePaths = res.tempFilePaths;
        const newImages = [...this.data.images, ...tempFilePaths];
        
        this.setData({
          images: newImages
        });

        wx.showToast({
          title: `已选择${tempFilePaths.length}张图片`,
          icon: 'success'
        });
      },
      fail: (err) => {
        console.error('选择图片失败:', err);
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        });
      }
    });
  },

  // 删除图片
  onDeleteImage(e: any) {
    const index = e.currentTarget.dataset.index;
    const images = this.data.images.filter((_, i) => i !== index);
    
    this.setData({ images });

    wx.showToast({
      title: '图片已删除',
      icon: 'success'
    });
  },

  // 标签输入变化
  onTagInputChange(e: any) {
    this.setData({ tagInput: e.detail.value });
  },

  // 添加标签
  onAddTag() {
    const tagText = this.data.tagInput.trim();
    
    if (!tagText) {
      wx.showToast({
        title: '请输入标签内容',
        icon: 'none'
      });
      return;
    }

    if (tagText.length > 12) {
      wx.showToast({
        title: '标签内容不能超过12字',
        icon: 'none'
      });
      return;
    }

    if (this.data.tags.includes(tagText)) {
      wx.showToast({
        title: '标签已存在',
        icon: 'none'
      });
      return;
    }

    const tags = [...this.data.tags, tagText];
    
    this.setData({
      tags,
      tagInput: ''
    });

    wx.showToast({
      title: '标签添加成功',
      icon: 'success'
    });
  },

  // 删除标签
  onDeleteTag(e: any) {
    const index = e.currentTarget.dataset.index;
    const tags = this.data.tags.filter((_, i) => i !== index);
    
    this.setData({ tags });

    wx.showToast({
      title: '标签已删除',
      icon: 'success'
    });
  },

  // 发布帖子
  onPublish() {
    if (this.data.images.length === 0) {
      wx.showToast({
        title: '请至少选择一张图片',
        icon: 'none'
      });
      return;
    }

    this.setData({ publishing: true });

    // 模拟上传和发布过程
    setTimeout(() => {
      // 这里应该调用实际的API上传图片和发布帖子
      console.log('发布内容:', {
        images: this.data.images,
        tags: this.data.tags
      });

      wx.showToast({
        title: '发布成功',
        icon: 'success'
      });

      // 发布成功后返回社区页面
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);

      this.setData({ publishing: false });
    }, 2000);
  },

  // 页面返回确认
  onUnload() {
    if (this.data.images.length > 0 || this.data.tags.length > 0) {
      wx.showModal({
        title: '确认离开',
        content: '当前有未保存的内容，确定要离开吗？',
        success: (res) => {
          if (res.confirm) {
            // 用户确认离开
            return;
          } else {
            // 用户取消离开，阻止页面卸载
            return false;
          }
        }
      });
    }
  }
});
