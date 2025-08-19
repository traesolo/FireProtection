FROM node:18-alpine

# 安装构建依赖
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    libc6-compat

# 设置工作目录
WORKDIR /workspace

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制源代码
COPY . .

# 构建命令
CMD ["sh", "-c", "npm run build && npx electron-builder --linux"]