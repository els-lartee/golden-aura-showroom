import { useState, useEffect, useCallback } from 'react';

/**
 * Interface for jewellery data returned from the backend API.
 * The ar_model_url is the key field for AR functionality.
 */
export interface JewelleryARData {
  id: string;
  name: string;
  ar_model_url: string; // URL to the .glb 3D model file
  thumbnail_url?: string;
  category: string;
}

/**
 * AR Session state management
 */
export interface ARSessionState {
  isActive: boolean;
  modelUrl: string | null;
  productName: string | null;
  error: string | null;
  isLoading: boolean;
}

/**
 * Configuration for the AR hook
 */
interface UseARJewelleryConfig {
  apiBaseUrl?: string; // Base URL for the Django REST API
}

/**
 * Custom hook for managing AR jewellery try-on functionality.
 * Handles fetching AR model URLs from backend and managing AR session state.
 * 
 * Data Flow:
 * 1. Component calls fetchARData() or uses cached data
 * 2. Backend API returns ar_model_url for each product
 * 3. User clicks "Try in AR" → openARSession(modelUrl, productName)
 * 4. ARTryOn component renders with the model URL
 * 5. User exits → closeARSession()
 */
export const useARJewellery = (config?: UseARJewelleryConfig) => {
  // Default API base URL - replace with actual Django backend URL in production
  const apiBaseUrl = config?.apiBaseUrl || '/api';
  
  // State for AR model data from backend
  const [arData, setArData] = useState<Map<string, JewelleryARData>>(new Map());
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  
  // State for active AR session
  const [arSession, setArSession] = useState<ARSessionState>({
    isActive: false,
    modelUrl: null,
    productName: null,
    error: null,
    isLoading: false,
  });

  /**
   * Check if the browser supports WebAR features
   * Required: getUserMedia for camera access, HTTPS for security
   */
  const checkARSupport = useCallback((): { supported: boolean; reason?: string } => {
    // Check for camera access API
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return { 
        supported: false, 
        reason: 'Your browser does not support camera access. Please use a modern browser.' 
      };
    }

    // Check for HTTPS (required for camera access on most browsers)
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      return { 
        supported: false, 
        reason: 'AR requires a secure connection (HTTPS). Please access this site via HTTPS.' 
      };
    }

    return { supported: true };
  }, []);

  /**
   * Fetch AR jewellery data from the Django REST API.
   * Stores the ar_model_url for each product in state.
   * 
   * API Endpoint: GET /api/jewelry/
   * Expected Response: Array of JewelleryARData objects
   */
  const fetchARData = useCallback(async () => {
    setIsLoadingData(true);
    setDataError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/jewelry/`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch AR data: ${response.status}`);
      }

      const data: JewelleryARData[] = await response.json();
      
      // Store data in a Map for O(1) lookup by product ID
      const dataMap = new Map<string, JewelleryARData>();
      data.forEach(item => dataMap.set(item.id, item));
      
      setArData(dataMap);
    } catch (error) {
      // For development/demo: Use mock data if API is not available
      console.warn('AR API not available, using mock data for demo:', error);
      setDataError('Using demo mode - backend API not connected');
      
      // Mock AR model URLs for demonstration
      // In production, these would come from the Django backend
      const mockData = new Map<string, JewelleryARData>([
        ['1', { 
          id: '1', 
          name: 'Aurora Diamond Ring', 
          ar_model_url: 'https://raw.githubusercontent.com/AframeTry/gltf_models/main/ring_1.glb',
          category: 'Rings' 
        }],
        ['2', { 
          id: '2', 
          name: 'Celestial Pearl Necklace', 
          ar_model_url: 'https://raw.githubusercontent.com/AframeTry/gltf_models/main/necklace_1.glb',
          category: 'Necklaces' 
        }],
        ['3', { 
          id: '3', 
          name: 'Soleil Drop Earrings', 
          ar_model_url: 'https://raw.githubusercontent.com/AframeTry/gltf_models/main/earring_1.glb',
          category: 'Earrings' 
        }],
        ['4', { 
          id: '4', 
          name: 'Serpentine Gold Bracelet', 
          ar_model_url: 'https://raw.githubusercontent.com/AframeTry/gltf_models/main/bracelet_1.glb',
          category: 'Bracelets' 
        }],
      ]);
      setArData(mockData);
    } finally {
      setIsLoadingData(false);
    }
  }, [apiBaseUrl]);

  /**
   * Get the AR model URL for a specific product.
   * Returns null if the product doesn't have AR data.
   */
  const getARModelUrl = useCallback((productId: string): string | null => {
    const data = arData.get(productId);
    return data?.ar_model_url || null;
  }, [arData]);

  /**
   * Open the AR session with a specific 3D model.
   * Validates AR support and camera permissions before starting.
   */
  const openARSession = useCallback(async (modelUrl: string, productName: string) => {
    // Check AR support first
    const support = checkARSupport();
    if (!support.supported) {
      setArSession(prev => ({
        ...prev,
        error: support.reason || 'AR not supported',
      }));
      return;
    }

    setArSession({
      isActive: false,
      modelUrl,
      productName,
      error: null,
      isLoading: true,
    });

    try {
      // Request camera permission before opening AR view
      await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      
      setArSession({
        isActive: true,
        modelUrl,
        productName,
        error: null,
        isLoading: false,
      });
    } catch (error) {
      console.error('Camera permission denied:', error);
      setArSession({
        isActive: false,
        modelUrl: null,
        productName: null,
        error: 'Camera permission denied. Please allow camera access to use AR try-on.',
        isLoading: false,
      });
    }
  }, [checkARSupport]);

  /**
   * Close the active AR session and clean up resources.
   */
  const closeARSession = useCallback(() => {
    setArSession({
      isActive: false,
      modelUrl: null,
      productName: null,
      error: null,
      isLoading: false,
    });
  }, []);

  /**
   * Clear any AR errors
   */
  const clearError = useCallback(() => {
    setArSession(prev => ({ ...prev, error: null }));
    setDataError(null);
  }, []);

  // Fetch AR data on mount
  useEffect(() => {
    fetchARData();
  }, [fetchARData]);

  return {
    // AR Data from backend
    arData,
    isLoadingData,
    dataError,
    fetchARData,
    getARModelUrl,
    
    // AR Session management
    arSession,
    openARSession,
    closeARSession,
    
    // Utilities
    checkARSupport,
    clearError,
  };
};

export default useARJewellery;
