'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// Autodesk Viewer types
declare global {
  interface Window {
    Autodesk: {
      Viewing: {
        Initializer: (
          options: { env: string; accessToken: string },
          callback: () => void
        ) => void;
        GuiViewer3D: new (container: HTMLElement) => AutodeskViewer3D;
        Document: {
          load: (
            urn: string,
            onSuccess: (doc: AutodeskDocument) => void,
            onError: (errorCode: number, errorMsg: string) => void
          ) => void;
        };
        GEOMETRY_LOADED_EVENT: string;
      };
    };
  }
}

interface AutodeskViewer3D {
  start: () => void;
  finish: () => void;
  loadDocumentNode: (doc: AutodeskDocument, node: AutodeskBubbleNode) => Promise<void>;
  addEventListener: (event: string, callback: () => void) => void;
  removeEventListener: (event: string, callback: () => void) => void;
}

interface AutodeskDocument {
  getRoot: () => AutodeskBubbleNode;
}

interface AutodeskBubbleNode {
  getDefaultGeometry: () => AutodeskBubbleNode;
}

interface AutodeskViewerProps {
  urn: string;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
}

// Autodesk recommends using 7.* to get latest stable viewer in the 7.x line
const VIEWER_SCRIPT_URL = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.min.js';
const VIEWER_STYLE_URL = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/style.min.css';

// Token endpoint - uses Next.js API route by default, can be overridden via environment variable
const TOKEN_ENDPOINT = process.env.NEXT_PUBLIC_APS_TOKEN_ENDPOINT || '/api/aps/token';

// Ghost Mode Component - Spinning Wireframe Cube
function GhostMode(): JSX.Element {
  return (
    <div className="aspect-square bg-muted rounded-lg overflow-hidden flex flex-col items-center justify-center">
      <div className="wireframe-cube-container mb-6">
        <div className="wireframe-cube">
          <div className="face front"></div>
          <div className="face back"></div>
          <div className="face left"></div>
          <div className="face right"></div>
          <div className="face top"></div>
          <div className="face bottom"></div>
        </div>
      </div>
      <p className="text-muted-foreground text-lg font-medium">No 3D Model Available</p>
      <p className="text-muted-foreground/70 text-sm mt-2">Contact supplier for 3D specifications</p>
      
      <style jsx>{`
        .wireframe-cube-container {
          perspective: 800px;
          width: 120px;
          height: 120px;
        }
        
        .wireframe-cube {
          width: 100%;
          height: 100%;
          position: relative;
          transform-style: preserve-3d;
          animation: rotateCube 8s infinite linear;
        }
        
        @keyframes rotateCube {
          0% {
            transform: rotateX(-20deg) rotateY(0deg);
          }
          100% {
            transform: rotateX(-20deg) rotateY(360deg);
          }
        }
        
        .face {
          position: absolute;
          width: 100%;
          height: 100%;
          border: 2px solid hsl(var(--primary) / 0.6);
          background: transparent;
          box-sizing: border-box;
        }
        
        .front {
          transform: translateZ(60px);
        }
        
        .back {
          transform: rotateY(180deg) translateZ(60px);
        }
        
        .left {
          transform: rotateY(-90deg) translateZ(60px);
        }
        
        .right {
          transform: rotateY(90deg) translateZ(60px);
        }
        
        .top {
          transform: rotateX(90deg) translateZ(60px);
        }
        
        .bottom {
          transform: rotateX(-90deg) translateZ(60px);
        }
      `}</style>
    </div>
  );
}

// Loading State Component
function LoadingState(): JSX.Element {
  return (
    <div className="aspect-square bg-muted rounded-lg overflow-hidden flex flex-col items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
      <p className="text-muted-foreground">Loading 3D Viewer...</p>
    </div>
  );
}

// Error State Component
function ErrorState({ message }: { message: string }): JSX.Element {
  return (
    <div className="aspect-square bg-muted rounded-lg overflow-hidden flex flex-col items-center justify-center p-6">
      <div className="text-destructive mb-4">
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <p className="text-foreground font-medium mb-2">Unable to Load 3D Model</p>
      <p className="text-muted-foreground text-sm text-center">{message}</p>
    </div>
  );
}

