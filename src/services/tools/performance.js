import os from 'os'
import { performance } from 'perf_hooks'

export class PerformanceTool {
    constructor() {
        this.responseTimings = new Map()
        this.errorCounts = new Map()
        this.startTime = Date.now()
    }

    startTracking(messageId) {
        this.responseTimings.set(messageId, performance.now())
    }

    endTracking(messageId) {
        const startTime = this.responseTimings.get(messageId)
        if (startTime) {
            const duration = performance.now() - startTime
            this.responseTimings.delete(messageId)
            return duration
        }
        return null
    }

    recordError(type) {
        const count = this.errorCounts.get(type) || 0
        this.errorCounts.set(type, count + 1)
    }

    getSystemStats() {
        const uptime = process.uptime()
        const memoryUsage = process.memoryUsage()
        const cpuUsage = process.cpuUsage()

        return {
            uptime: uptime,
            memory: {
                heapUsed: memoryUsage.heapUsed,
                heapTotal: memoryUsage.heapTotal,
                rss: memoryUsage.rss
            },
            cpu: {
                user: cpuUsage.user,
                system: cpuUsage.system
            },
            system: {
                totalMem: os.totalmem(),
                freeMem: os.freemem(),
                loadAvg: os.loadavg()
            }
        }
    }

    getMetrics() {
        const stats = this.getSystemStats()

        return {
            status: 'operational',
            uptime: stats.uptime,
            memoryUsage: Math.round((stats.memory.heapUsed / stats.memory.heapTotal) * 100),
            systemLoad: stats.system.loadAvg[0], // 1 minute load average
            errorRate: this.calculateErrorRate(),
            responseTime: this.calculateAverageResponseTime()
        }
    }

    calculateErrorRate() {
        const totalErrors = Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0)
        const timeRunning = (Date.now() - this.startTime) / 1000 // Convert to seconds
        return (totalErrors / timeRunning) * 100
    }

    calculateAverageResponseTime() {
        const timings = Array.from(this.responseTimings.values())
        if (timings.length === 0) {
            return 0
        }
        return timings.reduce((sum, time) => sum + time, 0) / timings.length
    }

    formatMetricsReport() {
        const metrics = this.getMetrics()

        return `**Thing Talk Performance Report**\n\n- Uptime: ${this.formatUptime(metrics.uptime)}\n- Memory Usage: ${metrics.memoryUsage}%\n- System Load: ${metrics.systemLoad.toFixed(2)}\n- Error Rate: ${metrics.errorRate.toFixed(2)}%\n- Avg Response Time: ${metrics.responseTime.toFixed(2)}ms\n\n${this.getHealthAdvice(metrics)}`
    }

    formatUptime(seconds) {
        const days = Math.floor(seconds / (24 * 60 * 60))
        const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60))
        const minutes = Math.floor((seconds % (60 * 60)) / 60)

        const parts = []
        if (days > 0) {
            parts.push(`${days}d`)
        }
        if (hours > 0) {
            parts.push(`${hours}h`)
        }
        if (minutes > 0) {
            parts.push(`${minutes}m`)
        }

        return parts.join(' ') || '< 1m'
    }

    getHealthAdvice(metrics) {
        const advice = []

        if (metrics.memoryUsage > 90) {
            advice.push('⚠️ Memory usage is high - consider restarting')
        }
        if (metrics.systemLoad > 5) {
            advice.push('⚠️ System load is high - check for resource-intensive tasks')
        }
        if (metrics.errorRate > 5) {
            advice.push('⚠️ Error rate is above normal - check logs for issues')
        }

        return advice.length ? '\n**Health Advice:**\n' + advice.join('\n') : ''
    }
}
