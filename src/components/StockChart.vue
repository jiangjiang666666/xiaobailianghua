<template>
  <div class="stock-chart">
    <div class="chart-header">
      <h3>{{ stockSymbol }} K线图</h3>
      <div class="chart-controls">
        <select v-model="selectedPeriod" @change="fetchKlineData">
          <option value="1">1分钟</option>
          <option value="2">5分钟</option>
          <option value="3">15分钟</option>
          <option value="4">30分钟</option>
          <option value="5">1小时</option>
          <option value="8">日线</option>
          <option value="9">周线</option>
          <option value="10">月线</option>
        </select>
        <button @click="refreshData" :disabled="loading">刷新</button>
      </div>
    </div>
    
    <div class="chart-container" v-if="!loading">
      <canvas ref="chartCanvas" width="800" height="400"></canvas>
    </div>
    
    <div class="loading" v-if="loading">
      加载中...
    </div>
    
    <div class="error" v-if="error">
      {{ error }}
    </div>
    
    <div class="chart-info" v-if="klineData.length > 0">
      <div class="info-item">
        <span>最新价格:</span>
        <span :class="getPriceClass(latestPrice, previousClose)">{{ latestPrice }}</span>
      </div>
      <div class="info-item">
        <span>涨跌:</span>
        <span :class="getPriceClass(priceChange, 0)">{{ priceChange > 0 ? '+' : '' }}{{ priceChange.toFixed(2) }}</span>
      </div>
      <div class="info-item">
        <span>涨跌幅:</span>
        <span :class="getPriceClass(priceChangePercent, 0)">{{ priceChangePercent > 0 ? '+' : '' }}{{ priceChangePercent.toFixed(2) }}%</span>
      </div>
      <div class="info-item">
        <span>成交量:</span>
        <span>{{ formatVolume(latestVolume) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import iTickService from '../services/iTickService.js'

const props = defineProps({
  stockSymbol: {
    type: String,
    required: true
  }
})

const klineData = ref([])
const loading = ref(false)
const error = ref('')
const selectedPeriod = ref('8') // 默认日线
const chartCanvas = ref(null)

// 计算属性
const latestPrice = computed(() => {
  if (klineData.value.length === 0) return 0
  return klineData.value[klineData.value.length - 1].close
})

const previousClose = computed(() => {
  if (klineData.value.length < 2) return 0
  return klineData.value[klineData.value.length - 2].close
})

const priceChange = computed(() => {
  return latestPrice.value - previousClose.value
})

const priceChangePercent = computed(() => {
  if (previousClose.value === 0) return 0
  return (priceChange.value / previousClose.value) * 100
})

const latestVolume = computed(() => {
  if (klineData.value.length === 0) return 0
  return klineData.value[klineData.value.length - 1].volume
})

// 获取K线数据
const fetchKlineData = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const data = await iTickService.getStockKline(props.stockSymbol, selectedPeriod.value, 100)
    klineData.value = data
    drawChart()
  } catch (err) {
    error.value = `获取K线数据失败: ${err.message}`
    console.error('获取K线数据失败:', err)
  } finally {
    loading.value = false
  }
}

// 刷新数据
const refreshData = () => {
  fetchKlineData()
}

