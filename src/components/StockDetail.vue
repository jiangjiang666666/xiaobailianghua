<template>
  <div class="stock-detail">
    <header class="header">
      <button @click="goBack" class="back-btn">← 返回排行榜</button>
      <div class="stock-title">
        <h1>{{ stockInfo.companyName || stockSymbol }}</h1>
        <span class="stock-code">{{ stockSymbol }}</span>
      </div>
      <button @click="refreshData" :disabled="loading" class="refresh-btn">
        {{ loading ? '刷新中...' : '🔄 刷新' }}
      </button>
    </header>

    <div v-if="error" class="error-message">
      ❌ {{ error }}
    </div>

    <div v-if="loading && !stockInfo.price" class="loading-state">
      <div class="spinner"></div>
      <p>正在获取股票数据...</p>
    </div>

    <div v-if="stockInfo.price" class="stock-content">
      <!-- 主要价格信息 -->
      <div class="price-section">
        <div class="current-price-card">
          <div class="current-price">￥{{ stockInfo.price }}</div>
          <div class="price-change" :class="{ positive: stockInfo.change > 0, negative: stockInfo.change < 0 }">
            <span class="change-amount">
              {{ stockInfo.change > 0 ? '+' : '' }}￥{{ Math.abs(stockInfo.change).toFixed(2) }}
            </span>
            <span class="change-percent">
              ({{ stockInfo.change > 0 ? '+' : '' }}{{ stockInfo.changePercent.toFixed(2) }}%)
            </span>
          </div>
          <div class="update-time">
            更新时间: {{ formatTime(stockInfo.lastUpdated) }}
          </div>
        </div>
      </div>

      <!-- 详细数据 -->
      <div class="details-grid">
        <div class="detail-card">
          <h3>📊 基本信息</h3>
          <div class="detail-items">
            <div class="detail-item">
              <span class="label">开盘价:</span>
              <span class="value">￥{{ stockInfo.open }}</span>
            </div>
            <div class="detail-item">
              <span class="label">最高价:</span>
              <span class="value high">￥{{ stockInfo.high }}</span>
            </div>
            <div class="detail-item">
              <span class="label">最低价:</span>
              <span class="value low">￥{{ stockInfo.low }}</span>
            </div>
            <div class="detail-item">
              <span class="label">昨收价:</span>
              <span class="value">￥{{ stockInfo.previousClose }}</span>
            </div>
          </div>
        </div>

        <div class="detail-card">
          <h3>📈 交易数据</h3>
          <div class="detail-items">
            <div class="detail-item">
              <span class="label">成交量:</span>
              <span class="value">{{ formatVolume(stockInfo.volume) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">成交额:</span>
              <span class="value">{{ formatAmount(stockInfo.amount) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">换手率:</span>
              <span class="value">{{ stockInfo.turnoverRate }}%</span>
            </div>
            <div class="detail-item">
              <span class="label">市盈率:</span>
              <span class="value">{{ stockInfo.pe || '--' }}</span>
            </div>
          </div>
        </div>

        <div class="detail-card">
          <h3>💰 买卖盘口</h3>
          <div class="bid-ask-panel">
            <div class="ask-section">
              <h4>卖盘</h4>
              <div v-for="i in 5" :key="'ask' + i" class="bid-ask-item ask">
                <span class="level">卖{{ i }}</span>
                <span class="price">￥{{ stockInfo[`ask${i}Price`] || '--' }}</span>
                <span class="volume">{{ formatVolume(stockInfo[`ask${i}Volume`] || 0) }}</span>
              </div>
            </div>
            <div class="bid-section">
              <h4>买盘</h4>
              <div v-for="i in 5" :key="'bid' + i" class="bid-ask-item bid">
                <span class="level">买{{ i }}</span>
                <span class="price">￥{{ stockInfo[`bid${i}Price`] || '--' }}</span>
                <span class="volume">{{ formatVolume(stockInfo[`bid${i}Volume`] || 0) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 分时图模拟 -->
      <div class="chart-section">
        <div class="chart-card">
          <h3>📈 分时走势图</h3>
          <div class="chart-container">
            <div class="chart-placeholder">
              <div class="chart-line" :class="{ positive: stockInfo.changePercent > 0, negative: stockInfo.changePercent < 0 }">
                <div class="price-line"></div>
                <div class="volume-bars">
                  <div v-for="i in 20" :key="i" class="volume-bar" :style="{ height: Math.random() * 60 + 20 + 'px' }"></div>
                </div>
              </div>
              <div class="chart-info">
                <p>📊 实时分时数据</p>
                <p>当前价格: ￥{{ stockInfo.price }}</p>
                <p>涨跌幅: {{ stockInfo.changePercent.toFixed(2) }}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 自动刷新控制 -->
      <div class="auto-refresh">
        <label class="refresh-toggle">
          <input type="checkbox" v-model="autoRefresh" @change="toggleAutoRefresh">
          <span class="toggle-slider"></span>
          <span class="toggle-label">自动刷新 (30秒)</span>
        </label>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import iTickService from '../services/iTickService.js'

const props = defineProps({
  stockSymbol: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['go-back'])

const stockInfo = ref({
  price: '',
  change: 0,
  changePercent: 0,
  open: '',
  high: '',
  low: '',
  previousClose: '',
  volume: 0,
  amount: 0,
  turnoverRate: 0,
  pe: '',
  companyName: '',
  lastUpdated: new Date()
})

const loading = ref(false)
const error = ref('')
const autoRefresh = ref(true)
let refreshInterval = null

// 使用iTick API获取详细股票数据
const fetchStockDetail = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const data = await iTickService.getStockDetail(props.stockSymbol)
    
    stockInfo.value = {
      companyName: data.name || props.stockSymbol,
      price: data.price.toFixed(2),
      change: data.change,
      changePercent: data.changePercent,
      open: data.open.toFixed(2),
      high: data.high.toFixed(2),
      low: data.low.toFixed(2),
      previousClose: data.previousClose.toFixed(2),
      volume: data.volume || 0,
      amount: data.amount || 0,
      
      // 买卖盘口数据
      bid1Price: (data.bid1Price || 0).toFixed(2),
      bid1Volume: data.bid1Volume || 0,
      bid2Price: (data.bid2Price || 0).toFixed(2),
      bid2Volume: data.bid2Volume || 0,
      bid3Price: (data.bid3Price || 0).toFixed(2),
      bid3Volume: data.bid3Volume || 0,
      bid4Price: (data.bid4Price || 0).toFixed(2),
      bid4Volume: data.bid4Volume || 0,
      bid5Price: (data.bid5Price || 0).toFixed(2),
      bid5Volume: data.bid5Volume || 0,
      
      ask1Price: (data.ask1Price || 0).toFixed(2),
      ask1Volume: data.ask1Volume || 0,
      ask2Price: (data.ask2Price || 0).toFixed(2),
      ask2Volume: data.ask2Volume || 0,
      ask3Price: (data.ask3Price || 0).toFixed(2),
      ask3Volume: data.ask3Volume || 0,
      ask4Price: (data.ask4Price || 0).toFixed(2),
      ask4Volume: data.ask4Volume || 0,
      ask5Price: (data.ask5Price || 0).toFixed(2),
      ask5Volume: data.ask5Volume || 0,
      
      turnoverRate: (data.turnoverRate || 0).toFixed(2),
      pe: data.pe || '--',
      lastUpdated: new Date()
    }
  } catch (err) {
    console.error('获取股票详情失败:', err)
    error.value = `获取 ${props.stockSymbol} 详情失败: ${err.message}`
  } finally {
    loading.value = false
  }
}

// 刷新数据
const refreshData = () => {
  fetchStockDetail()
}

// 返回排行榜
const goBack = () => {
  emit('go-back')
}

// 切换自动刷新
const toggleAutoRefresh = () => {
  if (autoRefresh.value) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
}

// 开始自动刷新
const startAutoRefresh = () => {
  if (refreshInterval) clearInterval(refreshInterval)
  refreshInterval = setInterval(fetchStockDetail, 30000) // 30秒刷新一次
}

// 停止自动刷新
const stopAutoRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
}

// 格式化成交量
const formatVolume = (volume) => {
  if (volume >= 100000000) {
    return (volume / 100000000).toFixed(1) + '亿'
  } else if (volume >= 10000) {
    return (volume / 10000).toFixed(1) + '万'
  }
  return volume.toString()
}

// 格式化成交额
const formatAmount = (amount) => {
  if (amount >= 100000000) {
    return (amount / 100000000).toFixed(1) + '亿元'
  } else if (amount >= 10000) {
    return (amount / 10000).toFixed(1) + '万元'
  }
  return amount.toString() + '元'
}

// 格式化时间
const formatTime = (date) => {
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

onMounted(() => {
  fetchStockDetail()
  if (autoRefresh.value) {
    startAutoRefresh()
  }
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.stock-detail {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  backdrop-filter: blur(10px);
}

.back-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #6c757d, #495057);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.back-btn:hover {
  transform: translateY(-2px);
}

.stock-title {
  text-align: center;
  flex: 1;
}

.stock-title h1 {
  font-size: 2rem;
  color: #333;
  margin-bottom: 5px;
}

.stock-code {
  font-size: 1.2rem;
  color: #666;
  font-weight: 600;
}

.refresh-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.refresh-btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #f5c6cb;
}

.loading-state {
  text-align: center;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 40px;
  color: #666;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.price-section {
  margin-bottom: 30px;
}

.current-price-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 30px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  backdrop-filter: blur(10px);
}

.current-price {
  font-size: 3rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 15px;
}

.price-change {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 15px;
}

.price-change.positive {
  color: #28a745;
}

.price-change.negative {
  color: #dc3545;
}

.change-amount {
  margin-right: 10px;
}

.update-time {
  font-size: 0.9rem;
  color: #666;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.detail-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  backdrop-filter: blur(10px);
}

.detail-card h3 {
  color: #333;
  margin-bottom: 20px;
  font-size: 1.3rem;
  border-bottom: 2px solid #e1e5e9;
  padding-bottom: 10px;
}

.detail-items {
  display: grid;
  gap: 15px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.detail-item:last-child {
  border-bottom: none;
}

.label {
  color: #666;
  font-weight: 500;
}

.value {
  font-weight: 600;
  color: #333;
}

.value.high {
  color: #28a745;
}

.value.low {
  color: #dc3545;
}

.bid-ask-panel {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.ask-section h4, .bid-section h4 {
  color: #333;
  margin-bottom: 10px;
  text-align: center;
  font-size: 1rem;
}

.bid-ask-item {
  display: grid;
  grid-template-columns: 40px 1fr 1fr;
  gap: 10px;
  padding: 8px;
  border-radius: 6px;
  font-size: 0.9rem;
  align-items: center;
}

.bid-ask-item.ask {
  background: rgba(220, 53, 69, 0.1);
  color: #dc3545;
}

.bid-ask-item.bid {
  background: rgba(40, 167, 69, 0.1);
  color: #28a745;
}

.level {
  font-weight: 600;
  text-align: center;
}

.chart-section {
  margin-bottom: 30px;
}

.chart-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  backdrop-filter: blur(10px);
}

.chart-card h3 {
  color: #333;
  margin-bottom: 20px;
  font-size: 1.3rem;
  border-bottom: 2px solid #e1e5e9;
  padding-bottom: 10px;
}

.chart-container {
  height: 300px;
  position: relative;
}

.chart-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 10px;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.chart-line {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.price-line {
  position: absolute;
  top: 50%;
  left: 10%;
  right: 10%;
  height: 2px;
  background: #667eea;
  transform: translateY(-50%);
}

.chart-line.positive .price-line {
  background: #28a745;
}

.chart-line.negative .price-line {
  background: #dc3545;
}

.volume-bars {
  position: absolute;
  bottom: 20px;
  left: 10%;
  right: 10%;
  height: 60px;
  display: flex;
  align-items: flex-end;
  gap: 2px;
}

.volume-bar {
  flex: 1;
  background: rgba(102, 126, 234, 0.3);
  border-radius: 2px 2px 0 0;
  transition: all 0.3s ease;
}

.chart-info {
  text-align: center;
  color: #666;
  z-index: 1;
}

.chart-info p {
  margin: 5px 0;
}

.auto-refresh {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.refresh-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.95);
  padding: 15px 25px;
  border-radius: 25px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.refresh-toggle:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.15);
}

.refresh-toggle input[type="checkbox"] {
  display: none;
}

.toggle-slider {
  width: 50px;
  height: 26px;
  background: #ccc;
  border-radius: 13px;
  position: relative;
  transition: background 0.3s ease;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  width: 22px;
  height: 22px;
  background: white;
  border-radius: 50%;
  top: 2px;
  left: 2px;
  transition: transform 0.3s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.refresh-toggle input:checked + .toggle-slider {
  background: #667eea;
}

.refresh-toggle input:checked + .toggle-slider::before {
  transform: translateX(24px);
}

.toggle-label {
  font-weight: 600;
  color: #333;
}

@media (max-width: 768px) {
  .stock-detail {
    padding: 15px;
  }
  
  .header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .stock-title h1 {
    font-size: 1.5rem;
  }
  
  .current-price {
    font-size: 2.5rem;
  }
  
  .price-change {
    font-size: 1.2rem;
  }
  
  .details-grid {
    grid-template-columns: 1fr;
  }
  
  .bid-ask-panel {
    grid-template-columns: 1fr;
  }
  
  .chart-container {
    height: 250px;
  }
}
</style>