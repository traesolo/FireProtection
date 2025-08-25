<template>
  <div class="log-container">
    <!-- 页面标题 -->
    <div class="log-header">
      <h2>系统日志</h2>
      <div class="header-actions">
        <el-button @click="goBack" type="primary" plain>
          <el-icon><ArrowLeft /></el-icon>
          返回首页
        </el-button>
      </div>
    </div>

    <!-- 筛选条件 -->
    <div class="log-filters">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-select v-model="filters.level" placeholder="日志级别" clearable>
            <el-option label="全部" value="" />
            <el-option label="信息" value="info" />
            <el-option label="警告" value="warning" />
            <el-option label="错误" value="error" />
            <el-option label="调试" value="debug" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-select v-model="filters.deviceId" placeholder="设备编号" clearable>
            <el-option label="全部设备" value="" />
            <el-option label="设备001" value="001" />
            <el-option label="设备002" value="002" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-select v-model="filters.monitorArea" placeholder="监控区域" clearable>
            <el-option label="全部区域" value="" />
            <el-option label="左侧区域" value="left" />
            <el-option label="右侧区域" value="right" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-date-picker
            v-model="filters.dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-col>
        <el-col :span="6">
          <el-button type="primary" @click="searchLogs">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
        </el-col>
      </el-row>
    </div>

    <!-- 日志列表 -->
    <div class="log-content">
      <el-table
        :data="logList"
        v-loading="loading"
        height="600"
        stripe
        border
      >
        <el-table-column prop="timestamp" label="时间" width="180" sortable>
          <template #default="{ row }">
            <span>{{ formatTime(row.timestamp) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="level" label="级别" width="100">
          <template #default="{ row }">
            <el-tag :type="getLevelTagType(row.level)">{{ getLevelText(row.level) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="deviceId" label="设备编号" width="120" />
        <el-table-column prop="monitorArea" label="监控区域" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.monitorArea" :type="row.monitorArea === 'left' ? 'primary' : 'success'">
              {{ row.monitorArea === 'left' ? '左侧区域' : '右侧区域' }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="module" label="模块" width="120" />
        <el-table-column prop="message" label="日志内容" min-width="300" show-overflow-tooltip />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button type="text" size="small" @click="viewLogDetail(row)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[20, 50, 100, 200]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 日志详情弹窗 -->
    <el-dialog
      v-model="detailDialog.visible"
      title="日志详情"
      width="60%"
      :before-close="closeDetailDialog"
    >
      <div class="log-detail" v-if="detailDialog.data">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="时间">
            {{ formatTime(detailDialog.data.timestamp) }}
          </el-descriptions-item>
          <el-descriptions-item label="级别">
            <el-tag :type="getLevelTagType(detailDialog.data.level)">
              {{ getLevelText(detailDialog.data.level) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="设备编号">
            {{ detailDialog.data.deviceId }}
          </el-descriptions-item>
          <el-descriptions-item label="模块">
            {{ detailDialog.data.module }}
          </el-descriptions-item>
          <el-descriptions-item label="日志内容" :span="2">
            <div class="log-message">{{ detailDialog.data.message }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="详细信息" :span="2" v-if="detailDialog.data.details">
            <pre class="log-details">{{ detailDialog.data.details }}</pre>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="closeDetailDialog">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Search } from '@element-plus/icons-vue'
import logManager from '@/utils/logManager.js'

const router = useRouter()

// 响应式数据
const loading = ref(false)
const logList = ref([])

// 筛选条件
const filters = reactive({
  level: '',
  deviceId: '',
  monitorArea: '',
  dateRange: []
})

// 分页数据
const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

// 详情弹窗
const detailDialog = reactive({
  visible: false,
  data: null
})

// 返回首页
const goBack = () => {
  router.push('/')
}

// 获取日志级别标签类型
const getLevelTagType = (level) => {
  const typeMap = {
    info: 'info',
    warning: 'warning',
    error: 'danger',
    debug: 'success'
  }
  return typeMap[level] || 'info'
}

// 获取日志级别文本
const getLevelText = (level) => {
  const textMap = {
    info: '信息',
    warning: '警告',
    error: '错误',
    debug: '调试'
  }
  return textMap[level] || level
}

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return '-'
  return new Date(timestamp).toLocaleString('zh-CN')
}

// 查询日志
const searchLogs = async () => {
  loading.value = true
  try {
    // 获取真实日志数据
    let logs = logManager.getLogs()
    
    // 应用筛选条件
    if (filters.level) {
      logs = logs.filter(log => log.level === filters.level)
    }
    
    if (filters.deviceId) {
      logs = logs.filter(log => log.deviceId === filters.deviceId)
    }
    
    if (filters.monitorArea) {
      logs = logs.filter(log => log.monitorArea === filters.monitorArea)
    }
    
    if (filters.dateRange && filters.dateRange.length === 2) {
      const startTime = new Date(filters.dateRange[0]).getTime()
      const endTime = new Date(filters.dateRange[1]).getTime()
      logs = logs.filter(log => log.timestamp >= startTime && log.timestamp <= endTime)
    }
    
    // 转换日志格式
    logList.value = logs.map(log => ({
      id: log.timestamp,
      timestamp: log.timestamp,
      level: log.level,
      deviceId: log.deviceId || '001',
      monitorArea: log.monitorArea || null,
      module: log.module || '系统',
      message: log.message,
      details: log.data ? JSON.stringify(log.data, null, 2) : null
    })).reverse() // 最新的日志在前
    
    pagination.total = logList.value.length
    
    ElMessage.success('日志查询成功')
  } catch (error) {
    console.error('查询日志失败:', error)
    ElMessage.error('查询日志失败')
  } finally {
    loading.value = false
  }
}

// 控制台日志捕获
let originalConsole = {}
const captureConsoleLogs = () => {
  // 保存原始console方法
  originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info
  }
  
  // 重写console方法
  console.log = (...args) => {
    originalConsole.log.apply(console, args)
    logManager.addLog('log', args.join(' '), { source: 'console', args })
  }
  
  console.error = (...args) => {
    originalConsole.error.apply(console, args)
    logManager.addLog('error', args.join(' '), { source: 'console', args })
  }
  
  console.warn = (...args) => {
    originalConsole.warn.apply(console, args)
    logManager.addLog('warn', args.join(' '), { source: 'console', args })
  }
  
  console.info = (...args) => {
    originalConsole.info.apply(console, args)
    logManager.addLog('info', args.join(' '), { source: 'console', args })
  }
}

// 恢复原始console方法
const restoreConsoleLogs = () => {
  if (originalConsole.log) {
    console.log = originalConsole.log
    console.error = originalConsole.error
    console.warn = originalConsole.warn
    console.info = originalConsole.info
  }
}

// 查看日志详情
const viewLogDetail = (row) => {
  detailDialog.data = row
  detailDialog.visible = true
}

// 关闭详情弹窗
const closeDetailDialog = () => {
  detailDialog.visible = false
  detailDialog.data = null
}

// 分页大小改变
const handleSizeChange = (size) => {
  pagination.pageSize = size
  searchLogs()
}

// 当前页改变
const handleCurrentChange = (page) => {
  pagination.currentPage = page
  searchLogs()
}

// 组件挂载时加载日志
onMounted(() => {
  captureConsoleLogs()
  searchLogs()
})

// 组件卸载时恢复console
onUnmounted(() => {
  restoreConsoleLogs()
})
</script>

<style scoped>
.log-container {
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.log-header h2 {
  margin: 0;
  color: #333;
  font-size: 24px;
}

.log-filters {
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.log-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}

.log-detail .log-message {
  word-break: break-all;
  white-space: pre-wrap;
}

.log-detail .log-details {
  background: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.5;
  max-height: 200px;
  overflow-y: auto;
}

:deep(.el-table .el-table__cell) {
  padding: 8px 0;
}

:deep(.el-descriptions__label) {
  font-weight: bold;
}
</style>