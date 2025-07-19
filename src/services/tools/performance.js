import os from 'os'
import { performance } from 'perf_hooks'

/**
 * Performance measurement utility for tracking execution time and metrics
 */
export class PerformanceTool {
    constructor() {
        this.startTimes = new Map()
        this.metrics = {
            totalCalls: 0,
            errors: 0,
            averageDuration: 0,
            totalDuration: 0
        }
    }

    /**
     * Start tracking execution time for a specific ID
     * @param {string} id - Unique identifier for this tracking instance
     * @returns {number} Current timestamp in milliseconds
     */
    startTracking(id) {
        const start = performance.now()
        this.startTimes.set(id, start)
        return start
    }

    /**
     * Check if tracking is active for a specific ID
     * @param {string} id - Unique identifier for the tracking instance
     * @returns {boolean} Whether tracking is active for this ID
     */
    isTracking(id) {
        return this.startTimes.has(id)
    }

    /**
     * End tracking and return the duration
     * @param {string} id - Unique identifier for the tracking instance
     * @returns {number|null} Duration in milliseconds or null if tracking wasn't started
     */
    endTracking(id) {
        if (!this.startTimes.has(id)) {
            return null
        }

        const end = performance.now()
        const start = this.startTimes.get(id)
        const duration = end - start

        // Update metrics
        this.metrics.totalCalls++
        this.metrics.totalDuration += duration
        this.metrics.averageDuration = this.metrics.totalDuration / this.metrics.totalCalls

        // Clean up
        this.startTimes.delete(id)

        return duration
    }

    /**
     * Record an error occurrence
     * @param {string} type - Type of error
     * @returns {number} Total error count
     */
    recordError(type) {
        this.metrics.errors++
        return this.metrics.errors
    }

    /**
     * Get performance metrics
     * @returns {Object} Performance metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            activeTracking: this.startTimes.size,
            timestamp: new Date().toISOString()
        }
    }

    /**
     * Reset metrics
     */
    resetMetrics() {
        this.metrics = {
            totalCalls: 0,
            errors: 0,
            averageDuration: 0,
            totalDuration: 0
        }
    }
}
