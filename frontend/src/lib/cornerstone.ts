import * as cornerstone from "cornerstone-core";
import * as cornerstoneWADOImageLoader from "cornerstone-wado-image-loader";
import * as dicomParser from "dicom-parser";
import { auth } from "./firebase";

// Configure WADO image loader
cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.dicomParser = dicomParser;

// Token cache to avoid async token retrieval in beforeSend
let tokenCache: { token: string; expiresAt: number } | null = null;
const TOKEN_CACHE_DURATION = 50 * 60 * 1000; // 50 minutes (tokens typically last 1 hour)

async function getAuthToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  
  // Return cached token if still valid
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.token;
  }
  
  try {
    const token = await user.getIdToken();
    // Cache the token with expiration
    tokenCache = {
      token,
      expiresAt: Date.now() + TOKEN_CACHE_DURATION,
    };
    return token;
  } catch (error) {
    console.error("Failed to get auth token:", error);
    return null;
  }
}

// Configure the image loader to include authentication headers
cornerstoneWADOImageLoader.configure({
  beforeSend: (xhr: XMLHttpRequest, imageId: string) => {
    // Use cached token synchronously - token should be pre-fetched in loadImage
    if (tokenCache && tokenCache.expiresAt > Date.now()) {
      try {
        xhr.setRequestHeader("Authorization", `Bearer ${tokenCache.token}`);
      } catch (error) {
        console.error("Failed to set auth header for WADO request:", error);
      }
    }
  },
});

// Initialize Cornerstone
let initialized = false;

export function initializeCornerstone(): void {
  if (initialized) {
    return;
  }

  // Initialize web worker manager first
  cornerstoneWADOImageLoader.webWorkerManager.initialize({
    maxWebWorkers: navigator.hardwareConcurrency || 4,
    startWebWorkersOnDemand: true,
    taskConfiguration: {
      decodeTask: {
        initializeCodecsOnStartup: false,
        usePDFJS: false,
        strict: false,
      },
    },
  });

  // Register WADO image loaders with Cornerstone
  // The register() methods may only register for wadouri:// and wadors:// schemes
  // We need to also register for http:// and https:// schemes for direct URLs
  try {
    let wadouriLoadImage: ((imageId: string) => Promise<any>) | null = null;
    
    // Check if registerLoaders function exists (preferred method)
    if (typeof cornerstoneWADOImageLoader.registerLoaders === 'function') {
      cornerstoneWADOImageLoader.registerLoaders(cornerstone);
      console.log("Registered WADO loaders using registerLoaders()");
      // Get the loadImage function for http/https registration
      if (cornerstoneWADOImageLoader.wadouri && cornerstoneWADOImageLoader.wadouri.loadImage) {
        wadouriLoadImage = cornerstoneWADOImageLoader.wadouri.loadImage;
      }
    } 
    // Try individual register methods
    else if (cornerstoneWADOImageLoader.wadouri && typeof cornerstoneWADOImageLoader.wadouri.register === 'function') {
      cornerstoneWADOImageLoader.wadouri.register(cornerstone);
      // Get the loadImage function for http/https registration
      wadouriLoadImage = cornerstoneWADOImageLoader.wadouri.loadImage;
      
      if (cornerstoneWADOImageLoader.wadors && typeof cornerstoneWADOImageLoader.wadors.register === 'function') {
        cornerstoneWADOImageLoader.wadors.register(cornerstone);
      }
      console.log("Registered WADO loaders using individual register() methods");
    } 
    // Fallback: manual registration
    else if (cornerstoneWADOImageLoader.wadouri && cornerstoneWADOImageLoader.wadouri.loadImage) {
      wadouriLoadImage = cornerstoneWADOImageLoader.wadouri.loadImage;
      cornerstone.registerImageLoader("wadouri", wadouriLoadImage);
      if (cornerstoneWADOImageLoader.wadors && cornerstoneWADOImageLoader.wadors.loadImage) {
        cornerstone.registerImageLoader("wadors", cornerstoneWADOImageLoader.wadors.loadImage);
      }
      console.log("Registered WADO loaders manually");
    } else {
      console.error("Could not find WADO image loaders in package");
      throw new Error("WADO image loaders not found in cornerstone-wado-image-loader package");
    }
    
    // IMPORTANT: Register http and https schemes explicitly
    // The register() methods typically only register wadouri:// and wadors:// schemes
    // We need http:// and https:// for direct URLs like http://localhost:8000/api/dicom/{id}/wado
    if (wadouriLoadImage) {
      cornerstone.registerImageLoader("http", wadouriLoadImage);
      cornerstone.registerImageLoader("https", wadouriLoadImage);
      console.log("Registered http and https schemes for WADO loader");
    }
  } catch (error) {
    console.error("Error registering WADO image loaders:", error);
    throw error;
  }

  initialized = true;
}

export async function loadImage(
  element: HTMLDivElement,
  imageId: string
): Promise<cornerstone.Image> {
  // Pre-fetch auth token before making the request
  // This ensures the token is available synchronously in beforeSend
  await getAuthToken();
  
  // Ensure Cornerstone is initialized
  initializeCornerstone();

  // Enable the element for Cornerstone
  cornerstone.enable(element);

  // Load and display the image
  const image = await cornerstone.loadImage(imageId);
  await cornerstone.displayImage(element, image);

  return image;
}

export function disableElement(element: HTMLDivElement): void {
  try {
    cornerstone.disable(element);
  } catch (error) {
    // Element might already be disabled, ignore error
    console.warn("Error disabling Cornerstone element:", error);
  }
}

export function resetViewport(element: HTMLDivElement): void {
  try {
    cornerstone.reset(element);
  } catch (error) {
    console.warn("Error resetting viewport:", error);
  }
}

export { cornerstone };