// Load viewer script dynamically
function loadViewerScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.Autodesk?.Viewing) {
      resolve();
      return;
    }

    // Load CSS
    const existingLink = document.querySelector(`link[href*="viewer3D"]`);
    if (!existingLink) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = VIEWER_STYLE_URL;
      document.head.appendChild(link);
    }

    // Load Script
    const existingScript = document.querySelector(`script[src*="viewer3D"]`);
    if (existingScript) {
      // Script tag exists, wait for load
      if (window.Autodesk?.Viewing) {
        resolve();
      } else {
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', () => reject(new Error('Failed to load viewer script')));
      }
      return;
    }

    const script = document.createElement('script');
    script.src = VIEWER_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Autodesk Viewer script'));
    document.head.appendChild(script);
  });
}

export default function AutodeskViewer({ urn }: AutodeskViewerProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<AutodeskViewer3D | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'ghost'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  // Handle ghost mode when no URN is provided
  useEffect(() => {
    if (!urn || urn.trim() === '') {
      setStatus('ghost');
    }
  }, [urn]);

  // Cleanup function
  const cleanupViewer = useCallback(() => {
    if (viewerRef.current) {
      viewerRef.current.finish();
      viewerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!urn || urn.trim() === '' || status === 'ghost') {
      return;
    }

    let isMounted = true;

    const initViewer = async (): Promise<void> => {
      try {
        setStatus('loading');

        // Fetch token from API endpoint (configurable via NEXT_PUBLIC_APS_TOKEN_ENDPOINT)
        const tokenResponse = await fetch(TOKEN_ENDPOINT);
        if (!tokenResponse.ok) {
          throw new Error('Failed to fetch viewer token');
        }
        const tokenData: TokenResponse = await tokenResponse.json();

        if (!isMounted) return;

        // Load viewer script
        await loadViewerScript();

        if (!isMounted || !containerRef.current) return;

        // Initialize viewer
        const Autodesk = window.Autodesk;
        
        await new Promise<void>((resolve, reject) => {
          Autodesk.Viewing.Initializer(
            {
              env: 'AutodeskProduction',
              accessToken: tokenData.access_token,
            },
            () => {
              if (isMounted) {
                resolve();
              } else {
                reject(new Error('Component unmounted during initialization'));
              }
            }
          );
        });

        if (!isMounted || !containerRef.current) return;

        // Create viewer instance
        const viewer = new Autodesk.Viewing.GuiViewer3D(containerRef.current);
        viewer.start();
        viewerRef.current = viewer;

        // Load document
        const documentId = `urn:${urn}`;
        
        await new Promise<void>((resolve, reject) => {
          Autodesk.Viewing.Document.load(
            documentId,
            async (doc: AutodeskDocument) => {
              try {
                const defaultGeometry = doc.getRoot().getDefaultGeometry();
                await viewer.loadDocumentNode(doc, defaultGeometry);
                
                // Wait for geometry to load
                const onGeometryLoaded = (): void => {
                  viewer.removeEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, onGeometryLoaded);
                  if (isMounted) {
                    setStatus('ready');
                  }
                  resolve();
                };
                
                viewer.addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, onGeometryLoaded);
              } catch (err) {
                reject(err);
              }
            },
            (errorCode: number, errorMsg: string) => {
              reject(new Error(`Document load failed: ${errorMsg} (code: ${errorCode})`));
            }
          );
        });

      } catch (err) {
        if (isMounted) {
          console.error('[AutodeskViewer] Error:', err);
          setStatus('error');
          setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred');
        }
      }
    };

    initViewer();

    // Cleanup on unmount or URN change
    return () => {
      isMounted = false;
      cleanupViewer();
    };
  }, [urn, status, cleanupViewer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupViewer();
    };
  }, [cleanupViewer]);

  // Render appropriate state
  if (status === 'ghost') {
    return <GhostMode />;
  }

  if (status === 'loading') {
    return <LoadingState />;
  }

  if (status === 'error') {
    return <ErrorState message={errorMessage} />;
  }

  return (
    <div 
      ref={containerRef} 
      className="aspect-square bg-muted rounded-lg overflow-hidden"
      style={{ position: 'relative' }}
    />
  );
}
