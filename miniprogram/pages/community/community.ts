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
  originalImageIds: string[]; // 原始文件ID，用于重试加载
  currentImageIndex: number;
  tags: PostTag[];
}

interface UserInfo {
  nickName: string;
  avatar: string;
  openId: string;
  _id?: string;
}

// 云数据库返回的原始帖子数据类型
interface CloudPost {
  _id: string;
  images?: string[];
  createTime: Date;
  tags?: string[];
  userId?: string;
  content?: string;
}

// 云数据库查询结果类型
interface CloudQueryResult {
  data: CloudPost[];
  errMsg: string;
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
    } as UserInfo,
    // 图片缓存管理
    imageCache: {} as { [key: string]: { url: string; timestamp: number } }
  },

  onLoad() {
    // 初始化云开发
    this.initCloud();
    this.getUserInfo();
    this.loadImageCache();
    this.loadPosts();
  },

  // 初始化云开发
  initCloud() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
      return;
    }
    wx.cloud.init({
      env: 'cloud1-4ghl6bw58e8ba561',
      traceUser: true
    });
  },

  onShow() {
    // 页面显示时刷新数据
    this.getUserInfo();
    this.loadImageCache();
    this.clearExpiredCache(); // 清除过期缓存
    
    // 检查用户登录状态并提供友好提示
    if (!this.data.userInfo.openId) {
      console.log('用户未登录，显示登录提示');
      // 如果用户未登录，仍然尝试加载数据（可能有公开内容）
      this.refreshData();
    } else {
      console.log('用户已登录，加载个人内容');
      this.refreshData();
    }
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
    console.log('下拉刷新');
    
    // 显示友好的刷新提示
    wx.showToast({
      title: '正在刷新...',
      icon: 'loading',
      duration: 1000,
      mask: true
    });
    
    // 执行刷新
    this.refreshData();
    
    // 延迟显示刷新成功提示
    setTimeout(() => {
      wx.hideToast();
      wx.showToast({
        title: '刷新成功',
        icon: 'success',
        duration: 1500
      });
    }, 1000);
  },

  // 加载帖子数据
  loadPosts() {
    this.setData({ loading: true });

    // 从云数据库加载真实的帖子数据
    this.loadPostsFromCloud();

    // 停止下拉刷新
    wx.stopPullDownRefresh();
  },

  // 验证用户身份
  async validateUser(): Promise<{isValid: boolean, openId?: string, userInfo?: any}> {
    try {
      // 检查本地存储的用户信息
      const localUserInfo = wx.getStorageSync('userInfo');
      if (!localUserInfo || !localUserInfo.openId) {
        console.log('用户未登录或本地用户信息无效');
        return { isValid: false };
      }

      // 调用云函数验证用户身份
      const res = await wx.cloud.callFunction({
        name: 'login',
        data: {}
      });

      if (res.result && (res.result as any).success) {
        const cloudUserInfo = res.result as any;
        console.log('用户身份验证成功:', cloudUserInfo);
        
        // 检查本地openId和云端openId是否匹配
        if (localUserInfo.openId === cloudUserInfo.openId) {
          return {
            isValid: true,
            openId: cloudUserInfo.openId,
            userInfo: cloudUserInfo.userInfo
          };
        } else {
          console.warn('本地用户信息与云端不匹配');
          return { isValid: false };
        }
      } else {
        console.error('云端用户验证失败:', res.result);
        return { isValid: false };
      }
    } catch (error) {
      console.error('用户身份验证异常:', error);
      return { isValid: false };
    }
  },

  // 从云数据库加载帖子
  async loadPostsFromCloud() {
    console.log('开始从云数据库加载帖子...');
    
    // 首先验证用户身份
    const userValidation = await this.validateUser();
    
    if (!userValidation.isValid) {
      console.log('用户未登录或身份验证失败，不加载帖子');
      this.setData({
        posts: [],
        loading: false
      });
      
      wx.showToast({
        title: '请先登录查看内容',
        icon: 'none',
        duration: 2000
      });
      
      // 停止下拉刷新
      wx.stopPullDownRefresh();
      return;
    }
    
    console.log('用户身份验证成功，开始加载用户的帖子');
    
    try {
      // 只加载当前用户的帖子
      const res = await wx.cloud.database().collection('posts')
        .where({
          authorId: userValidation.openId
        })
        .orderBy('createTime', 'desc')
        .limit(10)
        .get() as CloudQueryResult;

      console.log('从云数据库加载用户帖子成功:', res);
      console.log(`为用户 ${userValidation.openId} 加载到 ${res.data?.length || 0} 个帖子`);

      // 验证返回数据的结构
      if (!res.data || !Array.isArray(res.data)) {
        console.error('云数据库返回数据格式异常:', res);
        throw new Error('数据格式异常');
      }
      
      // 如果没有帖子，显示空状态
      if (res.data.length === 0) {
        console.log('用户暂无发布的帖子');
        this.setData({
          posts: [],
          loading: false
        });
        // 停止下拉刷新
        wx.stopPullDownRefresh();
        return;
      }

      const postsWithImageUrls: (Post | null)[] = await Promise.all(
        res.data.map(async (item: CloudPost): Promise<Post | null> => {
          // 验证必要字段
          if (!item._id) {
            console.warn('帖子缺少_id字段:', item);
            return null;
          }

          // 安全地处理图片数组
          const imageIds = Array.isArray(item.images) ? item.images : [];
          console.log(`帖子 ${item._id} 的图片ID列表:`, imageIds);
          
          const tempImageUrls = await this.getTempImageUrls(imageIds);
          console.log(`帖子 ${item._id} 的临时图片URL:`, tempImageUrls);

          // 安全地处理标签数组
          const tagStrings = Array.isArray(item.tags) ? item.tags : [];
          const tags: PostTag[] = tagStrings
            .filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0)
            .map((tag: string, index: number) => ({
              id: `${item._id}_tag_${index}`,
              text: tag.trim(),
              likeCount: 0,
              isLiked: false
            }));

          // 安全地处理创建时间
          let createTime: Date;
          if (item.createTime instanceof Date) {
            createTime = item.createTime;
          } else if (typeof item.createTime === 'string') {
            createTime = new Date(item.createTime);
          } else {
            console.warn('帖子创建时间格式异常:', item.createTime);
            createTime = new Date();
          }

          return {
            id: item._id,
            author: {
              name: userValidation.userInfo?.nickName || '我', // 显示当前用户信息
              avatar: userValidation.userInfo?.avatarUrl || '' // 显示当前用户头像
            },
            time: this.formatTime(createTime),
            images: tempImageUrls,
            originalImageIds: imageIds, // 保存原始文件ID用于重试
            currentImageIndex: 0,
            tags: tags
          };
        })
      );

      // 过滤掉null值（处理失败的帖子）
      const validPosts = postsWithImageUrls.filter((post): post is Post => post !== null);
      
      console.log(`成功处理 ${validPosts.length}/${res.data.length} 个帖子`);
      
      // 调试：输出最终的帖子数据结构
      validPosts.forEach((post, index) => {
        console.log(`帖子 ${index + 1} 数据:`, {
          id: post.id,
          imageCount: post.images.length,
          originalImageIdsCount: post.originalImageIds.length,
          images: post.images,
          originalImageIds: post.originalImageIds
        });
        
        // 详细检查每个图片URL
        post.images.forEach((url, imgIndex) => {
          console.log(`  图片 ${imgIndex + 1} URL:`, url);
          console.log(`  URL类型:`, typeof url);
          console.log(`  URL长度:`, url ? url.length : 'null/undefined');
        });
      });

      this.setData({
        posts: validPosts,
        loading: false
      });
    } catch (err: any) {
      console.error('从云数据库加载帖子失败:', err);
      this.setData({
        posts: [],
        loading: false
      });
      
      // 根据错误类型显示不同的提示
      let errorMsg = '加载失败，请重试';
      if (err.errCode === -1) {
        errorMsg = '网络连接失败，请检查网络';
      } else if (err.errCode === -502001) {
        errorMsg = '请先登录后查看内容';
      }
      
      wx.showToast({
        title: errorMsg,
        icon: 'none',
        duration: 2000
      });
    } finally {
      // 停止下拉刷新
      wx.stopPullDownRefresh();
    }
  },

  // ========== 图片缓存管理 ==========

  // 加载图片缓存
  loadImageCache() {
    try {
      const cache = wx.getStorageSync('community_image_cache');
      if (cache) {
        console.log('加载图片缓存:', cache);
        this.setData({ imageCache: cache });
      }
    } catch (err) {
      console.error('加载图片缓存失败:', err);
    }
  },

  // 保存图片缓存
  saveImageCache() {
    try {
      wx.setStorageSync('community_image_cache', this.data.imageCache);
      console.log('图片缓存已保存');
    } catch (err) {
      console.error('保存图片缓存失败:', err);
    }
  },

  // 检查缓存是否有效（2小时内）
  isCacheValid(timestamp: number): boolean {
    const now = new Date().getTime();
    const cacheTime = 2 * 60 * 60 * 1000; // 2小时
    return (now - timestamp) < cacheTime;
  },

  // 获取单个图片的临时URL
  async getSingleImageTempUrl(fileID: string): Promise<string> {
    console.log('=== 获取单个图片临时URL ===');
    console.log('文件ID:', fileID);

    // 检查缓存
    const cached = this.data.imageCache[fileID];
    if (cached && this.isCacheValid(cached.timestamp)) {
      console.log('从缓存获取图片URL:', cached.url);
      return cached.url;
    }

    try {
      console.log('从云存储获取临时URL...');
      const result = await wx.cloud.getTempFileURL({
        fileList: [fileID]
      });

      if (result.fileList && result.fileList.length > 0) {
        const file = result.fileList[0];
        if (file.status === 0) {
          console.log('获取临时URL成功:', file.tempFileURL);
          
          // 更新缓存
          const newCache = {
            ...this.data.imageCache,
            [fileID]: {
              url: file.tempFileURL,
              timestamp: new Date().getTime()
            }
          };
          
          this.setData({ imageCache: newCache });
          this.saveImageCache();
          
          return file.tempFileURL;
        } else {
          console.error('获取临时URL失败，状态码:', file.status);
          return '';
        }
      } else {
        console.error('获取临时URL返回空结果');
        return '';
      }
    } catch (err) {
      console.error('获取临时URL异常:', err);
      return '';
    }
  },

  // 获取图片的临时链接（改进版本）
  async getTempImageUrls(fileIDs: string[]): Promise<string[]> {
    if (!fileIDs || fileIDs.length === 0) {
      console.log('getTempImageUrls: 没有文件ID');
      return [];
    }
    
    console.log('getTempImageUrls: 开始获取临时链接，文件ID列表:', fileIDs);
    
    // 使用改进的单个图片获取方法
    const promises = fileIDs.map(fileID => this.getSingleImageTempUrl(fileID));
    
    try {
      const results = await Promise.all(promises);
      console.log('getTempImageUrls: 最终返回的URL列表:', results);
      
      // 过滤掉空的URL
      return results.filter(url => url && url.trim() !== '');
    } catch (err) {
      console.error('批量获取图片临时链接失败:', err);
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
  async loadMorePosts() {
    if (!this.data.hasMore) return;

    this.setData({ loading: true });

    // 验证用户身份
    const userValidation = await this.validateUser();
    
    if (!userValidation.isValid) {
      console.log('用户身份验证失败，停止加载更多帖子');
      this.setData({ 
        loading: false,
        hasMore: false 
      });
      
      wx.showToast({
        title: '请先登录查看内容',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    try {
      // 从云数据库加载更多当前用户的帖子
      const skip = this.data.posts.length;
      
      const res = await wx.cloud.database().collection('posts')
        .where({
          authorId: userValidation.openId
        })
        .orderBy('createTime', 'desc')
        .skip(skip)
        .limit(10)
        .get() as CloudQueryResult;

      console.log('加载更多帖子成功:', res);
      
      // 验证返回数据的结构
      if (!res.data || !Array.isArray(res.data)) {
        console.error('加载更多帖子时数据格式异常:', res);
        throw new Error('数据格式异常');
      }
      
      if (res.data.length === 0) {
        // 没有更多数据
        this.setData({
          hasMore: false,
          loading: false
        });
        return;
      }
      
      const morePosts: (Post | null)[] = await Promise.all(
        res.data.map(async (item: CloudPost): Promise<Post | null> => {
          // 验证必要字段
          if (!item._id) {
            console.warn('加载更多时帖子缺少_id字段:', item);
            return null;
          }

          // 安全地处理图片数组
          const imageIds = Array.isArray(item.images) ? item.images : [];
          const tempImageUrls = await this.getTempImageUrls(imageIds);

          // 安全地处理标签数组
          const tagStrings = Array.isArray(item.tags) ? item.tags : [];
          const tags: PostTag[] = tagStrings
            .filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0)
            .map((tag: string, index: number) => ({
              id: `${item._id}_tag_${index}`,
              text: tag.trim(),
              likeCount: 0,
              isLiked: false
            }));

          // 安全地处理创建时间
          let createTime: Date;
          if (item.createTime instanceof Date) {
            createTime = item.createTime;
          } else if (typeof item.createTime === 'string') {
            createTime = new Date(item.createTime);
          } else {
            console.warn('加载更多时帖子创建时间格式异常:', item.createTime);
            createTime = new Date();
          }

          return {
            id: item._id,
            author: {
              name: userValidation.userInfo?.nickName || '我', // 显示当前用户信息
              avatar: userValidation.userInfo?.avatarUrl || '' // 显示当前用户头像
            },
            time: this.formatTime(createTime),
            images: tempImageUrls,
            originalImageIds: imageIds, // 保存原始文件ID用于重试
            currentImageIndex: 0,
            tags: tags
          };
        })
      );

      // 过滤掉null值（处理失败的帖子）
      const validMorePosts = morePosts.filter((post): post is Post => post !== null);

      this.setData({
        posts: [...this.data.posts, ...validMorePosts],
        page: this.data.page + 1,
        loading: false,
        hasMore: res.data.length === 10 // 如果返回的数据少于10条，说明没有更多了
      });
    } catch (err: any) {
      console.error('加载更多帖子失败:', err);
      this.setData({ loading: false });
      
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
    }
  },

  // 图片切换
  onImageChange(e: any) {
    console.log('图片切换事件:', e);
    const postId = e.currentTarget.dataset.postId;
    const current = e.detail.current;
    
    console.log('切换图片 - postId:', postId, 'current:', current);
    
    const posts = this.data.posts.map(post => {
      if (post.id === postId) {
        console.log(`帖子 ${post.id} 图片索引从 ${post.currentImageIndex} 切换到 ${current}`);
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
    // 检查是否已登录
    if (!this.data.userInfo.openId) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    
    wx.navigateTo({
      url: '/pages/publish/publish'
    });
  },

  // 处理登录按钮点击
  onLoginTap() {
    wx.showModal({
      title: '登录提示',
      content: '需要登录后才能查看和发布精彩时刻，是否前往登录？',
      success: (res) => {
        if (res.confirm) {
          // 这里可以跳转到登录页面或触发登录流程
          // 目前先显示提示，具体登录逻辑可以根据您的应用架构来实现
          wx.showToast({
            title: '请在个人页面完成登录',
            icon: 'none',
            duration: 2000
          });
          
          // 可以跳转到个人页面
          wx.switchTab({
            url: '/pages/profile/profile'
          });
        }
      }
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
  },

  // ========== 图片错误处理 ==========

  // 图片加载成功处理
  onImageLoad(e: any) {
    const { postId, imageIndex } = e.currentTarget.dataset;
    console.log(`✅ 图片加载成功 - 帖子: ${postId}, 图片索引: ${imageIndex}`);
  },

  // 图片加载失败处理
  onImageError(e: any) {
    const { postId, imageIndex } = e.currentTarget.dataset;
    const errorDetail = e.detail || {};
    console.error('图片加载失败:', {
      postId,
      imageIndex,
      errorCode: errorDetail.errCode || 'unknown',
      errorMessage: errorDetail.errMsg || '加载失败',
      imageUrl: this.data.posts.find(p => p.id === postId)?.images[imageIndex] || 'URL不可用'
    });
    
    wx.showToast({
      title: '图片加载失败，正在重试',
      icon: 'loading',
      duration: 1000
    });
    
    // 清除缓存并重新获取该图片的临时URL
    const post = this.data.posts.find(p => p.id === postId);
    const fileID = post?.originalImageIds[imageIndex];
    if (fileID) {
      console.log('清除缓存并重新获取图片URL:', fileID);
      const newCache = { ...this.data.imageCache };
      delete newCache[fileID];
      this.setData({ imageCache: newCache });
      this.saveImageCache();
      this.retryImageLoad(postId, imageIndex, fileID);
    } else {
      console.error('无法重试图片加载，fileID不可用', { postId, imageIndex, post: post ? 'found' : 'not found' });
    }
  },

  // 重试图片加载
  async retryImageLoad(postId: string, imageIndex: number, failedUrl: string) {
    console.log('=== 重试图片加载 ===');
    console.log('帖子ID:', postId, '图片索引:', imageIndex, '失败URL:', failedUrl);
    
    try {
      // 从失败的URL中提取fileID
      let fileID = '';
      if (failedUrl.includes('cloud://')) {
        // 如果是云存储URL，提取fileID
        fileID = failedUrl.split('?')[0]; // 移除URL参数
      } else if (failedUrl.includes('tcb-api')) {
        // 如果是临时URL，需要从缓存中找到对应的fileID
        const cacheEntry = Object.entries(this.data.imageCache).find(([, value]) => value.url === failedUrl);
        if (cacheEntry) {
          fileID = cacheEntry[0];
        }
      }
      
      if (!fileID) {
        console.error('无法提取fileID，跳过重试');
        return;
      }
      
      console.log('提取的fileID:', fileID);
      
      // 清除该图片的缓存
      const newCache = { ...this.data.imageCache };
      delete newCache[fileID];
      this.setData({ imageCache: newCache });
      this.saveImageCache();
      console.log('已清除失败图片的缓存');
      
      // 重新获取临时URL
      const newUrl = await this.getSingleImageTempUrl(fileID);
      
      if (newUrl && newUrl !== failedUrl) {
        console.log('重新获取图片URL成功:', newUrl);
        
        // 更新帖子中的图片URL
        const posts = this.data.posts.map(post => {
          if (post.id === postId) {
            const newImages = [...post.images];
            newImages[imageIndex] = newUrl;
            return { ...post, images: newImages };
          }
          return post;
        });
        
        this.setData({ posts });
        console.log('图片URL已更新');
        
        wx.showToast({
          title: '图片已重新加载',
          icon: 'success',
          duration: 1500
        });
      } else {
        console.error('重新获取图片URL失败');
        wx.showToast({
          title: '图片加载失败',
          icon: 'error',
          duration: 2000
        });
      }
    } catch (err) {
      console.error('重试图片加载异常:', err);
      wx.showToast({
        title: '图片加载失败',
        icon: 'error',
        duration: 2000
      });
    }
  },

  // 手动刷新所有图片
  async refreshAllImages() {
    console.log('=== 手动刷新所有图片 ===');
    
    wx.showLoading({
      title: '刷新图片中...'
    });
    
    try {
      // 清除所有图片缓存
      this.setData({ imageCache: {} });
      wx.removeStorageSync('community_image_cache');
      console.log('已清除所有图片缓存');
      
      // 重新加载帖子数据
      await this.loadPostsFromCloud();
      
      wx.hideLoading();
      wx.showToast({
        title: '图片已刷新',
        icon: 'success'
      });
    } catch (err) {
      console.error('刷新图片失败:', err);
      wx.hideLoading();
      wx.showToast({
        title: '刷新失败',
        icon: 'error'
      });
    }
  },

  // 清除过期缓存
  clearExpiredCache() {
    console.log('=== 清除过期缓存 ===');
    
    const newCache: { [key: string]: { url: string; timestamp: number } } = {};
    let clearedCount = 0;
    
    Object.entries(this.data.imageCache).forEach(([fileID, cacheData]) => {
      if (this.isCacheValid(cacheData.timestamp)) {
        newCache[fileID] = cacheData;
      } else {
        clearedCount++;
        console.log('清除过期缓存:', fileID);
      }
    });
    
    if (clearedCount > 0) {
      console.log(`清除了 ${clearedCount} 个过期缓存`);
      this.setData({ imageCache: newCache });
      this.saveImageCache();
    } else {
      console.log('没有过期缓存需要清除');
    }
  }
});
