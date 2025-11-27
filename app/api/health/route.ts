import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  database: 'connected' | 'disconnected' | 'unknown';
  version: string;
  uptime: number;
}

// Prevent caching of health checks
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Health check endpoint for production monitoring.
 * Returns system status including database connectivity.
 * 
 * @returns JSON response with health status
 */
export async function GET(): Promise<NextResponse<HealthResponse>> {
  const startTime = Date.now();
  
  let dbStatus: 'connected' | 'disconnected' | 'unknown' = 'unknown';
  let overallStatus: 'ok' | 'degraded' | 'error' = 'ok';
  
  // Check database connectivity
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      dbStatus = 'disconnected';
      overallStatus = 'degraded';
    } else {
      // Check if mongoose is already connected
      if (mongoose.connection.readyState === 1) {
        // Already connected - perform lightweight ping
        const db = mongoose.connection.db;
        if (db) {
          await Promise.race([
            db.admin().ping(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Database ping timeout')), 3000)
            )
          ]);
          dbStatus = 'connected';
        } else {
          dbStatus = 'disconnected';
          overallStatus = 'degraded';
        }
      } else {
        // Not connected - attempt quick connection with timeout
        try {
          await Promise.race([
            mongoose.connect(mongoUri, {
              serverSelectionTimeoutMS: 3000,
              socketTimeoutMS: 3000,
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Connection timeout')), 3000)
            )
          ]);
          
          const db = mongoose.connection.db;
          if (db) {
            await db.admin().ping();
            dbStatus = 'connected';
          } else {
            dbStatus = 'disconnected';
            overallStatus = 'degraded';
          }
        } catch {
          dbStatus = 'disconnected';
          overallStatus = 'degraded';
        }
      }
    }
  } catch {
    dbStatus = 'disconnected';
    overallStatus = 'degraded';
  }

  // Get app version from environment or use default
  const version = process.env.npm_package_version || '1.0.0';

  const response: HealthResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    database: dbStatus,
    version,
    uptime: Math.floor(process.uptime()),
  };

  // Set appropriate HTTP status based on health
  const httpStatus = overallStatus === 'ok' ? 200 : 503;

  return NextResponse.json(response, {
    status: httpStatus,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Response-Time': `${Date.now() - startTime}ms`,
    },
  });
}
