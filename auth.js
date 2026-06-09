const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const forgotPasswordForm = document.getElementById('forgot-password-form');
const googleSigninBtn = document.getElementById('google-signin-btn');
const logoutBtn = document.getElementById('logout-btn');

// --- Authentication Functions ---

// Register with Email/Password
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Create user profile in Realtime Database
            await set(ref(database, 'users/' + user.uid), {
                username: username,
                email: email,
                coins: 0,
                diamonds: 0,
                createdAt: new Date().toISOString()
            });

            // Initialize reward stats
            await set(ref(database, 'rewardStats/' + user.uid), {
                totalAdsWatched: 0,
                totalBoxesOpened: 0,
                totalRedeemed: 0
            });

            alert('Registration successful! Please login.');
            window.location.href = 'login.html';
        } catch (error) {
            console.error("Registration Error:", error);
            alert(`Registration failed: ${error.message}`);
        }
    });
}

// Login with Email/Password
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            // Redirect handled by onAuthStateChanged
        } catch (error) {
            console.error("Login Error:", error);
            alert(`Login failed: ${error.message}`);
        }
    });
}

// Google Sign-In
if (googleSigninBtn) {
    googleSigninBtn.addEventListener('click', async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            // Check if user profile exists, if not, create it
            const userRef = ref(database, 'users/' + user.uid);
            const snapshot = await get(userRef);

            if (!snapshot.exists()) {
                await set(userRef, {
                    username: user.displayName || 'New User',
                    email: user.email,
                    coins: 0,
                    diamonds: 0,
                    createdAt: new Date().toISOString()
                });
                // Initialize reward stats
                await set(ref(database, 'rewardStats/' + user.uid), {
                    totalAdsWatched: 0,
                    totalBoxesOpened: 0,
                    totalRedeemed: 0
                });
            }
            // Redirect handled by onAuthStateChanged
        } catch (error) {
            console.error("Google Sign-In Error:", error);
            alert(`Google Sign-In failed: ${error.message}`);
        }
    });
}

// Password Reset
if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('forgot-password-email').value;

        try {
            await sendPasswordResetEmail(auth, email);
            alert('Password reset email sent! Check your inbox.');
            window.location.href = 'login.html';
        } catch (error) {
            console.error("Password Reset Error:", error);
            alert(`Password reset failed: ${error.message}`);
        }
    });
}

// Logout
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            await signOut(auth);
            window.location.href = 'login.html';
        } catch (error) {
            console.error("Logout Error:", error);
            alert(`Logout failed: ${error.message}`);
        }
    });
}

// --- Session Persistence and Redirects ---

onAuthStateChanged(auth, async (user) => {
    const currentPage = window.location.pathname.split('/').pop();

    if (user) {
        // User is signed in
        // Fetch user data for display
        const userData = await getUserData(user.uid);
        if (userData) {
            updateUIForSignedInUser(user, userData);
        }

        // Redirect if on login, register, or forgot password pages
        if (['login.html', 'register.html', 'forgot-password.html'].includes(currentPage)) {
            window.location.href = 'dashboard.html';
        }
    } else {
        // User is signed out
        // Redirect to login page if not already there
        if (!['login.html', 'register.html', 'forgot-password.html', 'index.html'].includes(currentPage)) {
            window.location.href = 'login.html';
        }
        // Clear UI elements for logged-out state
        clearUIForSignedOutUser();
    }
});

// Helper function to update UI for logged-in users
function updateUIForSignedInUser(user, userData) {
    const usernameElement = document.getElementById('username');
    const userEmailElement = document.getElementById('user-email');
    const userAvatarElement = document.getElementById('user-avatar');

    if (usernameElement) usernameElement.textContent = userData.username;
    if (userEmailElement) userEmailElement.textContent = userData.email;
    if (userAvatarElement) {
        userAvatarElement.src = user.photoURL || 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=800&q=80'; // Default avatar
    }

    // Update profile page elements if they exist
    const profileUsername = document.getElementById('profile-username');
    const profileEmail = document.getElementById('profile-email');
    const profileAvatar = document.getElementById('profile-avatar');
    const profileJoinDate = document.getElementById('profile-join-date');
    const profileCoins = document.getElementById('profile-coins');
    const profileDiamonds = document.getElementById('profile-diamonds');
    const profileTotalRedeems = document.getElementById('profile-total-redeems');

    if (profileUsername) profileUsername.textContent = userData.username;
    if (profileEmail) profileEmail.textContent = userData.email;
    if (profileAvatar) profileAvatar.src = user.photoURL || 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=800&q=80';
    if (profileJoinDate) profileJoinDate.textContent = new Date(userData.createdAt).toLocaleDateString();
    if (profileCoins) profileCoins.textContent = userData.coins;
    if (profileDiamonds) profileDiamonds.textContent = userData.diamonds;
    if (profileTotalRedeems) {
        const rewardStatsRef = ref(database, `rewardStats/${user.uid}/totalRedeemed`);
        onValue(rewardStatsRef, (snapshot) => {
            profileTotalRedeems.textContent = snapshot.exists() ? snapshot.val() : 0;
        });
    }
}

// Helper function to clear UI for logged-out users
function clearUIForSignedOutUser() {
    // Clear dashboard elements
    const usernameElement = document.getElementById('username');
    const userEmailElement = document.getElementById('user-email');
    const userAvatarElement = document.getElementById('user-avatar');
    const coinBalanceElement = document.getElementById('coin-balance');
    const diamondBalanceElement = document.getElementById('diamond-balance');

    if (usernameElement) usernameElement.textContent = 'Loading...';
    if (userEmailElement) userEmailElement.textContent = 'Loading...';
    if (userAvatarElement) userAvatarElement.src = 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=800&q=80';
    if (coinBalanceElement) coinBalanceElement.textContent = '0';
    if (diamondBalanceElement) diamondBalanceElement.textContent = '0';

    // Clear profile elements
    const profileUsername = document.getElementById('profile-username');
    const profileEmail = document.getElementById('profile-email');
    const profileAvatar = document.getElementById('profile-avatar');
    const profileJoinDate = document.getElementById('profile-join-date');
    const profileCoins = document.getElementById('profile-coins');
    const profileDiamonds = document.getElementById('profile-diamonds');
    const profileTotalRedeems = document.getElementById('profile-total-redeems');
    const redeemHistoryList = document.getElementById('redeem-history-list');

    if (profileUsername) profileUsername.textContent = 'Loading...';
    if (profileEmail) profileEmail.textContent = 'Loading...';
    if (profileAvatar) profileAvatar.src = 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=800&q=80';
    if (profileJoinDate) profileJoinDate.textContent = 'Loading...';
    if (profileCoins) profileCoins.textContent = '0';
    if (profileDiamonds) profileDiamonds.textContent = '0';
    if (profileTotalRedeems) profileTotalRedeems.textContent = '0';
    if (redeemHistoryList) {
        redeemHistoryList.innerHTML = '<li class="redeem-item placeholder">No redemption history yet.</li>';
    }
}
