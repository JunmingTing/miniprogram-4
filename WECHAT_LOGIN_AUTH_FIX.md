# 微信小程序登录授权问题修复

## 问题分析

根据微信官方文档，`wx.getUserProfile` 接口已被废弃，不再推荐使用。原登录流程存在以下问题：

1. **废弃的API**：使用了已废弃的 `wx.getUserProfile` 接口
2. **授权流程复杂**：需要用户主动授权才能获取头像昵称
3. **用户体验差**：授权失败时无法正常登录

## 解决方案

### 1. 优化登录流程

**修改前：**
```typescript
// 旧流程：wx.login → wx.getUserProfile → 云函数登录
wx.login() → getUserProfile() → callCloudLogin(code, userInfo)
```

**修改后：**
```typescript
// 新流程：wx.login → 云函数登录（仅通过openId）
wx.login() → callCloudLogin(code)
```

### 2. 移除废弃的API

- ❌ 移除 `wx.getUserProfile` 调用
- ✅ 直接通过 `wx.login` 获取 code
- ✅ 云函数通过 `cloud.getWXContext()` 获取 openId

### 3. 实现新的头像昵称设置方式

**微信推荐的新方式：**
- 用户登录后可以主动设置头像和昵称
- 点击头像可选择相册或拍照
- 点击昵称可编辑修改

## 技术实现

### 1. 登录云函数优化

```javascript
// cloudfunctions/login/index.js
exports.main = async (event, context) => {
  const { code } = event
  
  // 通过微信上下文获取 openId
  const { OPENID } = cloud.getWXContext()
  
  // 查询或创建用户（使用默认信息）
  // 不再依赖用户主动授权获取头像昵称
}
```

### 2. 头像昵称设置功能

```typescript
// 点击头像设置
onAvatarTap() {
  wx.chooseMedia({
    count: 1,
    mediaType: ['image'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      this.uploadAvatar(res.tempFiles[0].tempFilePath);
    }
  });
}

// 点击昵称设置
onNicknameTap() {
  wx.showModal({
    title: '设置昵称',
    editable: true,
    placeholderText: '请输入昵称',
    success: (res) => {
      if (res.confirm && res.content) {
        this.updateNickname(res.content.trim());
      }
    }
  });
}
```

### 3. 用户信息更新云函数

```javascript
// cloudfunctions/updateUserInfo/index.js
exports.main = async (event, context) => {
  const { userId, nickName, avatar } = event
  
  // 更新用户昵称或头像
  await db.collection('users').doc(userId).update({
    data: { nickName, avatar, updateTime: new Date() }
  });
}
```

## 优势对比

| 方面 | 修改前 | 修改后 |
|------|--------|--------|
| **API使用** | 使用废弃的 `getUserProfile` | 使用推荐的 `chooseMedia` |
| **授权流程** | 必须授权才能登录 | 无需授权即可登录 |
| **用户体验** | 授权失败无法登录 | 登录后可主动设置 |
| **合规性** | 不符合微信新规范 | 完全符合微信规范 |
| **灵活性** | 头像昵称固定 | 用户可随时修改 |

## 部署说明

### 1. 云函数部署

```bash
# 部署登录云函数
cd cloudfunctions/login
npm install
# 在微信开发者工具中右键上传并部署

# 部署更新用户信息云函数
cd cloudfunctions/updateUserInfo
npm install
# 在微信开发者工具中右键上传并部署
```

### 2. 数据库权限

确保云函数有权限访问 `users` 集合：
- 读取权限：所有用户
- 写入权限：仅创建者

## 测试步骤

1. **登录测试**
   - 点击"点击登录"
   - 确认对话框显示正常
   - 点击"确认登录"完成登录

2. **头像设置测试**
   - 登录后点击头像
   - 选择相册或拍照
   - 确认头像更新成功

3. **昵称设置测试**
   - 登录后点击昵称
   - 输入新昵称
   - 确认昵称更新成功

## 注意事项

1. **云函数环境**：确保云开发环境已开通
2. **存储权限**：确保云存储有上传权限
3. **数据库权限**：确保数据库有读写权限
4. **微信版本**：建议在最新版本微信中测试

## 相关文档

- [微信小程序登录](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/login.html)
- [微信小程序头像昵称填写](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/avatar-nickname.html)
- [微信小程序媒体选择](https://developers.weixin.qq.com/miniprogram/dev/api/media/video/wx.chooseMedia.html)
