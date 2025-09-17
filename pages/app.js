// app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// 1) Replace with your Firebase web app config
const firebaseConfig = {
  apiKey: "AIzaSyARMbLy93Sqv8lONWd2SHdzatahycaFAG0",
  authDomain: "tkn-financial.firebaseapp.com",
  projectId: "tkn-financial",
  appId: "1:635032845784:web:79579b9a681fa9cf99c6ad",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// 2) UI elements
const signinBtn = document.getElementById("signin");
const signoutBtn = document.getElementById("signout");
const userBox = document.getElementById("userBox");
const displayNameEl = document.getElementById("displayName");
const emailEl = document.getElementById("email");
const uidEl = document.getElementById("uid");
const avatarEl = document.getElementById("avatar");

const nicknameInput = document.getElementById("nickname");
const favoriteCityInput = document.getElementById("favoriteCity");
const saveBtn = document.getElementById("saveProfile");
const statusEl = document.getElementById("status");

// 3) Events
signinBtn.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    alert("Sign-in failed: " + e.message);
  }
});

signoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

// 4) Auth state listener: load profile on login
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // Show user info
    displayNameEl.textContent = user.displayName || "(no name)";
    emailEl.textContent = user.email || "";
    uidEl.textContent = user.uid;
    avatarEl.src = user.photoURL || "";

    signinBtn.style.display = "none";
    signoutBtn.style.display = "inline-block";
    userBox.style.display = "block";

    // Load profile doc (users/{uid})
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const profile = snap.data();
      nicknameInput.value = profile.nickname || "";
      favoriteCityInput.value = profile.favoriteCity || "";
    } else {
      // Initialize on first login (optional)
      await setDoc(ref, {
        nickname: "",
        favoriteCity: "",
        email: user.email || "",
        createdAt: new Date().toISOString(),
      });
    }
  } else {
    // Signed out
    signinBtn.style.display = "inline-block";
    signoutBtn.style.display = "none";
    userBox.style.display = "none";
    nicknameInput.value = "";
    favoriteCityInput.value = "";
    statusEl.textContent = "";
  }
});

// 5) Save profile
saveBtn.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return alert("Please sign in first.");
  try {
    const ref = doc(db, "users", user.uid);
    await setDoc(ref, {
      nickname: nicknameInput.value.trim(),
      favoriteCity: favoriteCityInput.value.trim(),
      email: user.email || "",
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    statusEl.textContent = "Saved!";
    setTimeout(() => (statusEl.textContent = ""), 1500);
  } catch (e) {
    alert("Save failed: " + e.message);
  }
});
