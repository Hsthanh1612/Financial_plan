import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Cấu hình Web của Firebase là định danh công khai, KHÔNG phải bí mật. Dữ liệu được bảo vệ bằng Auth + Security Rules.
const firebaseConfig = {
  apiKey: 'AIzaSyBNS3LmG9C2HEqVC0UtQkffntzZdGVWcTs',
  authDomain: 'financial-plan-project-2a92e.firebaseapp.com',
  projectId: 'financial-plan-project-2a92e',
  appId: '1:324357247643:web:e2d027f3eca3e5c416ac3e',
  messagingSenderId: '324357247643',
};

// Emulator chỉ bật khi chạy `vite dev` với VITE_USE_EMULATOR=1; bản build production không bao giờ kết nối emulator.
const useEmulator = import.meta.env.DEV && import.meta.env.VITE_USE_EMULATOR === '1';

// Với emulator dùng project "demo-*" để không thể chạm tới tài nguyên production.
const app = initializeApp(useEmulator ? { ...firebaseConfig, projectId: 'demo-financial-plan-test' } : firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

if (useEmulator) {
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
}
