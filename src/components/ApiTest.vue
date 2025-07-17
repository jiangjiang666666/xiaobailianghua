<template>
  <div class="api-test">
    <h2>iTick API 测试</h2>
    
    <div class="test-section">
      <h3>实时行情测试</h3>
      <button @click="testQuote" :disabled="loading">测试获取000001行情</button>
      <div v-if="quoteResult" class="result">
        <h4>行情数据:</h4>
        <pre>{{ JSON.stringify(quoteResult, null, 2) }}</pre>
      </div>
      <div v-if="quoteError" class="error">
        <h4>错误信息:</h4>
        <pre>{{ quoteError }}</pre>
      </div>
    </div>
    
    <div class="test-section">
      <h3>K线数据测试</h3>
      <button @click="testKline" :disabled="loading">测试获取000001日K线</button>
      <div v-if="klineResult" class="result">
        <h4>K线数据 (前3条):</h4>
        <pre>{{ JSON.stringify(klineResult.slice(0, 3), null, 2) }}</pre>
      </div>
      <div v-if="klineError" class="error">
        <h4>错误信息:</h4>
        <pre>{{ klineError }}</pre>
      </div>
    </div>
    
    <div class="test-section">
      <h3>原始API测试</h3>
      <button @click="testRawApi" :disabled="loading">直接测试API</button>
      <div v-if="rawResult" class="result">
        <h4>原始API响应:</h4>
        <pre>{{ JSON.stringify(rawResult, null, 2) }}</pre>
      </div>
      <div v-if="rawError" class="error">
        <h4>错误信息:</h4>
        <pre>{{ rawError }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import iTickService from '../services/iTickService.js'
import axios from 'axios'

const loading = ref(false)
const quoteResult = ref(null)
const quoteError = ref('')
const klineResult = ref(null)
const klineError = ref('')
const rawResult = ref(null)
const rawError = ref('')

const testQuote = async () => {
  loading.value = true
  quoteResult.value = null
  quoteError.value = ''
  
  try {
    const result = await iTickService.getStockQuote('000001')
    quoteResult.value = result
    console.log('行情测试成功:', result)
  } catch (error) {
    quoteError.value = error.message
    console.error('行情测试失败:', error)
  } finally {
    loading.value = false
  }
}

const testKline = async () => {
  loading.value = true
  klineResult.value = null
  klineError.value = ''
  
  try {
    const result = await iTickService.getStockKline('000001', '8', 10)
    klineResult.value = result
    console.log('K线测试成功:', result)
  } catch (error) {
    klineError.value = error.message
    console.error('K线测试失败:', error)
  } finally {
    loading.value = false
  }
}

const testRawApi = async () => {
  loading.value = true
  rawResult.value = null
  rawError.value = ''
  
  try {
    const response = await axios.get('https://api.itick.org/stock/quote', {
      params: {
        region: 'SH',
        code: '000001'
      },
      headers: {
        'Token': 'f9c98481da4244cbb958fc94dd254de6bec0f6005d654bf9961d4b80da28cf41'
      },
      timeout: 10000
    })
    rawResult.value = response.data
    console.log('原始API测试成功:', response.data)
  } catch (error) {
    rawError.value = error.message
    console.error('原始API测试失败:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.api-test {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.test-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 6px;
}

.test-section h3 {
  margin-top: 0;
  color: #333;
}

button {
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

button:hover:not(:disabled) {
  background: #0056b3;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.result {
  margin-top: 15px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 4px;
  border-left: 4px solid #28a745;
}

.error {
  margin-top: 15px;
  padding: 15px;
  background: #fff5f5;
  border-radius: 4px;
  border-left: 4px solid #dc3545;
}

.result h4,
.error h4 {
  margin-top: 0;
  margin-bottom: 10px;
}

pre {
  background: white;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #ddd;
  overflow-x: auto;
  font-size: 12px;
  line-height: 1.4;
}
</style>