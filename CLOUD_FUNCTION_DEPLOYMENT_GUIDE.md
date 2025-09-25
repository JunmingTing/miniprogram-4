# 🚀 云函数部署指南

## 🚨 当前问题
**错误**: `FunctionName parameter could not be found`  
**原因**: 云函数 `test` 未部署到云开发环境

## ✅ 解决方案

### 方法1: 使用微信开发者工具部署（推荐）

#### 步骤1: 打开云开发控制台
1. 在微信开发者工具中，点击工具栏的"云开发"按钮
2. 或者访问：https://console.cloud.tencent.com/tcb

#### 步骤2: 部署云函数
1. 在微信开发者工具中，右键点击 `cloudfunctions/test` 文件夹
2. 选择"上传并部署：云端安装依赖"
3. 等待部署完成

#### 步骤3: 部署其他云函数
同样部署以下云函数：
- `cloudfunctions/checkStorage`
- `cloudfunctions/login` 
- `cloudfunctions/updateUserInfo`

### 方法2: 使用命令行部署

#### 步骤1: 安装云开发CLI
```bash
npm install -g @cloudbase/cli
```

#### 步骤2: 登录云开发
```bash
tcb login
```

#### 步骤3: 部署云函数
```bash
# 进入项目根目录
cd C:\Users\Junming Ting\WeChatProjects\miniprogram-4

# 部署test云函数
tcb functions:deploy test

# 部署其他云函数
tcb functions:deploy checkStorage
tcb functions:deploy login
tcb functions:deploy updateUserInfo
```

### 方法3: 检查部署状态

#### 在云开发控制台检查
1. 进入云开发控制台
2. 点击"云函数"菜单
3. 查看云函数列表，确认以下函数已部署：
   - ✅ test
   - ✅ checkStorage
   - ✅ login
   - ✅ updateUserInfo

## 🔧 部署后验证

### 步骤1: 重新测试
1. 在微信开发者工具中重新编译项目
2. 进入测试页面
3. 点击"测试基础云函数"
4. 应该看到成功信息

### 步骤2: 检查日志
在云开发控制台的"云函数"页面：
1. 点击 `test` 云函数
2. 查看"日志"标签
3. 确认有调用记录

## 🚨 常见部署问题

### 问题1: 权限不足
**错误**: "permission denied"
**解决方案**:
1. 确认已登录微信开发者账号
2. 确认有该项目的开发权限
3. 重新登录云开发控制台

### 问题2: 环境ID错误
**错误**: "environment not found"
**解决方案**:
1. 检查 `miniprogram/app.ts` 中的环境ID
2. 确认环境ID与云开发控制台一致

### 问题3: 依赖安装失败
**错误**: "npm install failed"
**解决方案**:
1. 检查 `package.json` 中的依赖版本
2. 尝试手动安装依赖：
   ```bash
   cd cloudfunctions/test
   npm install
   ```

### 问题4: 函数名冲突
**错误**: "function already exists"
**解决方案**:
1. 在云开发控制台删除旧版本
2. 重新部署

## 📋 部署检查清单

### 部署前检查
- [ ] 云开发环境已开通
- [ ] 环境ID正确配置
- [ ] 云函数代码无语法错误
- [ ] package.json 依赖正确

### 部署过程检查
- [ ] 右键选择"上传并部署：云端安装依赖"
- [ ] 等待部署进度完成
- [ ] 查看部署结果无错误

### 部署后验证
- [ ] 云开发控制台显示函数已部署
- [ ] 测试页面基础云函数测试通过
- [ ] 云函数日志显示调用记录

## 🎯 预期结果

部署成功后，您应该看到：

### 云开发控制台
- 云函数列表显示所有函数
- 函数状态为"正常"
- 有调用记录和日志

### 测试页面
- 基础云函数测试显示"✅ 成功"
- 云存储权限测试显示"✅ 成功"
- 图片上传功能正常工作

## 🚀 快速修复命令

如果使用命令行，可以一键部署所有云函数：

```bash
# 进入项目目录
cd C:\Users\Junming Ting\WeChatProjects\miniprogram-4

# 部署所有云函数
tcb functions:deploy test
tcb functions:deploy checkStorage  
tcb functions:deploy login
tcb functions:deploy updateUserInfo
```

## 📞 如果仍有问题

1. **检查网络连接**
2. **确认微信开发者工具版本**
3. **重新登录云开发控制台**
4. **联系技术支持**

记住：部署云函数是解决上传问题的关键步骤！🎯
