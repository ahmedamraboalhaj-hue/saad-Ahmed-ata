/**
 * Face-API logic for Biometric Authentication
 * Handles model loading, camera access, and face descriptor extraction.
 */

// Import face-api.js from CDN (it puts 'faceapi' in global scope)
// In a module system, you might need to import it differently, 
// but for static pages, we'll assume it's loaded in the HTML or imported here.

const MODEL_URL = './models'; // Folder where model files (weights/manifests) are stored

/**
 * Load all necessary models for face recognition
 */
export async function loadFaceModels() {
    try {
        console.log("Loading Face-API models...");
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        console.log("Models loaded successfully.");
        return true;
    } catch (err) {
        console.error("Error loading models:", err);
        return false;
    }
}

/**
 * Start the webcam and stream to a video element
 * @param {HTMLVideoElement} videoElement 
 */
export async function startVideo(videoElement) {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
        videoElement.srcObject = stream;
        return stream;
    } catch (err) {
        console.error("Camera access denied:", err);
        throw new Error("لم يتم العثور على كاميرا أو تم رفض الوصول.");
    }
}

/**
 * Capture face and return the 128-float descriptor array
 * @param {HTMLVideoElement} videoElement 
 */
export async function getFaceDescriptor(videoElement) {
    const detection = await faceapi.detectSingleFace(
        videoElement, 
        new faceapi.TinyFaceDetectorOptions()
    ).withFaceLandmarks().withFaceDescriptor();

    if (!detection) {
        throw new Error("لم يتم اكتشاف وجه. يرجى التأكد من الإضاءة والوقوف أمام الكاميرا.");
    }

    // Convert Float32Array to regular Array for Firebase storage
    return Array.from(detection.descriptor);
}

/**
 * Compare a current face descriptor with a stored list
 * @param {Array} currentDescriptor 
 * @param {Array} storedUsers [{ officeId, descriptorArray, ... }]
 * @param {number} threshold Matching sensitivity (lower is stricter, e.g. 0.45-0.6)
 */
export function findBestMatch(currentDescriptor, storedUsers, threshold = 0.6) {
    const labeledDescriptors = storedUsers.map(user => {
        return {
            officeId: user.officeId,
            descriptor: new Float32Array(user.faceDescriptor)
        };
    });

    let bestMatch = null;
    let minDistance = threshold;

    labeledDescriptors.forEach(stored => {
        const distance = faceapi.euclideanDistance(currentDescriptor, stored.descriptor);
        if (distance < minDistance) {
            minDistance = distance;
            bestMatch = stored.officeId;
        }
    });

    return bestMatch; // Returns officeId if matched, else null
}
