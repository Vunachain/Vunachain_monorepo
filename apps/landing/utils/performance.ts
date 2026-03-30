/**
 * VunaStack Performance Monitoring
 * 
 * Task 3: Core Web Vitals tracking with automatic logging to GTM dataLayer.
 * 
 * This module uses the `web-vitals` library to measure:
 * - LCP (Largest Contentful Paint)
 * - INP (Interaction to Next Paint)
 * - FID (First Input Delay)
 * - CLS (Cumulative Layout Shift)
 * 
 * Special Focus: "Rural Latency" Check
 * - Pushes a Core_Vitals_Log event if LCP > 2.5s
 * - Captures connection type to identify "Safaricom 4G" latency issues
 * 
 * @module performance
 */

import { onLCP, onINP, onCLS, Metric } from 'web-vitals';

// Extend Window interface for dataLayer and connection API
declare global {
    interface Window {
        dataLayer: any[];
    }

    interface Navigator {
        connection?: {
            effectiveType?: string;
            downlink?: number;
            rtt?: number;
            saveData?: boolean;
        };
    }
}

/**
 * Interface for Core Web Vitals log events
 */
interface CoreVitalsLogEvent {
    event: 'Core_Vitals_Log';
    metric_name: string;          // LCP, INP, or CLS
    metric_value: number;         // Actual value
    metric_rating: string;        // "good", "needs-improvement", or "poor"
    connection_type: string;      // e.g., "4g", "3g", "slow-2g", "unknown"
    downlink_speed?: number;      // Mbps (if available)
    rtt?: number;                 // Round-trip time in ms (if available)
    timestamp: number;            // Unix timestamp
}

/**
 * LCP Threshold in milliseconds
 * - Good: <= 2500ms
 * - Needs Improvement: <= 4000ms
 * - Poor: > 4000ms
 */
const LCP_THRESHOLD = 2500;

/**
 * Get the user's connection type for rural latency analysis
 * @returns Connection type string (e.g., "4g", "3g", "slow-2g", "unknown")
 */
function getConnectionType(): string {
    if (navigator.connection && navigator.connection.effectiveType) {
        return navigator.connection.effectiveType;
    }
    return 'unknown';
}

/**
 * Get additional connection metadata
 * @returns Object with downlink and RTT if available
 */
function getConnectionMetadata(): { downlink?: number; rtt?: number } {
    if (navigator.connection) {
        return {
            downlink: navigator.connection.downlink,
            rtt: navigator.connection.rtt,
        };
    }
    return {};
}

/**
 * Push Core Web Vitals to GTM dataLayer
 * @param metric - The web-vitals Metric object
 * @param forceLog - Force logging even if threshold not exceeded (for debugging)
 */
function logCoreVitals(metric: Metric, forceLog: boolean = false): void {
    const { name, value, rating } = metric;

    // For LCP, only log if it exceeds the threshold (or if forced)
    if (name === 'LCP' && value <= LCP_THRESHOLD && !forceLog) {
        console.log(`[VunaStack Performance] LCP is good (${value.toFixed(0)}ms). Not logging to dataLayer.`);
        return;
    }

    const connectionType = getConnectionType();
    const connectionMetadata = getConnectionMetadata();

    const event: CoreVitalsLogEvent = {
        event: 'Core_Vitals_Log',
        metric_name: name,
        metric_value: parseFloat(value.toFixed(2)),
        metric_rating: rating,
        connection_type: connectionType,
        ...connectionMetadata,
        timestamp: Date.now(),
    };

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(event);

    // Enhanced logging for LCP issues
    if (name === 'LCP' && value > LCP_THRESHOLD) {
        console.warn(
            `[VunaStack Performance] ⚠️ LCP THRESHOLD EXCEEDED: ${value.toFixed(0)}ms (threshold: ${LCP_THRESHOLD}ms)\n` +
            `Connection Type: ${connectionType}\n` +
            `Downlink: ${connectionMetadata.downlink || 'N/A'} Mbps\n` +
            `RTT: ${connectionMetadata.rtt || 'N/A'} ms\n` +
            `Rating: ${rating}`
        );
    } else {
        console.log(`[VunaStack Performance] ${name}:`, event);
    }
}

/**
 * Initialize Core Web Vitals monitoring
 * 
 * Task 3: Lightweight script to measure LCP and INP
 * - Configures automatic logging when LCP > 2.5s
 * - Tags events with connection type for "Safaricom 4G" analysis
 * 
 * Call this function once on app initialization (e.g., in App.tsx useEffect)
 */
export function initPerformanceMonitoring(): void {
    console.log('[VunaStack Performance] Initializing Core Web Vitals monitoring...');

    // Monitor LCP (Largest Contentful Paint)
    onLCP((metric) => {
        logCoreVitals(metric);
    });

    // Monitor INP (Interaction to Next Paint)
    onINP((metric) => {
        // Always log INP as it's critical for user interaction responsiveness
        logCoreVitals(metric, true);
    });


    // Monitor CLS (Cumulative Layout Shift)
    onCLS((metric) => {
        // Only log if CLS is poor (> 0.1)
        if (metric.value > 0.1) {
            logCoreVitals(metric, true);
        }
    });

    console.log('[VunaStack Performance] Core Web Vitals monitoring active.');
}

/**
 * Manual performance mark utility
 * Use this to create custom performance marks for specific interactions
 * 
 * Example:
 * markPerformance('roi_calculator_rendered');
 * 
 * @param markName - Name of the performance mark
 */
export function markPerformance(markName: string): void {
    if (performance && performance.mark) {
        performance.mark(markName);
        console.log(`[VunaStack Performance] Mark created: ${markName}`);
    }
}

/**
 * Measure time between two performance marks
 * @param measureName - Name for this measurement
 * @param startMark - Starting mark name
 * @param endMark - Ending mark name (optional, defaults to now)
 */
export function measurePerformance(
    measureName: string,
    startMark: string,
    endMark?: string
): void {
    if (performance && performance.measure) {
        try {
            const measure = endMark
                ? performance.measure(measureName, startMark, endMark)
                : performance.measure(measureName, startMark);

            console.log(`[VunaStack Performance] ${measureName}: ${measure.duration.toFixed(2)}ms`);

            // Push to dataLayer for GTM
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({
                event: 'Custom_Performance_Measure',
                measure_name: measureName,
                duration_ms: parseFloat(measure.duration.toFixed(2)),
                timestamp: Date.now(),
            });
        } catch (error) {
            console.error(`[VunaStack Performance] Failed to measure ${measureName}:`, error);
        }
    }
}
