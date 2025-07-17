/**
 * iTick API 服务类
 * 提供A股实时行情数据获取功能
 */
import axios from 'axios'

class ITickService {
  constructor() {
    // 您的iTick API密钥
    this.apiKey = 'f9c98481da4244cbb958fc94dd254de6bec0f6005d654bf9961d4b80da28cf41'
    this.baseURL = 'https://api.itick.org'
    
    // 创建axios实例
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'accept': 'application/json',
        'token': this.apiKey
      }
    })
  }

  /**
   * 获取A股实时行情数据
   * @param {string} stockCode - 股票代码 (如: '000001', '600519')
   * @returns {Promise<Object>} 股票行情数据
   */
  async getStockQuote(stockCode) {
    try {
      const stockInfo = this.formatStockCode(stockCode)
      
      const response = await axios.get(`${this.baseURL}/stock/quote`, {
        params: {
          region: stockInfo.region,
          code: stockInfo.code
        },
        headers: {
          'Token': this.apiKey
        },
        timeout: 10000
      })

      if (response.data && response.data.code === 0) {
        return this.parseStockData(response.data.data, stockCode)
      } else {
        throw new Error(`API返回错误: ${response.data?.msg || '未知错误'}`)
      }
    } catch (error) {
      console.error(`获取股票 ${stockCode} 数据失败:`, error.message)
      throw error
    }
  }

  /**
   * 批量获取多只股票的实时行情
   * @param {Array<string>} stockCodes - 股票代码数组
   * @returns {Promise<Array>} 股票行情数据数组
   */
  async getBatchStockQuotes(stockCodes) {
    const promises = stockCodes.map(code => 
      this.getStockQuote(code).catch(error => {
        console.error(`获取股票 ${code} 失败:`, error.message)
        return null // 返回null而不是抛出错误，避免影响其他股票数据获取
      })
    )

    const results = await Promise.all(promises)
    return results.filter(result => result !== null) // 过滤掉失败的请求
  }

  /**
   * 获取股票K线数据
   * @param {string} stockCode - 股票代码
   * @param {string} kType - K线类型 (1:1分钟, 2:5分钟, 3:15分钟, 4:30分钟, 5:1小时, 6:2小时, 7:4小时, 8:日线, 9:周线, 10:月线)
   * @param {number} limit - 获取数量，默认100
   * @param {number} et - 截止时间戳，可选
   * @returns {Promise<Array>} K线数据数组
   */
  async getStockKline(stockCode, kType = '8', limit = 100, et = null) {
    try {
      const stockInfo = this.formatStockCode(stockCode)
      
      const params = {
        region: stockInfo.region,
        code: stockInfo.code,
        kType: kType,
        limit: limit
      }
      
      // 如果指定了截止时间，添加et参数
      if (et) {
        params.et = et
      }
      
      const response = await axios.get(`${this.baseURL}/stock/kline`, {
        params: params,
        headers: {
          'Token': this.apiKey
        },
        timeout: 10000
      })

      if (response.data && response.data.code === 0) {
        const klineData = response.data.data || []
        return klineData.map(item => ({
          timestamp: item.t,
          time: new Date(item.t).toLocaleString(),
          open: item.o,
          high: item.h,
          low: item.l,
          close: item.c,
          volume: item.v,
          turnover: item.tu
        }))
      } else {
        throw new Error(`API返回错误: ${response.data?.msg || '未知错误'}`)
      }
    } catch (error) {
      console.error(`获取股票 ${stockCode} K线数据失败:`, error.message)
      throw error
    }
  }

  /**
   * 格式化股票代码为iTick API格式
   * @param {string} stockCode - 原始股票代码
   * @returns {Object} 包含region和code的对象
   */
  formatStockCode(stockCode) {
    // 移除可能的前缀
    let cleanCode = stockCode.replace(/^(sh|sz)/i, '')
    
    // 确保是6位数字
    if (!/^\d{6}$/.test(cleanCode)) {
      throw new Error('股票代码必须是6位数字')
    }
    
    // 根据股票代码判断市场
    let region
    if (cleanCode.startsWith('6')) {
      region = 'SH' // 上海证券交易所
    } else if (cleanCode.startsWith('0') || cleanCode.startsWith('3')) {
      region = 'SZ' // 深圳证券交易所
    } else {
      region = 'SH' // 默认上海
    }
    
    return {
      region: region,
      code: cleanCode
    }
  }

  /**
   * 解析iTick API返回的股票数据
   * @param {Object} data - API返回的原始数据
   * @param {string} originalCode - 原始股票代码
   * @returns {Object} 格式化后的股票数据
   */
  parseStockData(data, originalCode) {
    if (!data) {
      throw new Error('无效的股票数据')
    }

    // 根据iTick API实际返回的数据格式解析
    const current = parseFloat(data.ld || 0) // ld是最新价
    const open = parseFloat(data.o || current) // o是开盘价
    const high = parseFloat(data.h || current) // h是最高价
    const low = parseFloat(data.l || current) // l是最低价
    const volume = parseFloat(data.v || 0) // v是成交量
    const turnover = parseFloat(data.tu || 0) // tu是成交额
    
    // 由于iTick API可能不直接提供昨收价，我们需要通过其他方式获取或估算
    // 这里暂时使用开盘价作为参考
    const prevClose = open > 0 ? open * 0.99 : current * 0.99 // 临时估算昨收价
    
    // 计算涨跌额和涨跌幅
    const change = current - prevClose
    const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0

    return {
      code: originalCode,
      name: data.name || data.stock_name || `股票${originalCode}`,
      current: current,
      open: open,
      high: high,
      low: low,
      volume: volume,
      change: change,
      changePercent: changePercent,
      prevClose: prevClose,
      turnover: turnover,
      timestamp: data.t || Date.now(),
      // 添加原始数据以备调试
      _raw: data
    }
  }

  /**
   * 获取股票详细信息（包含盘口数据）
   * @param {string} stockCode - 股票代码
   * @returns {Promise<Object>} 详细股票数据
   */
  async getStockDetail(stockCode) {
    try {
      // 获取基础行情数据
      const basicData = await this.getStockQuote(stockCode)
      
      // iTick API可能不提供完整的盘口数据，我们使用基础数据并模拟盘口
      const mockBidAskData = this.generateMockBidAsk(basicData.current)
      
      return {
        ...basicData,
        price: basicData.current,
        previousClose: basicData.prevClose,
        amount: basicData.volume * basicData.current, // 估算成交额
        ...mockBidAskData,
        turnoverRate: 0, // iTick免费版可能不提供
        pe: '--' // iTick免费版可能不提供
      }
    } catch (error) {
      console.error(`获取股票 ${stockCode} 详细数据失败:`, error.message)
      throw error
    }
  }

  /**
   * 生成模拟的买卖盘口数据
   * @param {number} currentPrice - 当前价格
   * @returns {Object} 模拟的盘口数据
   */
  generateMockBidAsk(currentPrice) {
    const basePrice = currentPrice
    const tickSize = 0.01 // A股最小价格变动单位
    
    return {
      // 买盘（低于当前价）
      bid1Price: basePrice - tickSize,
      bid1Volume: Math.floor(Math.random() * 1000) + 100,
      bid2Price: basePrice - tickSize * 2,
      bid2Volume: Math.floor(Math.random() * 1000) + 100,
      bid3Price: basePrice - tickSize * 3,
      bid3Volume: Math.floor(Math.random() * 1000) + 100,
      bid4Price: basePrice - tickSize * 4,
      bid4Volume: Math.floor(Math.random() * 1000) + 100,
      bid5Price: basePrice - tickSize * 5,
      bid5Volume: Math.floor(Math.random() * 1000) + 100,
      
      // 卖盘（高于当前价）
      ask1Price: basePrice + tickSize,
      ask1Volume: Math.floor(Math.random() * 1000) + 100,
      ask2Price: basePrice + tickSize * 2,
      ask2Volume: Math.floor(Math.random() * 1000) + 100,
      ask3Price: basePrice + tickSize * 3,
      ask3Volume: Math.floor(Math.random() * 1000) + 100,
      ask4Price: basePrice + tickSize * 4,
      ask4Volume: Math.floor(Math.random() * 1000) + 100,
      ask5Price: basePrice + tickSize * 5,
      ask5Volume: Math.floor(Math.random() * 1000) + 100
    }
  }

  /**
   * 检查API连接状态
   * @returns {Promise<boolean>} 连接是否正常
   */
  async checkConnection() {
    try {
      // 使用一个常见的股票代码测试连接
      await this.getStockQuote('000001')
      return true
    } catch (error) {
      console.error('iTick API连接检查失败:', error.message)
      return false
    }
  }
}

// 创建单例实例
const iTickService = new ITickService()

export default iTickService
export { ITickService }