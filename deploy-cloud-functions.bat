@echo off
echo 🚀 开始部署云函数...
echo.

echo 📋 检查云函数目录...
if not exist "cloudfunctions\test" (
    echo ❌ 错误: test云函数目录不存在
    pause
    exit /b 1
)

if not exist "cloudfunctions\checkStorage" (
    echo ❌ 错误: checkStorage云函数目录不存在
    pause
    exit /b 1
)

if not exist "cloudfunctions\login" (
    echo ❌ 错误: login云函数目录不存在
    pause
    exit /b 1
)

if not exist "cloudfunctions\updateUserInfo" (
    echo ❌ 错误: updateUserInfo云函数目录不存在
    pause
    exit /b 1
)

echo ✅ 云函数目录检查通过
echo.

echo 📦 安装云函数依赖...

echo 安装test云函数依赖...
cd cloudfunctions\test
if exist "package.json" (
    npm install
    if errorlevel 1 (
        echo ❌ test云函数依赖安装失败
        cd ..\..
        pause
        exit /b 1
    )
) else (
    echo ⚠️  warning: test云函数没有package.json
)
cd ..\..

echo 安装checkStorage云函数依赖...
cd cloudfunctions\checkStorage
if exist "package.json" (
    npm install
    if errorlevel 1 (
        echo ❌ checkStorage云函数依赖安装失败
        cd ..\..
        pause
        exit /b 1
    )
) else (
    echo ⚠️  warning: checkStorage云函数没有package.json
)
cd ..\..

echo 安装login云函数依赖...
cd cloudfunctions\login
if exist "package.json" (
    npm install
    if errorlevel 1 (
        echo ❌ login云函数依赖安装失败
        cd ..\..
        pause
        exit /b 1
    )
) else (
    echo ⚠️  warning: login云函数没有package.json
)
cd ..\..

echo 安装updateUserInfo云函数依赖...
cd cloudfunctions\updateUserInfo
if exist "package.json" (
    npm install
    if errorlevel 1 (
        echo ❌ updateUserInfo云函数依赖安装失败
        cd ..\..
        pause
        exit /b 1
    )
) else (
    echo ⚠️  warning: updateUserInfo云函数没有package.json
)
cd ..\..

echo ✅ 所有云函数依赖安装完成
echo.

echo 📋 部署说明:
echo.
echo 1. 在微信开发者工具中打开此项目
echo 2. 右键点击 cloudfunctions\test 文件夹
echo 3. 选择 "上传并部署: 云端安装依赖"
echo 4. 等待部署完成
echo 5. 重复步骤2-4，部署其他云函数:
echo    - cloudfunctions\checkStorage
echo    - cloudfunctions\login  
echo    - cloudfunctions\updateUserInfo
echo.
echo 6. 部署完成后，重新测试上传功能
echo.

echo 🎯 部署完成后，请:
echo - 进入测试页面
echo - 点击"测试基础云函数"
echo - 确认显示"✅ 成功"
echo.

pause
