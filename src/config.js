import { initializeApp } from "firebase/app";
import { getDatabase,ref, set  } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyDRmDkiGiZnoWnjlkPNgQodTzS-j3K6fIk",
    authDomain: "bill-splitter-5a503.firebaseapp.com",
    projectId: "bill-splitter-5a503",
    storageBucket: "bill-splitter-5a503.appspot.com",
    messagingSenderId: "479087748546",
    appId: "1:479087748546:web:25b08e711119342ed3225b",
    measurementId: "G-Q9DG2XVNBF"
  };

  const app=initializeApp(firebaseConfig)
// console.log(app)
const auth=getAuth(app)
const db=getDatabase(app)

  export default firebaseConfig
export {auth, app, db}