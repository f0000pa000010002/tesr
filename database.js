// --- Database Functions ---

// Get user data from Realtime Database
async function getUserData(uid) {
    const userRef = ref(database, 'users/' + uid);
    try {
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
            return snapshot.val();
        } else {
            console.error("User data not found for UID:", uid);
            return null;
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
        return null;
    }
}

// Update user balance (coins or diamonds)
async function updateUserBalance(uid, type, amount) {
    const userRef = ref(database, `users/${uid}/${type}`);
    try {
        // Use a transaction to ensure atomic updates and prevent race conditions
        await update(userRef, { [type]: amount });
        console.log(`User ${uid} ${type} updated to ${amount}`);
        return true;
    } catch (error) {
        console.error(`Error updating user ${type}:`, error);
        return false;
    }
}

// Update reward statistics
async function updateRewardStats(uid, statType, value) {
    const statRef = ref(database, `rewardStats/${uid}/${statType}`);
    try {
        await set(statRef, value);
        console.log(`User ${uid} ${statType} updated to ${value}`);
        return true;
    } catch (error) {
        console.error(`Error updating ${statType}:`, error);
        return false;
    }
}

// Get reward statistics
async function getRewardStats(uid) {
    const statsRef = ref(database, `rewardStats/${uid}`);
    try {
        const snapshot = await get(statsRef);
        if (snapshot.exists()) {
            return snapshot.val();
        } else {
            // Initialize if not exists
            await set(statsRef, { totalAdsWatched: 0, totalBoxesOpened: 0, totalRedeemed: 0 });
            return { totalAdsWatched: 0, totalBoxesOpened: 0, totalRedeemed: 0 };
        }
    } catch (error) {
        console.error("Error fetching reward stats:", error);
        return null;
    }
}

// Create a redeem request
async function createRedeemRequest(uid, email, coinsUsed, amount) {
    const redeemRequestsRef = ref(database, 'redeemRequests');
    const newRequestRef = push(redeemRequestsRef);
    try {
        await set(newRequestRef, {
            uid: uid,
            email: email,
            coinsUsed: coinsUsed,
            amount: amount,
            status: 'pending',
            createdAt: new Date().toISOString()
        });
        console.log("Redeem request created with ID:", newRequestRef.key);
        return newRequestRef.key;
    } catch (error) {
        console.error("Error creating redeem request:", error);
        return null;
    }
}

// Get redeem history for a user
function getRedeemHistory(uid, callback) {
    const redeemRequestsRef = ref(database, 'redeemRequests');
    const userRequestsQuery = query(redeemRequestsRef, orderByChild('uid'), equalTo(uid));

    // Use onValue for real-time updates
    const unsubscribe = onValue(userRequestsQuery, (snapshot) => {
        const history = [];
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const requestData = childSnapshot.val();
                requestData.id = childSnapshot.key; // Add key for potential future use
                history.push(requestData);
            });
        }
        callback(history);
    }, (error) => {
        console.error("Error fetching redeem history:", error);
    });

    return unsubscribe; // Return the unsubscribe function
}

// Update profile username
async function updateUsername(uid, newUsername) {
    const usernameRef = ref(database, `users/${uid}/username`);
    try {
        await set(usernameRef, newUsername);
        console.log(`Username updated for ${uid} to ${newUsername}`);
        return true;
    } catch (error) {
        console.error("Error updating username:", error);
        return false;
    }
}
