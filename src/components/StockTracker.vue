<template>
  <div class="stock-tracker">
    <header class="header">
      <h1>📈 实时股价监控</h1>
      <p class="subtitle">追踪您关注的股票实时价格变化</p>
    </header>

    <div class="controls">
      <div class="search-box">
        <input 
          v-model="searchSymbol" 
          placeholder="输入A股代码 (如: 000001, 600036, 600519)"
          @keyup.enter="addStock"
          :disabled="loading"
        />
        <button @click="addStock" :disabled="loading || !searchSymbol.trim()">
          {{ loading ? '添加中...' : '添加股票' }}
        </button>
      </div>
      
      <div class="stock-selector">
          <h3>📈 A股选择器 (新浪财经实时数据)</h3>
          
          <div class="stock-categories">
            <div class="category">
              <h4>🇨🇳 A股主要股票</h4>
              <div class="stock-grid">
                <button 
                  v-for="stock in aStockList" 
                  :key="stock.code"
                  @click="addStockFromList(stock.code)"
                  class="stock-item"
                  :disabled="stocks.some(s => s.symbol === stock.code)"
                >
                  <span class="stock-code">{{ stock.code }}</span>
                  <span class="stock-name">{{ stock.name }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
       
       <div class="stock-tips">
         <p>💡 支持的股票代码格式：</p>
         <ul>
           <li><strong>沪市A股：</strong>6开头的6位数字，如 600036（招商银行）</li>
           <li><strong>深市A股：</strong>0开头的6位数字，如 000001（平安银行）</li>
         </ul>
       </div>
      
      <div class="refresh-info">
        <span>自动刷新: {{ autoRefresh ? '开启' : '关闭' }}</span>
        <button @click="toggleAutoRefresh" class="toggle-btn">
          {{ autoRefresh ? '关闭' : '开启' }}
        </button>
        <span v-if="lastUpdate">最后更新: {{ formatTime(lastUpdate) }}</span>
      </div>
    </div>

    <div v-if="error" class="error-message">
      ❌ {{ error }}
    </div>

    <div v-if="stocks.length === 0 && !loading" class="empty-state">
      <h3>📊 开始监控您的第一只股票</h3>
      <p>输入股票代码并点击添加按钮开始</p>
      <div class="popular-stocks">
        <h4>热门股票:</h4>
        <div class="stock-chips">
          <button 
            v-for="symbol in popularStocks" 
            :key="symbol"
            @click="quickAdd(symbol)"
            class="stock-chip"
          >
            {{ symbol }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading && stocks.length === 0" class="loading-state">
      <div class="spinner"></div>
      <p>正在获取股票数据...</p>
    </div>

    <div v-if="stocks.length > 0" class="stocks-grid">
      <div 
        v-for="stock in stocks" 
        :key="stock.symbol"
        class="stock-card"
        :class="{
          'positive': stock.change > 0,
          'negative': stock.change < 0,
          'loading': stock.loading
        }"
      >
        <div class="stock-header">
          <div class="stock-title">
            <h3>{{ stock.symbol }}</h3>
            <span class="company-name">{{ stock.companyName || stock.symbol }}</span>
          </div>
          <button @click="removeStock(stock.symbol)" class="remove-btn" title="移除股票">
            ×
          </button>
        </div>

        <div v-if="stock.loading" class="card-loading">
          <div class="mini-spinner"></div>
          <span>更新中...</span>
        </div>

        <div v-else class="stock-content">
          <div class="price-section">
            <div class="current-price">￥{{ stock.price }}</div>
            <div class="change" :class="{ positive: stock.change > 0, negative: stock.change < 0 }">
              <span class="change-amount">
                {{ stock.change > 0 ? '+' : '' }}￥{{ Math.abs(stock.change).toFixed(2) }}
              </span>
              <span class="change-percent">
                ({{ stock.change > 0 ? '+' : '' }}{{ stock.changePercent.toFixed(2) }}%)
              </span>
            </div>
          </div>

          <div class="stock-details">
            <div class="detail-row">
              <span class="label">开盘:</span>
              <span class="value">￥{{ stock.open }}</span>
            </div>
            <div class="detail-row">
              <span class="label">最高:</span>
              <span class="value">￥{{ stock.high }}</span>
            </div>
            <div class="detail-row">
              <span class="label">最低:</span>
              <span class="value">￥{{ stock.low }}</span>
            </div>
            <div class="detail-row">
              <span class="label">成交量:</span>
              <span class="value">{{ formatVolume(stock.volume) }}</span>
            </div>
          </div>

          <div class="update-time">
            更新时间: {{ formatTime(stock.lastUpdated) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import iTickService from '../services/iTickService.js'

const stocks = ref([])
const searchSymbol = ref('')
const loading = ref(false)
const error = ref('')
const autoRefresh = ref(true)
const lastUpdate = ref(null)
let refreshInterval = null
  
  // A股主要股票列表
  const aStockList = [
    // 银行股
    { code: '600036', name: '招商银行' },
    { code: '000001', name: '平安银行' },
    { code: '600000', name: '浦发银行' },
    { code: '601166', name: '兴业银行' },
    { code: '000002', name: '万科A' },
    { code: '601318', name: '中国平安' },
    { code: '600519', name: '贵州茅台' },
    { code: '000858', name: '五粮液' },
    { code: '002415', name: '海康威视' },
    { code: '000725', name: '京东方A' },
    // 科技股
    { code: '300059', name: '东方财富' },
    { code: '002594', name: '比亚迪' },
    { code: '300750', name: '宁德时代' },
    { code: '600276', name: '恒瑞医药' },
    { code: '000568', name: '泸州老窖' },
    { code: '002304', name: '洋河股份' },
    { code: '600887', name: '伊利股份' },
    { code: '000596', name: '古井贡酒' },
    { code: '600309', name: '万华化学' },
    { code: '002142', name: '宁波银行' },
    // 地产股
    { code: '000002', name: '万科A' },
    { code: '600048', name: '保利发展' },
    { code: '001979', name: '招商蛇口' },
    { code: '600606', name: '绿地控股' },
    // 能源股
    { code: '600028', name: '中国石化' },
    { code: '601857', name: '中国石油' },
    { code: '600900', name: '长江电力' },
    { code: '000983', name: '西山煤电' },
    // 钢铁股
    { code: '600019', name: '宝钢股份' },
    { code: '000709', name: '河钢股份' },
    { code: '002110', name: '三钢闽光' },
    // 汽车股
    { code: '000625', name: '长安汽车' },
    { code: '600104', name: '上汽集团' },
    { code: '002594', name: '比亚迪' },
    { code: '601633', name: '长城汽车' },
    // 医药股
    { code: '600276', name: '恒瑞医药' },
    { code: '000661', name: '长春高新' },
    { code: '300015', name: '爱尔眼科' },
    { code: '002821', name: '凯莱英' },
    // 消费股
    { code: '600887', name: '伊利股份' },
    { code: '000895', name: '双汇发展' },
    { code: '002304', name: '洋河股份' },
    { code: '600779', name: '水井坊' },
    // 电子股
    { code: '002415', name: '海康威视' },
    { code: '000725', name: '京东方A' },
    { code: '002236', name: '大华股份' },
    { code: '300433', name: '蓝思科技' },
    // 通信股
    { code: '000063', name: '中兴通讯' },
    { code: '600050', name: '中国联通' },
    { code: '600941', name: '中国移动' },
    // 军工股
    { code: '600893', name: '航发动力' },
    { code: '002179', name: '中航光电' },
    { code: '000768', name: '中航飞机' },
    // 新能源
    { code: '300750', name: '宁德时代' },
    { code: '002129', name: '中环股份' },
    { code: '601012', name: '隆基绿能' },
    { code: '300274', name: '阳光电源' }
  ]
  
  // 热门A股推荐（从列表中提取）
  const popularStocks = ['000001', '600036', '600519', '000858', '002415', '000725', '300059', '002594', '300750', '600276', '000568', '002304', '600887', '000596', '600309', '002142']
  
  // 使用iTick API获取实时股票数据
const fetchStockData = async (symbol) => {
  try {
    // 使用iTick API获取股票数据
    const stockData = await iTickService.getStockQuote(symbol)
    
    return {
      symbol: symbol.toUpperCase(),
      companyName: stockData.name || symbol,
      price: stockData.current.toFixed(2),
      change: stockData.change,
      changePercent: stockData.changePercent,
      open: stockData.open.toFixed(2),
      high: stockData.high.toFixed(2),
      low: stockData.low.toFixed(2),
      volume: stockData.volume,
      lastUpdated: new Date(),
      loading: false
    }
  } catch (error) {
    console.error('获取股票数据失败:', error)
    throw error
  }
}

const addStock = async () => {
  const symbol = searchSymbol.value.trim().toUpperCase()
  if (!symbol) return

  await addStockBySymbol(symbol)
  searchSymbol.value = ''
}

const addStockFromList = async (symbol) => {
  await addStockBySymbol(symbol)
}

const addStockBySymbol = async (symbol) => {
  // 检查是否已存在
  if (stocks.value.find(stock => stock.symbol === symbol)) {
    error.value = '该股票已在监控列表中'
    setTimeout(() => error.value = '', 3000)
    return
  }

  loading.value = true
  error.value = ''

  // 先添加一个loading状态的股票卡片
  const loadingStock = {
    symbol: symbol,
    loading: true,
    price: '0.00',
    change: 0,
    changePercent: 0,
    open: '0.00',
    high: '0.00',
    low: '0.00',
    volume: 0,
    lastUpdated: new Date()
  }
  stocks.value.push(loadingStock)

  try {
    const stockData = await fetchStockData(symbol)
    // 替换loading状态的股票
    const index = stocks.value.findIndex(stock => stock.symbol === symbol)
    if (index !== -1) {
      stocks.value[index] = stockData
    }
  } catch (err) {
    // 移除loading状态的股票
    stocks.value = stocks.value.filter(stock => stock.symbol !== symbol)
    error.value = err.message
    setTimeout(() => error.value = '', 5000)
  } finally {
    loading.value = false
  }
}

const quickAdd = (symbol) => {
  searchSymbol.value = symbol
  addStock()
}

const refreshAllStocks = async () => {
  await updateAllStocks()
}

const formatNumber = (num) => {
  return formatVolume(num)
}

const removeStock = (symbol) => {
  stocks.value = stocks.value.filter(stock => stock.symbol !== symbol)
}

const updateAllStocks = async () => {
  if (stocks.value.length === 0) return
  
  lastUpdate.value = new Date()
  
  for (let i = 0; i < stocks.value.length; i++) {
    const stock = stocks.value[i]
    stock.loading = true
    
    try {
      const updatedData = await fetchStockData(stock.symbol)
      stocks.value[i] = updatedData
    } catch (err) {
      console.error(`更新 ${stock.symbol} 失败:`, err)
      stock.loading = false
    }
    
    // 添加小延迟避免API限制
    await new Promise(resolve => setTimeout(resolve, 200))
  }
}

const toggleAutoRefresh = () => {
  autoRefresh.value = !autoRefresh.value
  
  if (autoRefresh.value) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
}

const startAutoRefresh = () => {
  if (refreshInterval) clearInterval(refreshInterval)
  refreshInterval = setInterval(updateAllStocks, 60000) // 每分钟更新一次
}

const stopAutoRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
}

const formatVolume = (volume) => {
  if (volume >= 1000000000) {
    return (volume / 1000000000).toFixed(1) + 'B'
  } else if (volume >= 1000000) {
    return (volume / 1000000).toFixed(1) + 'M'
  } else if (volume >= 1000) {
    return (volume / 1000).toFixed(1) + 'K'
  }
  return volume.toString()
}

const formatTime = (date) => {
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

onMounted(() => {
  // 添加一些默认A股股票
  const defaultStocks = ['000001', '600036', '600519']
  defaultStocks.forEach(symbol => {
    searchSymbol.value = symbol
    addStock()
  })
  
  if (autoRefresh.value) {
    startAutoRefresh()
  }
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.stock-tracker {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  text-align: center;
  margin-bottom: 40px;
  color: white;
}

.header h1 {
  font-size: 2.5rem;
  margin-bottom: 10px;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
}

.controls {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 25px;
  margin-bottom: 30px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  backdrop-filter: blur(10px);
}

.search-box {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.search-box input {
  flex: 1;
  min-width: 300px;
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s ease;
}

.search-box input:focus {
  outline: none;
  border-color: #667eea;
}

.search-box button {
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.search-box button:hover:not(:disabled) {
  transform: translateY(-2px);
}

.search-box button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.stock-tips {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  font-size: 14px;
}

.stock-tips p {
  margin: 0 0 10px 0;
  font-weight: 600;
  color: #ffd700;
}

.stock-tips ul {
  margin: 0;
  padding-left: 20px;
  list-style-type: disc;
}

.stock-tips li {
  margin-bottom: 5px;
  line-height: 1.4;
}

.stock-tips strong {
  color: #4CAF50;
}

.refresh-info {
  display: flex;
  align-items: center;
  gap: 15px;
  font-size: 14px;
  color: #666;
  flex-wrap: wrap;
}

.toggle-btn {
  padding: 6px 12px;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-btn:hover {
  background: #e9ecef;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #f5c6cb;
}

.empty-state {
  text-align: center;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 40px;
  color: #666;
}

.empty-state h3 {
  margin-bottom: 10px;
  color: #333;
}

.popular-stocks {
  margin-top: 30px;
}

.popular-stocks h4 {
  margin-bottom: 15px;
  color: #333;
}

.stock-chips {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}

.stock-chip {
  padding: 8px 16px;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
}

.stock-chip:hover {
  background: #667eea;
  color: white;
  border-color: #667eea;
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

.stocks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.stock-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.stock-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 40px rgba(0,0,0,0.15);
}

.stock-card.positive {
  border-color: #28a745;
}

.stock-card.negative {
  border-color: #dc3545;
}

.stock-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.stock-title h3 {
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 5px;
}

.company-name {
  font-size: 0.9rem;
  color: #666;
}

.remove-btn {
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  cursor: pointer;
  font-size: 18px;
  transition: all 0.2s ease;
}

.remove-btn:hover {
  background: #c82333;
  transform: scale(1.1);
}

.card-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 20px;
  color: #666;
}

.mini-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.price-section {
  margin-bottom: 20px;
}

.current-price {
  font-size: 2.2rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.price-change {
  font-size: 1.1rem;
  font-weight: 600;
}

.price-change.positive {
  color: #28a745;
}

.price-change.negative {
  color: #dc3545;
}

.change-amount {
  margin-right: 8px;
}

.stock-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label {
  color: #666;
  font-size: 0.9rem;
}

.value {
  font-weight: 600;
  color: #333;
}

.update-time {
  text-align: center;
  font-size: 0.8rem;
  color: #999;
  border-top: 1px solid #eee;
  padding-top: 15px;
}

.stock-selector {
  margin-bottom: 20px;
}

.stock-selector h3 {
  margin-bottom: 15px;
  color: #333;
  font-size: 1.2rem;
}

.stock-categories {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.category {
  flex: 1;
  min-width: 300px;
}

.category h4 {
  margin-bottom: 10px;
  color: #555;
  font-size: 1rem;
  padding-bottom: 5px;
  border-bottom: 2px solid #e1e5e9;
}

.stock-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
}

.stock-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 6px;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 12px;
  text-align: center;
}

.stock-item:hover:not(:disabled) {
  background: #667eea;
  color: white;
  border-color: #667eea;
  transform: translateY(-1px);
}

.stock-item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #e9ecef;
}

.stock-code {
  font-weight: bold;
  margin-bottom: 2px;
}

.stock-name {
  font-size: 10px;
  opacity: 0.8;
  line-height: 1.2;
}

@media (max-width: 768px) {
  .stock-tracker {
    padding: 15px;
  }
  
  .header h1 {
    font-size: 2rem;
  }
  
  .stocks-grid {
    grid-template-columns: 1fr;
  }
  
  .search-box {
    flex-direction: column;
  }
  
  .search-box input {
    min-width: auto;
  }
  
  .refresh-info {
    justify-content: center;
  }
  
  .stock-details {
    grid-template-columns: 1fr;
  }
}
</style>