// 发布页面逻辑
Page({
  data: {
    images: [] as string[], // 存储云存储的fileID
    tempImages: [] as string[], // 存储临时文件路径用于预览
    tags: [] as string[],
    tagInput: '',
    tagInputDisabled: true, // 标签输入按钮是否禁用
    publishing: false,
    uploading: false,
    uploadProgress: 0
  },

  onLoad() {
    // 页面加载时的初始化
    this.initCloudEnvironment();
  },

  // 初始化云开发环境
  initCloudEnvironment() {
    console.log('检查云开发环境...');
    
    if (!wx.cloud) {
      console.error('云开发环境未初始化');
      wx.showModal({
        title: '环境错误',
        content: '云开发环境未初始化，请检查app.js中的云开发配置',
        showCancel: false
      });
      return;
    }

    // 测试云开发连接
    wx.cloud.callFunction({
      name: 'login',
      success: (res) => {
        console.log('云开发环境正常:', res);
      },
      fail: (err) => {
        console.error('云开发环境异常:', err);
        wx.showModal({
          title: '连接失败',
          content: '无法连接到云开发服务，请检查网络连接和云开发配置',
          showCancel: false
        });
      }
    });
  },

  onShow() {
    // 页面显示时重置数据
    this.setData({
      images: [],
      tempImages: [],
      tags: [],
      tagInput: '',
      publishing: false,
      uploading: false,
      uploadProgress: 0
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

    if (this.data.uploading) {
      wx.showToast({
        title: '正在上传中，请稍候',
        icon: 'none'
      });
      return;
    }

    wx.chooseMedia({
      count: 5 - this.data.images.length,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: (res) => {
        console.log('选择图片成功:', res);
        const tempFiles = res.tempFiles;
        
        // 检查文件大小
        const oversizedFiles = tempFiles.filter(file => file.size > 5 * 1024 * 1024);
        if (oversizedFiles.length > 0) {
          wx.showToast({
            title: '图片大小不能超过5MB',
            icon: 'error'
          });
          return;
        }

        // 先显示预览，不立即上传
        const tempFilePaths = tempFiles.map(file => file.tempFilePath);
        const newTempImages = [...this.data.tempImages, ...tempFilePaths];
        
        this.setData({
          tempImages: newTempImages
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

  // 上传图片到云存储
  uploadImages(tempFilePaths: string[]) {
    if (tempFilePaths.length === 0) return;

    console.log('开始上传图片到云存储:', tempFilePaths);
    this.setData({ uploading: true, uploadProgress: 0 });

    const uploadPromises = tempFilePaths.map((tempFilePath, index) => {
      return new Promise<string>((resolve, reject) => {
        const fileName = `posts/${Date.now()}_${index}.jpg`;
        
        console.log(`准备上传第${index + 1}张图片:`, {
          tempFilePath,
          fileName,
          fileExists: '检查中...'
        });
        
        // 先检查文件是否存在
        wx.getFileInfo({
          filePath: tempFilePath,
          success: (fileInfo) => {
            console.log(`文件信息检查成功:`, {
              size: fileInfo.size,
              digest: fileInfo.digest,
              path: tempFilePath
            });
            
            // 检查云开发环境
            if (!wx.cloud) {
              console.error('云开发环境未初始化');
              reject(new Error('云开发环境未初始化'));
              return;
            }
            
            console.log(`开始上传到云存储: ${fileName}`);
            wx.cloud.uploadFile({
              cloudPath: fileName,
              filePath: tempFilePath,
              success: (res) => {
                console.log(`图片${index + 1}上传成功:`, {
                  fileID: res.fileID,
                  statusCode: res.statusCode
                });
                resolve(res.fileID);
              },
              fail: (err: any) => {
                console.error(`图片${index + 1}上传失败:`, {
                  errCode: err.errCode || 'unknown',
                  errMsg: err.errMsg || err.message || '上传失败',
                  tempFilePath,
                  fileName
                });
                reject(err);
              }
            });
          },
          fail: (fileErr: any) => {
            console.error(`文件信息检查失败:`, {
              errCode: fileErr.errCode || 'unknown',
              errMsg: fileErr.errMsg || fileErr.message || '文件检查失败',
              tempFilePath
            });
            reject(new Error(`文件不存在或无法访问: ${fileErr.errMsg || fileErr.message}`));
          }
        });
      });
    });

    // 监听上传进度
    const totalCount = tempFilePaths.length;

    Promise.allSettled(uploadPromises).then((results) => {
      const successfulUploads: string[] = [];
      const failedUploads: { index: number, error: any }[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successfulUploads.push(result.value);
        } else {
          failedUploads.push({ index, error: result.reason });
        }
      });

      console.log('上传结果汇总:', {
        total: totalCount,
        successful: successfulUploads.length,
        failed: failedUploads.length,
        failedDetails: failedUploads
      });

      // 更新数据
      const newImages = [...this.data.images, ...successfulUploads];
      this.setData({
        images: newImages,
        uploading: false,
        uploadProgress: 100
      });

      // 显示结果
      if (successfulUploads.length === totalCount) {
        wx.showToast({
          title: `成功上传${successfulUploads.length}张图片`,
          icon: 'success'
        });
      } else if (successfulUploads.length > 0) {
        wx.showModal({
          title: '部分上传失败',
          content: `成功上传${successfulUploads.length}张，失败${failedUploads.length}张。是否重试失败的上传？`,
          success: (res) => {
            if (res.confirm) {
              this.retryFailedUploads(failedUploads, tempFilePaths);
            }
          }
        });
      } else {
        wx.showModal({
          title: '上传失败',
          content: '所有图片上传失败，可能的原因：\n1. 网络连接问题\n2. 云存储配置问题\n3. 文件格式不支持\n\n是否重试？',
          success: (res) => {
            if (res.confirm) {
              this.retryFailedUploads(failedUploads, tempFilePaths);
            }
          }
        });
      }

      // 重置进度
      setTimeout(() => {
        this.setData({ uploadProgress: 0 });
      }, 1000);
    });
  },


  // 重试失败的上传
  retryFailedUploads(failedUploads: { index: number, error: any }[], tempFilePaths: string[]) {
    console.log('开始重试失败的上传:', failedUploads);
    
    const retryFilePaths = failedUploads.map(item => tempFilePaths[item.index]);
    this.uploadImages(retryFilePaths);
  },

  // 删除图片
  onDeleteImage(e: any) {
    const index = e.currentTarget.dataset.index;
    
    // 同时删除云存储的fileID和临时预览图片
    const images = this.data.images.filter((_, i) => i !== index);
    const tempImages = this.data.tempImages.filter((_, i) => i !== index);
    
    this.setData({ 
      images,
      tempImages
    });

    wx.showToast({
      title: '图片已删除',
      icon: 'success'
    });
  },


  // 标签输入变化
  onTagInputChange(e: any) {
    const value = e.detail.value;
    this.setData({ 
      tagInput: value,
      tagInputDisabled: !value || value.trim() === ''
    });
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
      tagInput: '',
      tagInputDisabled: true
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
    if (this.data.tempImages.length === 0) {
      wx.showToast({
        title: '请至少选择一张图片',
        icon: 'none'
      });
      return;
    }

    if (this.data.uploading || this.data.publishing) {
      wx.showToast({
        title: '正在处理中，请稍候',
        icon: 'none'
      });
      return;
    }

    this.setData({ publishing: true });

    // 先上传图片到云存储
    const pendingImages = this.data.tempImages.slice(this.data.images.length);
    console.log('开始上传图片:', pendingImages);

    this.uploadImagesForPublish(pendingImages);
  },

  // 为发布上传图片
  uploadImagesForPublish(tempFilePaths: string[]) {
    if (tempFilePaths.length === 0) {
      // 没有新图片需要上传，直接发布
      this.publishPost();
      return;
    }

    console.log('开始上传图片到云存储:', tempFilePaths);
    this.setData({ uploading: true });

    const uploadPromises = tempFilePaths.map((tempFilePath, index) => {
      return new Promise<string>((resolve, reject) => {
        const fileName = `posts/${Date.now()}_${index}.jpg`;
        
        wx.cloud.uploadFile({
          cloudPath: fileName,
          filePath: tempFilePath,
          success: (res) => {
            console.log(`图片${index + 1}上传成功:`, res.fileID);
            resolve(res.fileID);
          },
          fail: (err: any) => {
            console.error(`图片${index + 1}上传失败:`, err);
            reject(err);
          }
        });
      });
    });

    Promise.allSettled(uploadPromises).then((results) => {
      const successfulUploads: string[] = [];
      const failedUploads: { index: number, error: any }[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successfulUploads.push(result.value);
        } else {
          failedUploads.push({ index, error: result.reason });
        }
      });

      console.log('上传结果:', {
        total: tempFilePaths.length,
        successful: successfulUploads.length,
        failed: failedUploads.length
      });

      // 更新已上传的图片列表
      const newImages = [...this.data.images, ...successfulUploads];
      this.setData({
        images: newImages,
        uploading: false
      });

      if (successfulUploads.length === tempFilePaths.length) {
        // 所有图片上传成功，发布帖子
        this.publishPost();
      } else if (successfulUploads.length > 0) {
        // 部分图片上传成功，询问是否继续
        wx.showModal({
          title: '部分图片上传失败',
          content: `成功上传${successfulUploads.length}张，失败${failedUploads.length}张。是否继续发布？`,
          success: (res) => {
            if (res.confirm) {
              this.publishPost();
            } else {
              this.setData({ publishing: false });
            }
          }
        });
      } else {
        // 所有图片上传失败
        wx.showModal({
          title: '图片上传失败',
          content: '所有图片上传失败，请检查网络连接后重试',
          showCancel: false,
          success: () => {
            this.setData({ publishing: false });
          }
        });
      }
    });
  },

  // 发布帖子到数据库
  publishPost() {
    console.log('开始发布帖子，当前数据:', {
      images: this.data.images,
      tags: this.data.tags,
      imagesLength: this.data.images.length,
      tempImagesLength: this.data.tempImages.length
    });

    // 检查云开发环境
    if (!wx.cloud) {
      console.error('云开发环境未初始化');
      wx.showToast({
        title: '云开发环境未初始化',
        icon: 'error'
      });
      this.setData({ publishing: false });
      return;
    }

    // 获取用户信息
    wx.cloud.callFunction({
      name: 'login',
      success: (loginRes) => {
        console.log('获取用户信息成功:', loginRes);
        const userInfo = loginRes.result as any;

        // 创建帖子数据
        const postData = {
          images: this.data.images,
          tags: this.data.tags,
          authorId: userInfo.openId,
          authorName: userInfo.userInfo?.nickName || '匿名用户',
          authorAvatar: userInfo.userInfo?.avatarUrl || '',
          createTime: new Date(),
          likeCount: 0,
          commentCount: 0,
          viewCount: 0
        };

        console.log('准备发布帖子:', postData);

        // 保存到数据库
        wx.cloud.database().collection('posts').add({
          data: postData,
          success: (res) => {
            console.log('帖子发布成功:', res);
            wx.showToast({
              title: '发布成功',
              icon: 'success'
            });

            // 发布成功后返回社区页面并刷新数据
            setTimeout(() => {
              // 获取页面栈
              const pages = getCurrentPages();
              const prevPage = pages[pages.length - 2]; // 上一个页面
              
              // 如果上一个页面是社区页面，刷新数据
              if (prevPage && prevPage.route === 'pages/community/community') {
                if (prevPage.loadPostsFromCloud) {
                  prevPage.loadPostsFromCloud();
                }
              }
              
              wx.navigateBack();
            }, 1500);
          },
          fail: (err) => {
            console.error('帖子发布失败:', err);
            console.error('错误详情:', {
              errCode: err.errCode,
              errMsg: err.errMsg,
              postData: postData
            });
            
            let errorMessage = '发布失败，请重试';
            if (err.errCode === -1) {
              errorMessage = '网络错误，请检查网络连接';
            } else if (err.errCode === -502002) {
              errorMessage = '数据库权限不足，请联系管理员';
            } else if (err.errMsg && err.errMsg.includes('collection')) {
              errorMessage = '数据库集合不存在，请联系管理员';
            }
            
            wx.showToast({
              title: errorMessage,
              icon: 'error'
            });
          },
          complete: () => {
            this.setData({ publishing: false });
          }
        });
      },
      fail: (err) => {
        console.error('获取用户信息失败:', err);
        wx.showToast({
          title: '获取用户信息失败',
          icon: 'error'
        });
        this.setData({ publishing: false });
      }
    });
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
