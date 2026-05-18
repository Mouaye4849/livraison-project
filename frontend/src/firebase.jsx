import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyC1jdjsG55AAE-ORq2FUQ6N49Jzbz01DwY",
    authDomain: "wasali-app-2744a.firebaseapp.com",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();