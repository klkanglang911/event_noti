#!/bin/bash
# EventNoti 一键部署脚本
# 用法: curl -fsSL https://raw.githubusercontent.com/klkanglang911/event_noti/main/deploy.sh | bash
# 或本地执行: ./deploy.sh

set -e

# 配置
REPO_URL="https://github.com/klkanglang911/event_noti.git"
APP_DIR="/opt/event_noti"
COMPOSE_FILE="docker-compose.yml"

echo "🚀 EventNoti 部署开始..."

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，正在安装..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker && systemctl start docker
fi

# 检查 Docker Compose
if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose 未安装"
    exit 1
fi

# 克隆或更新代码
if [ -d "$APP_DIR" ]; then
    echo "📥 更新代码..."
    cd "$APP_DIR"
    git fetch origin
    git reset --hard origin/main
else
    echo "📥 克隆仓库..."
    git clone "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
fi

# 停止旧容器
echo "🛑 停止旧容器..."
docker compose down 2>/dev/null || true

# 构建并启动
echo "🔨 构建并启动容器..."
docker compose up -d --build

# 清理旧镜像
echo "🧹 清理旧镜像..."
docker image prune -f

# 检查状态
echo ""
echo "✅ 部署完成!"
echo ""
docker compose ps
echo ""
echo "📊 访问地址: http://$(hostname -I | awk '{print $1}'):3000"
echo "📝 查看日志: docker compose logs -f"
