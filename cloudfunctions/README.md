# 云函数说明

## login 云函数

### 功能
处理微信小程序用户登录，包括新用户注册和现有用户登录。

### 参数
- `code`: 微信登录凭证
- `userInfo`: 用户信息对象

### 返回
```javascript
{
  success: boolean,
  openId: string,
  _id: string,
  userInfo: {
    nickName: string,
    avatarUrl: string
  },
  message: string
}
```

### 部署步骤
1. 在微信开发者工具中右键点击 `cloudfunctions/login` 文件夹
2. 选择"上传并部署：云端安装依赖"
3. 等待部署完成

### 数据库集合
需要在云开发数据库中创建 `users` 集合，包含以下字段：
- `openId`: 用户唯一标识
- `nickName`: 用户昵称
- `avatar`: 用户头像
- `gender`: 性别
- `country`: 国家
- `province`: 省份
- `city`: 城市
- `language`: 语言
- `createTime`: 创建时间
- `updateTime`: 更新时间
