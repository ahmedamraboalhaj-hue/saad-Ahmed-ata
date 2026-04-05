// Simplified Office Authentication (File-based Logic)
import { database } from './firebase-config.js';
import { 
    ref, 
    set, 
    get,
    child
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { findBestMatch } from './face-logic.js';

/**
 * Register a new Office (Saving it like a local file in Firebase)
 * @param {string} phone - Used as the unique "File Name"
 * @param {string} password 
 * @param {object} officeData { name, sheikhName, address }
 */
export async function registerOffice(phone, password, officeData) {
    try {
        const officeId = phone.replace(/\D/g, ''); // Use phone as the unique ID

        // Check if "File" already exists
        const existing = await get(ref(database, 'offices/' + officeId));
        if (existing.exists()) {
            throw new Error("هذا المكتب مسجل بالفعل بهذا الرقم.");
        }

        // 1. Save Office "File" in Realtime Database
        const dbData = {
            ...officeData,
            password: password, // Saved simply as a field in the "file"
            officeId: officeId,
            createdAt: new Date().toISOString()
        };

        await set(ref(database, 'offices/' + officeId), dbData);

        // 2. Save to local state for immediate access
        localStorage.setItem('userOfficeId', officeId);
        localStorage.setItem('officeName', officeData.name);
        localStorage.setItem('sheikhName', officeData.sheikhName || "");

        return { success: true, officeId };
    } catch (error) {
        console.error("Registration Error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Login (Checking the "File" content)
 */
export async function loginOffice(phone, password) {
    try {
        const officeId = phone.replace(/\D/g, '');
        
        // 1. Fetch the "File" for this office
        const snapshot = await get(ref(database, 'offices/' + officeId));
        
        if (snapshot.exists()) {
            const data = snapshot.val();
            // 2. Compare the "Saved Password" in the file
            if (data.password === password) {
                localStorage.setItem('userOfficeId', officeId);
                localStorage.setItem('officeName', data.name);
                localStorage.setItem('sheikhName', data.sheikhName || "");
                return { success: true, user: data };
            } else {
                throw new Error("كلمة المرور غير صحيحة.");
            }
        } else {
            throw new Error("لا يوجد مكتب مسجل بهذا الرقم.");
        }
    } catch (error) {
        console.error("Login Error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Logout (Clear local session only)
 */
export function logout() {
    localStorage.removeItem('userOfficeId');
    localStorage.removeItem('officeName');
    localStorage.removeItem('sheikhName');
    window.location.href = 'auth.html';
}

/**
 * Register with Face ID (Simple storage)
 */
export async function registerOfficeWithFace(phone, password, officeData, faceDescriptor) {
    try {
        const officeId = phone.replace(/\D/g, '');
        const dbData = {
            ...officeData,
            password: password,
            officeId: officeId,
            faceDescriptor: faceDescriptor,
            createdAt: new Date().toISOString()
        };

        await set(ref(database, 'offices/' + officeId), dbData);

        localStorage.setItem('userOfficeId', officeId);
        localStorage.setItem('officeName', officeData.name);
        localStorage.setItem('sheikhName', officeData.sheikhName || "");

        return { success: true, officeId };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Face ID Login (Searching through all "Files")
 */
export async function loginWithFace(currentDescriptor) {
    try {
        const snapshot = await get(ref(database, 'offices'));
        if (!snapshot.exists()) throw new Error("لا توجد مكاتب.");

        const offices = snapshot.val();
        const officeList = Object.keys(offices).map(id => ({
            officeId: id,
            faceDescriptor: offices[id].faceDescriptor
        })).filter(o => o.faceDescriptor);

        const matchedOfficeId = findBestMatch(currentDescriptor, officeList);

        if (matchedOfficeId) {
            const matchedData = offices[matchedOfficeId];
            localStorage.setItem('userOfficeId', matchedOfficeId);
            localStorage.setItem('officeName', matchedData.name);
            localStorage.setItem('sheikhName', matchedData.sheikhName || "");
            return { success: true, user: matchedData };
        } else {
            throw new Error("لم يتم التعرف على الوجه.");
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Check Session (Simple redirect logic)
 */
export function checkAuth(requireAuth = true) {
    const officeId = localStorage.getItem('userOfficeId');
    const isAuthPage = window.location.pathname.includes('auth.html');

    if (officeId) {
        if (!requireAuth && isAuthPage) {
            window.location.href = 'index.html';
        }
    } else {
        if (requireAuth && !isAuthPage) {
            window.location.href = 'auth.html';
        }
    }
}
