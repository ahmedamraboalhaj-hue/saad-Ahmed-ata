// Authentication Logic
import { 
    auth, 
    database 
} from './firebase-config.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    ref, 
    set, 
    get,
    child
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { findBestMatch } from './face-logic.js';

/**
 * Helper to convert phone number to a Firebase-friendly email string
 * @param {string} phone 
 */
const phoneToEmail = (phone) => {
    const cleanPhone = phone.replace(/\D/g, '');
    return `u${cleanPhone}@office.com`;
};

/**
 * Register a new Office
 * @param {string} phone 
 * @param {string} password 
 * @param {object} officeData { name, owner, phone, address }
 */
export async function registerOffice(phone, password, officeData) {
    try {
        const email = phoneToEmail(phone);
        // 1. Create User in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const officeId = user.uid; // UID as office_id for simplicity and security

        // 2. Save Office Data in Realtime Database under offices/{office_id}
        await set(ref(database, 'offices/' + officeId), {
            ...officeData,
            email: email,
            createdAt: new Date().toISOString(),
            officeId: officeId
        });

        // 3. Save to localStorage for immediate use
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
 * Login for existing Office
 * @param {string} phone 
 * @param {string} password 
 */
export async function loginOffice(phone, password) {
    try {
        const email = phoneToEmail(phone);
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const officeId = user.uid;

        // Fetch office data to verify and store name
        const snapshot = await get(ref(database, 'offices/' + officeId));
        if (snapshot.exists()) {
            const data = snapshot.val();
            localStorage.setItem('userOfficeId', officeId);
            localStorage.setItem('officeName', data.name);
            localStorage.setItem('sheikhName', data.sheikhName || "");
            return { success: true, user: data };
        } else {
            throw new Error("Office data not found!");
        }
    } catch (error) {
        console.error("Login Error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Logout
 */
export async function logout() {
    try {
        await signOut(auth);
        localStorage.removeItem('userOfficeId');
        localStorage.removeItem('officeName');
        localStorage.removeItem('sheikhName');
        window.location.href = 'auth.html';
    } catch (error) {
        console.error("Logout Error:", error);
    }
}

/**
 * Register a new Office with Biometric Face ID
 * @param {string} phone 
 * @param {string} password 
 * @param {object} officeData { name, owner, phone, etc. }
 * @param {Array} faceDescriptor [128-float values]
 */
export async function registerOfficeWithFace(phone, password, officeData, faceDescriptor) {
    try {
        const email = phoneToEmail(phone);
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const officeId = user.uid;

        // Save office profile AND face descriptor
        await set(ref(database, 'offices/' + officeId), {
            ...officeData,
            email: email,
            officeId: officeId,
            faceDescriptor: faceDescriptor, // Saved as array in Firebase
            createdAt: new Date().toISOString()
        });

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
 * Fast login via Face Recognition
 */
export async function loginWithFace(currentDescriptor) {
    try {
        // 1. Fetch all office records (in production, we'd use Firestore or a Cloud Function for scale)
        const snapshot = await get(ref(database, 'offices'));
        if (!snapshot.exists()) throw new Error("لا توجد مكاتب مسجلة حالياً.");

        const offices = snapshot.val();
        const officeList = Object.keys(offices).map(id => ({
            officeId: id,
            faceDescriptor: offices[id].faceDescriptor,
            name: offices[id].name,
            sheikhName: offices[id].sheikhName
        })).filter(o => o.faceDescriptor); // Only check those with face IDs

        // 2. Perform Euclidean identification
        const matchedOfficeId = findBestMatch(currentDescriptor, officeList);

        if (matchedOfficeId) {
            const matchedData = offices[matchedOfficeId];
            localStorage.setItem('userOfficeId', matchedOfficeId);
            localStorage.setItem('officeName', matchedData.name);
            localStorage.setItem('sheikhName', matchedData.sheikhName || "");
            return { success: true, user: matchedData };
        } else {
            throw new Error("لم يتم التعرف على الوجه. يرجى المحاولة مرة أخرى أو الدخول بكلمة المرور.");
        }
    } catch (error) {
        console.error("Biometric Login Error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Check User Auth and Redirect
 */
export function checkAuth(requireAuth = true) {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in
            if (!requireAuth && window.location.pathname.includes('auth.html')) {
                window.location.href = 'index.html';
            }
            if (!localStorage.getItem('userOfficeId')) {
                localStorage.setItem('userOfficeId', user.uid);
            }
        } else {
            // User is signed out
            if (requireAuth && !window.location.pathname.includes('auth.html')) {
                window.location.href = 'auth.html';
            }
        }
    });
}
