<template>
  <div id="app">
    <!-- 导航菜单 -->
    <nav class="main-nav">
      <div class="nav-container">
        <h1 class="nav-title">📈 A股实时监控系统</h1>
        <div class="nav-buttons">
          <button 
            @click="currentView = 'ranking'" 
            :class="{ active: currentView === 'ranking' }"
            class="nav-btn"
          >
            📊 涨幅排行榜
          </button>
          <button 
            @click="currentView = 'tracker'" 
            :class="{ active: currentView === 'tracker' }"
            class="nav-btn"
          >
            📈 股票监控
          </button>
          <button 
            @click="currentView = 'chart'" 
            :class="{ active: currentView === 'chart' }"
            class="nav-btn"
          >
            📊 K线图
          </button>
          <button 
            @click="currentView = 'test'" 
            :class="{ active: currentView === 'test' }"
            class="nav-btn"
          >
            🔧 API测试
          </button>
        </div>
      </div>
    </nav>

    <!-- 主要内容区域 -->
    <main class="main-content">
      <!-- 股票排行榜 -->
      <StockRanking 
        v-if="currentView === 'ranking'"
        @view-detail="viewStockDetail"
      />
      
      <!-- 股票详情页 -->
      <StockDetail 
        v-if="currentView === 'detail'"
        :stock-symbol="selectedStock"
        @go-back="goBackToRanking"
      />
      
      <!-- 原有的股票监控 -->
      <StockTracker 
        v-if="currentView === 'tracker'"
      />
      
      <!-- K线图 -->
      <div v-if="currentView === 'chart'" class="chart-view">
        <div class="chart-controls">
          <div class="stock-input">
            <label for="stockCode">股票代码:</label>
            <input 
              id="stockCode"
              v-model="chartStock" 
              type="text" 
              placeholder="请输入6位股票代码"
              maxlength="6"
              @input="validateStockCode"
            />
            <div class="popular-stocks">
              <span>热门股票:</span>
              <button 
                v-for="stock in popularStocks" 
                :key="stock.code"
                @click="chartStock = stock.code"
                class="stock-btn"
              >
                {{ stock.name }}({{ stock.code }})
              </button>
            </div>
          </div>
        </div>
        <StockChart 
          v-if="chartStock && chartStock.length === 6"
          :stock-symbol="chartStock"
        />
        <div v-else class="chart-placeholder">
          <p>请输入正确的6位股票代码查看K线图</p>
        </div>
      </div>
      
      <!-- API测试 -->
      <div v-if="currentView === 'test'">
        <ApiTest />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import StockRanking from './components/StockRanking.vue'
import StockDetail from './components/StockDetail.vue'
import StockTracker from './components/StockTracker.vue'
import StockChart from './components/StockChart.vue'
import ApiTest from './components/ApiTest.vue'

const currentView = ref('ranking') // 默认显示排行榜
const selectedStock = ref('')
const chartStock = ref('000001') // 默认显示平安银行K线图

// 热门股票列表
const popularStocks = ref([
  { name: '平安银行', code: '000001' },
  { name: '万科A', code: '000002' },
  { name: '中国平安', code: '601318' },
  { name: '贵州茅台', code: '600519' },
  { name: '招商银行', code: '600036' },
  { name: '五粮液', code: '000858' },
  { name: '比亚迪', code: '002594' },
  { name: '宁德时代', code: '300750' }
])

// 验证股票代码
const validateStockCode = (event) => {
  const value = event.target.value
  // 只允许输入数字
  event.target.value = value.replace(/[^0-9]/g, '')
  chartStock.value = event.target.value
}

// 查看股票详情
const viewStockDetail = (stockSymbol) => {
  selectedStock.value = stockSymbol
  currentView.value = 'detail'
}

// 返回排行榜
const goBackToRanking = () => {
  currentView.value = 'ranking'
  selectedStock.value = ''
}
</script>

<style scoped>
#app {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.main-nav {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.nav-title {
  font-size: 1.8rem;
  color: #333;
  margin: 0;
  font-weight: 700;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
}

.nav-buttons {
  display: flex;
  gap: 15px;
}

.nav-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 25px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f8f9fa;
  color: #666;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.nav-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  background: #e9ecef;
}

.nav-btn.active {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
}

.nav-btn.active:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.main-content {
  min-height: calc(100vh - 80px);
  padding: 0;
}

/* K线图相关样式 */
.chart-view {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.chart-controls {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.stock-input {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.stock-input label {
  font-weight: 600;
  color: #333;
  font-size: 16px;
}

.stock-input input {
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s ease;
  max-width: 300px;
}

.stock-input input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.popular-stocks {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.popular-stocks span {
  font-weight: 600;
  color: #666;
  margin-right: 10px;
}

.stock-btn {
  padding: 8px 16px;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  color: #495057;
}

.stock-btn:hover {
  background: #e9ecef;
  border-color: #adb5bd;
  transform: translateY(-1px);
}

.chart-placeholder {
  background: white;
  border-radius: 8px;
  padding: 60px 20px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.chart-placeholder p {
  font-size: 18px;
  color: #666;
  margin: 0;
}

@media (max-width: 768px) {
  .nav-container {
    flex-direction: column;
    text-align: center;
    padding: 15px;
  }
  
  .nav-title {
    font-size: 1.5rem;
  }
  
  .nav-buttons {
    flex-direction: column;
    width: 100%;
  }
  
  .nav-btn {
    width: 100%;
    padding: 15px;
  }
  
  .chart-view {
    padding: 10px;
  }
  
  .popular-stocks {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .stock-btn {
    width: 100%;
    text-align: center;
  }
}
</style>