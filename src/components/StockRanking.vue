<template>
  <div class="stock-ranking">
    <header class="header">
      <h1>📊 A股涨幅排行榜</h1>
      <p class="subtitle">实时A股涨跌幅排序 - 新浪财经数据</p>
    </header>

    <div class="controls">
      <div class="refresh-section">
        <button @click="refreshData" :disabled="loading" class="refresh-btn">
          {{ loading ? '刷新中...' : '🔄 刷新数据' }}
        </button>
        <span class="last-update" v-if="lastUpdate">
          最后更新: {{ formatTime(lastUpdate) }}
        </span>
      </div>
      
      <div class="sort-options">
        <label>排序方式:</label>
        <select v-model="sortBy" @change="sortStocks">
          <option value="changePercent">涨跌幅</option>
          <option value="change">涨跌额</option>
          <option value="volume">成交量</option>
          <option value="price">当前价格</option>
        </select>
        <button @click="toggleSortOrder" class="sort-order-btn">
          {{ sortOrder === 'desc' ? '↓ 降序' : '↑ 升序' }}
        </button>
      </div>
    </div>

    <div v-if="error" class="error-message">
      ❌ {{ error }}
    </div>

    <div v-if="loading && stocks.length === 0" class="loading-state">
      <div class="spinner"></div>
      <p>正在获取A股数据...</p>
    </div>

    <div v-if="stocks.length > 0" class="ranking-list">
      <div class="list-header">
        <span class="rank">排名</span>
        <span class="stock-info">股票信息</span>
        <span class="price">当前价</span>
        <span class="change">涨跌额</span>
        <span class="change-percent">涨跌幅</span>
        <span class="volume">成交量</span>
      </div>
      
      <div 
        v-for="(stock, index) in sortedStocks" 
        :key="stock.symbol"
        class="stock-row"
        :class="{
          'positive': stock.changePercent > 0,
          'negative': stock.changePercent < 0,
          'loading': stock.loading
        }"
        @click="viewStockDetail(stock.symbol)"
      >
        <span class="rank">{{ index + 1 }}</span>
        <div class="stock-info">
          <div class="stock-code">{{ stock.symbol }}</div>
          <div class="stock-name">{{ stock.companyName }}</div>
        </div>
        <span class="price">￥{{ stock.price }}</span>
        <span class="change" :class="{ positive: stock.change > 0, negative: stock.change < 0 }">
          {{ stock.change > 0 ? '+' : '' }}￥{{ Math.abs(stock.change).toFixed(2) }}
        </span>
        <span class="change-percent" :class="{ positive: stock.changePercent > 0, negative: stock.changePercent < 0 }">
          {{ stock.changePercent > 0 ? '+' : '' }}{{ stock.changePercent.toFixed(2) }}%
        </span>
        <span class="volume">{{ formatVolume(stock.volume) }}</span>
        
        <div v-if="stock.loading" class="row-loading">
          <div class="mini-spinner"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import iTickService from '../services/iTickService.js'

const emit = defineEmits(['view-detail'])

const stocks = ref([])
const loading = ref(false)
const error = ref('')
const lastUpdate = ref(null)
const sortBy = ref('changePercent')
const sortOrder = ref('desc')

// A股主要股票列表（扩展版）
const aStockList = [
  // 银行股
  { code: '600036', name: '招商银行' },
  { code: '000001', name: '平安银行' },
  { code: '600000', name: '浦发银行' },
  { code: '601166', name: '兴业银行' },
  { code: '601328', name: '交通银行' },
  { code: '601398', name: '工商银行' },
  { code: '601939', name: '建设银行' },
  { code: '601288', name: '农业银行' },
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
  { code: '601633', name: '长城汽车' },
  // 医药股
  { code: '000661', name: '长春高新' },
  { code: '300015', name: '爱尔眼科' },
  { code: '002821', name: '凯莱英' },
  // 消费股
  { code: '000895', name: '双汇发展' },
  { code: '600779', name: '水井坊' },
  // 电子股
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
  { code: '002129', name: '中环股份' },
  { code: '601012', name: '隆基绿能' },
  { code: '300274', name: '阳光电源' }
]

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
      loading: false,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString()
    }
  } catch (err) {
    console.error('获取股票数据失败:', err)
    throw new Error(`无法获取 ${symbol} 的股票数据`)
  }
}

