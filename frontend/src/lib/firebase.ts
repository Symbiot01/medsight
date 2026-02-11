import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDVlV_SrHSDFEO13By3-0V8Fu7nC-Gi72g",
  authDomain: "medrecs-485208.firebaseapp.com",
  projectId: "medrecs-485208",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