// 绘制K线图
const drawChart = () => {
  if (!chartCanvas.value || klineData.value.length === 0) return
  
  const canvas = chartCanvas.value
  const ctx = canvas.getContext('2d')
  const width = canvas.width
  const height = canvas.height
  
  // 清空画布
  ctx.clearRect(0, 0, width, height)
  
  // 计算价格范围
  const prices = klineData.value.flatMap(item => [item.high, item.low])
  const maxPrice = Math.max(...prices)
  const minPrice = Math.min(...prices)
  const priceRange = maxPrice - minPrice
  
  // 计算成交量范围
  const volumes = klineData.value.map(item => item.volume)
  const maxVolume = Math.max(...volumes)
  
  // 图表区域设置
  const chartTop = 40
  const chartBottom = height - 100
  const chartHeight = chartBottom - chartTop
  const volumeHeight = 80
  const volumeTop = chartBottom + 10
  
  const chartLeft = 60
  const chartRight = width - 60
  const chartWidth = chartRight - chartLeft
  
  const candleWidth = Math.max(2, chartWidth / klineData.value.length - 2)
  
  // 绘制背景网格
  ctx.strokeStyle = '#f0f0f0'
  ctx.lineWidth = 1
  
  // 水平网格线
  for (let i = 0; i <= 5; i++) {
    const y = chartTop + (chartHeight / 5) * i
    ctx.beginPath()
    ctx.moveTo(chartLeft, y)
    ctx.lineTo(chartRight, y)
    ctx.stroke()
    
    // 价格标签
    const price = maxPrice - (priceRange / 5) * i
    ctx.fillStyle = '#666'
    ctx.font = '12px Arial'
    ctx.textAlign = 'right'
    ctx.fillText(price.toFixed(2), chartLeft - 10, y + 4)
  }
  
  // 垂直网格线
  const timeStep = Math.max(1, Math.floor(klineData.value.length / 8))
  for (let i = 0; i < klineData.value.length; i += timeStep) {
    const x = chartLeft + (chartWidth / klineData.value.length) * i
    ctx.beginPath()
    ctx.moveTo(x, chartTop)
    ctx.lineTo(x, chartBottom)
    ctx.stroke()
    
    // 时间标签
    if (klineData.value[i]) {
      const timeLabel = new Date(klineData.value[i].timestamp).toLocaleDateString()
      ctx.fillStyle = '#666'
      ctx.font = '10px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(timeLabel, x, height - 20)
    }
  }
  
  // 绘制K线
  klineData.value.forEach((item, index) => {
    const x = chartLeft + (chartWidth / klineData.value.length) * index + candleWidth / 2
    
    // 计算价格对应的y坐标
    const openY = chartTop + ((maxPrice - item.open) / priceRange) * chartHeight
    const closeY = chartTop + ((maxPrice - item.close) / priceRange) * chartHeight
    const highY = chartTop + ((maxPrice - item.high) / priceRange) * chartHeight
    const lowY = chartTop + ((maxPrice - item.low) / priceRange) * chartHeight
    
    // 设置颜色（红涨绿跌）
    const isRising = item.close >= item.open
    ctx.strokeStyle = isRising ? '#ff4444' : '#00aa00'
    ctx.fillStyle = isRising ? '#ff4444' : '#00aa00'
    
    // 绘制影线
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x, highY)
    ctx.lineTo(x, lowY)
    ctx.stroke()
    
    // 绘制实体
    const bodyTop = Math.min(openY, closeY)
    const bodyHeight = Math.abs(closeY - openY)
    
    if (bodyHeight < 1) {
      // 十字星
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x - candleWidth / 2, openY)
      ctx.lineTo(x + candleWidth / 2, openY)
      ctx.stroke()
    } else {
      // 实体K线
      if (isRising) {
        ctx.strokeRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight)
      } else {
        ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight)
      }
    }
    
    // 绘制成交量
    const volumeBarHeight = (item.volume / maxVolume) * volumeHeight
    const volumeY = volumeTop + volumeHeight - volumeBarHeight
    
    ctx.fillStyle = isRising ? '#ff444440' : '#00aa0040'
    ctx.fillRect(x - candleWidth / 2, volumeY, candleWidth, volumeBarHeight)
  })
  
  // 绘制标题
  ctx.fillStyle = '#333'
  ctx.font = 'bold 16px Arial'
  ctx.textAlign = 'left'
  ctx.fillText(`${props.stockSymbol} K线图`, chartLeft, 25)
  
  // 成交量标题
  ctx.font = '12px Arial'
  ctx.fillText('成交量', chartLeft, volumeTop - 5)
}

// 格式化成交量
const formatVolume = (volume) => {
  if (volume >= 100000000) {
    return (volume / 100000000).toFixed(2) + '亿'
  } else if (volume >= 10000) {
    return (volume / 10000).toFixed(2) + '万'
  }
  return volume.toString()
}

// 获取价格颜色类
const getPriceClass = (current, previous) => {
  if (current > previous) return 'price-up'
  if (current < previous) return 'price-down'
  return 'price-neutral'
}

// 监听股票代码变化
watch(() => props.stockSymbol, () => {
  if (props.stockSymbol) {
    fetchKlineData()
  }
})

// 组件挂载时获取数据
onMounted(() => {
  if (props.stockSymbol) {
    fetchKlineData()
  }
})
</script>

<style scoped>
.stock-chart {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.chart-header h3 {
  margin: 0;
  color: #333;
}

.chart-controls {
  display: flex;
  gap: 10px;
  align-items: center;
}

.chart-controls select {
  padding: 5px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
}

.chart-controls button {
  padding: 5px 15px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.chart-controls button:hover:not(:disabled) {
  background: #0056b3;
}

.chart-controls button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.chart-container {
  text-align: center;
  margin: 20px 0;
}

.chart-container canvas {
  border: 1px solid #eee;
  border-radius: 4px;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}

.error {
  text-align: center;
  padding: 20px;
  color: #ff4444;
  background: #fff5f5;
  border: 1px solid #ffdddd;
  border-radius: 4px;
  margin: 10px 0;
}

.chart-info {
  display: flex;
  justify-content: space-around;
  margin-top: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 6px;
}

.info-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.info-item span:first-child {
  font-size: 12px;
  color: #666;
}

.info-item span:last-child {
  font-size: 16px;
  font-weight: bold;
}

.price-up {
  color: #ff4444;
}

.price-down {
  color: #00aa00;
}

.price-neutral {
  color: #333;
}
</style>