// 批量获取所有股票数据
const fetchAllStocks = async () => {
  loading.value = true
  error.value = ''
  
  try {
    // 提取股票代码
    const stockCodes = aStockList.map(stock => stock.code)
    
    // 使用iTick API批量获取数据
    const results = await iTickService.getBatchStockQuotes(stockCodes)
    
    // 将结果映射回原始格式
    stocks.value = aStockList.map(stock => {
      const apiData = results.find(result => result && result.code === stock.code)
      
      if (apiData) {
        return {
          symbol: stock.code,
          companyName: apiData.name || stock.name,
          price: apiData.current.toFixed(2),
          change: apiData.change,
          changePercent: apiData.changePercent,
          open: apiData.open.toFixed(2),
          high: apiData.high.toFixed(2),
          low: apiData.low.toFixed(2),
          volume: apiData.volume,
          lastUpdated: new Date(),
          loading: false,
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString()
        }
      } else {
        // 如果没有获取到数据，返回默认值
        return {
          symbol: stock.code,
          companyName: stock.name,
          price: '0.00',
          change: 0,
          changePercent: 0,
          open: '0.00',
          high: '0.00',
          low: '0.00',
          volume: 0,
          lastUpdated: new Date(),
          loading: false,
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString()
        }
      }
    })
    
    lastUpdate.value = new Date()
    sortStocks()
  } catch (err) {
    error.value = '获取股票数据失败，请稍后重试'
    console.error('批量获取股票数据失败:', err)
  } finally {
    loading.value = false
  }
}

// 排序股票
const sortStocks = () => {
  // 触发响应式更新
}

// 计算排序后的股票列表
const sortedStocks = computed(() => {
  const validStocks = stocks.value.filter(stock => !stock.loading)
  
  return validStocks.sort((a, b) => {
    let aValue = a[sortBy.value]
    let bValue = b[sortBy.value]
    
    // 处理数值类型
    if (typeof aValue === 'string' && !isNaN(parseFloat(aValue))) {
      aValue = parseFloat(aValue)
    }
    if (typeof bValue === 'string' && !isNaN(parseFloat(bValue))) {
      bValue = parseFloat(bValue)
    }
    
    if (sortOrder.value === 'desc') {
      return bValue - aValue
    } else {
      return aValue - bValue
    }
  })
})

// 切换排序顺序
const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc'
}

// 刷新数据
const refreshData = () => {
  fetchAllStocks()
}

// 查看股票详情
const viewStockDetail = (symbol) => {
  emit('view-detail', symbol)
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

// 格式化时间
const formatTime = (date) => {
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

onMounted(() => {
  fetchAllStocks()
})
</script>

<style scoped>
.stock-ranking {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  text-align: center;
  margin-bottom: 30px;
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
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  backdrop-filter: blur(10px);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.refresh-section {
  display: flex;
  align-items: center;
  gap: 15px;
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

.last-update {
  font-size: 14px;
  color: #666;
}

.sort-options {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sort-options label {
  font-weight: 600;
  color: #333;
}

.sort-options select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
}

.sort-order-btn {
  padding: 8px 12px;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.sort-order-btn:hover {
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

.ranking-list {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  backdrop-filter: blur(10px);
}

.list-header {
  display: grid;
  grid-template-columns: 60px 200px 100px 100px 100px 120px;
  gap: 15px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  font-weight: 600;
  align-items: center;
}

.stock-row {
  display: grid;
  grid-template-columns: 60px 200px 100px 100px 100px 120px;
  gap: 15px;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: all 0.2s ease;
  align-items: center;
  position: relative;
}

.stock-row:hover {
  background: #f8f9fa;
  transform: translateX(5px);
}

.stock-row.positive {
  border-left: 4px solid #28a745;
}

.stock-row.negative {
  border-left: 4px solid #dc3545;
}

.rank {
  font-weight: bold;
  color: #666;
  text-align: center;
}

.stock-info {
  display: flex;
  flex-direction: column;
}

.stock-code {
  font-weight: bold;
  color: #333;
  font-size: 16px;
}

.stock-name {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
}

.price {
  font-weight: bold;
  color: #333;
  text-align: right;
}

.change, .change-percent {
  font-weight: 600;
  text-align: right;
}

.change.positive, .change-percent.positive {
  color: #28a745;
}

.change.negative, .change-percent.negative {
  color: #dc3545;
}

.volume {
  text-align: right;
  color: #666;
}

.row-loading {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
}

.mini-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@media (max-width: 768px) {
  .stock-ranking {
    padding: 15px;
  }
  
  .header h1 {
    font-size: 2rem;
  }
  
  .controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .list-header, .stock-row {
    grid-template-columns: 40px 150px 80px 80px 80px 100px;
    gap: 10px;
    padding: 10px 15px;
  }
  
  .stock-code {
    font-size: 14px;
  }
  
  .stock-name {
    font-size: 10px;
  }
}
</style>