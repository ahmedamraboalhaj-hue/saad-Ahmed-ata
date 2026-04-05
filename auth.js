// Normalized Office Authentication
import { database } from './firebase-config.js';
import { 
    ref, 
    set, 
    get,
    child
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { findBestMatch } from './face-logic.js';

/**
 * Normalize phone number to use as a unique ID
 */
export function normalizePhone(phone) {
    if (!phone) return "";
    let clean = phone.toString().replace(/\D/g, ''); 
    if (clean.startsWith('20')) clean = clean.substring(2);
    if (clean.startsWith('0')) clean = clean.substring(1);
    return clean;
}

/**
 * Register a new Office
 */
export async function registerOffice(phone, password, officeData) {
    try {
        const officeId = normalizePhone(phone);

        const existing = await get(ref(database, 'offices/' + officeId));
        if (existing.exists()) {
            throw new Error("هذا المكتب مسجل بالفعل بهذا الرقم.");
        }

        const dbData = {
            ...officeData,
            password: password,
            officeId: officeId,
            createdAt: new Date().toISOString()
        };

        await set(ref(database, 'offices/' + officeId), dbData);

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
 * Login
 */
export async function loginOffice(phone, password) {
    try {
        const officeId = normalizePhone(phone);
        const snapshot = await get(ref(database, 'offices/' + officeId));
        
        if (snapshot.exists()) {
            const data = snapshot.val();
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
 * Logout
 */
export function logout() {
    localStorage.removeItem('userOfficeId');
    localStorage.removeItem('officeName');
    localStorage.removeItem('sheikhName');
    window.location.href = 'auth.html';
}

/**
 * Register with Face ID
 */
export async function registerOfficeWithFace(phone, password, officeData, faceDescriptor) {
    try {
        const officeId = normalizePhone(phone);
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
 * Face ID Login
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
 * Check Session
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
