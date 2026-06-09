document.addEventListener('DOMContentLoaded', () => {
    const currentUser = auth.currentUser;
    const currentPage = window.location.pathname.split('/').pop();

    // --- Global UI Elements ---
    const loadingOverlay = document.getElementById('loading-overlay');
    const earnNavLink = document.getElementById('earn-nav-link');
    const mysteryBoxNavLink = document.getElementById('mystery-box-nav-link');
    const redeemNavLink = document.getElementById('redeem-nav-link');

    // --- Show/Hide Loading Overlay ---
    function showLoading() {
        if (loadingOverlay) loadingOverlay.style.display = 'flex';
    }
    function hideLoading() {
        if (loadingOverlay) loadingOverlay.style.display = 'none';
    }

    // --- Navigation Link Handling ---
    if (earnNavLink) {
        earnNavLink.addEventListener('click', (e) => {
            e.preventDefault();
            // In a real app, this would navigate to a dedicated 'Earn' page/section
            alert('Watch Ads feature is integrated into the Dashboard for simplicity in this example.');
            // For now, let's simulate navigating to a modal or section
            showWatchAdModal();
        });
    }
    if (mysteryBoxNavLink) {
        mysteryBoxNavLink.addEventListener('click', (e) => {
            e.preventDefault();
            showMysteryBoxModal();
        });
    }
    if (redeemNavLink) {
        redeemNavLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'redeem.html';
        });
    }

    // --- Dashboard Specific Logic ---
    if (currentPage === 'dashboard.html') {
        const coinBalanceElement = document.getElementById('coin-balance');
        const diamondBalanceElement = document.getElementById('diamond-balance');
        const dailyProgressBar = document.getElementById('daily-progress-bar');
        const totalAdsWatchedElement = document.getElementById('total-ads-watched');
        const totalBoxesOpenedElement = document.getElementById('total-boxes-opened');
        const totalRedeemedElement = document.getElementById('total-redeemed');

        // Listen for auth state changes to update UI
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                showLoading();
                const userData = await getUserData(user.uid);
                const rewardStats = await getRewardStats(user.uid);

                if (userData && rewardStats) {
                    coinBalanceElement.textContent = userData.coins;
                    diamondBalanceElement.textContent = userData.diamonds;
                    totalAdsWatchedElement.textContent = rewardStats.totalAdsWatched;
                    totalBoxesOpenedElement.textContent = rewardStats.totalBoxesOpened;
                    totalRedeemedElement.textContent = rewardStats.totalRedeemed;

                    // Update daily progress bar (example: based on ads watched)
                    if (dailyProgressBar) {
                        const progress = Math.min((rewardStats.totalAdsWatched % 5) * 20, 100); // Example: 100% after 5 ads
                        dailyProgressBar.style.width = `${progress}%`;
                    }

                    // Set up real-time listeners for balances and stats
                    const userBalanceRef = ref(database, `users/${user.uid}`);
                    onValue(userBalanceRef, (snapshot) => {
                        if (snapshot.exists()) {
                            const data = snapshot.val();
                            coinBalanceElement.textContent = data.coins;
                            diamondBalanceElement.textContent = data.diamonds;
                        }
                    });

                    const rewardStatsRef = ref(database, `rewardStats/${user.uid}`);
                    onValue(rewardStatsRef, (snapshot) => {
                        if (snapshot.exists()) {
                            const data = snapshot.val();
                            totalAdsWatchedElement.textContent = data.totalAdsWatched;
                            totalBoxesOpenedElement.textContent = data.totalBoxesOpened;
                            totalRedeemedElement.textContent = data.totalRedeemed;
                            // Update progress bar based on real-time stats
                            if (dailyProgressBar) {
                                const progress = Math.min((data.totalAdsWatched % 5) * 20, 100);
                                dailyProgressBar.style.width = `${progress}%`;
                            }
                        }
                    });

                } else {
                    // Handle cases where user data or stats fail to load
                    coinBalanceElement.textContent = 'Error';
                    diamondBalanceElement.textContent = 'Error';
                }
                hideLoading();
            } else {
                // User logged out, redirect handled by auth.js
                hideLoading();
            }
        });
    }

    // --- Profile Page Logic ---
    if (currentPage === 'profile.html') {
        let redeemHistoryUnsubscribe = null;

        onAuthStateChanged(auth, async (user) => {
            if (user) {
                showLoading();
                const userData = await getUserData(user.uid);
                if (userData) {
                    // Update profile details
                    document.getElementById('profile-username').textContent = userData.username;
                    document.getElementById('profile-email').textContent = userData.email;
                    document.getElementById('profile-join-date').textContent = new Date(userData.createdAt).toLocaleDateString();
                    document.getElementById('profile-coins').textContent = userData.coins;
                    document.getElementById('profile-diamonds').textContent = userData.diamonds;
                    document.getElementById('profile-avatar').src = user.photoURL || 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=800&q=80';

                    // Load redeem history
                    const redeemHistoryList = document.getElementById('redeem-history-list');
                    if (redeemHistoryList) {
                        // Remove previous listener if it exists
                        if (redeemHistoryUnsubscribe) {
                            redeemHistoryUnsubscribe();
                        }
                        redeemHistoryUnsubscribe = getRedeemHistory(user.uid, (history) => {
                            redeemHistoryList.innerHTML = ''; // Clear previous history
                            if (history.length === 0) {
                                redeemHistoryList.innerHTML = '<li class="redeem-item placeholder">No redemption history yet.</li>';
                            } else {
                                history.forEach(item => {
                                    const li = document.createElement('li');
                                    li.classList.add('redeem-item');
                                    li.innerHTML = `
                                        <span>${item.amount} Rupees</span>
                                        <span>(${item.coinsUsed} Coins)</span>
                                        <span class="status status-${item.status}">${item.status.charAt(0).toUpperCase() + item.status.slice(1)}</span>
                                        <small>${new Date(item.createdAt).toLocaleString()}</small>
                                    `;
                                    redeemHistoryList.appendChild(li);
                                });
                            }
                        });
                    }
                }
                hideLoading();
            } else {
                hideLoading();
            }
        });

        // Profile Edit Modal Logic
        const editProfileModal = document.getElementById('edit-profile-modal');
        const editProfileBtn = document.getElementById('edit-profile-btn');
        const closeButton = editProfileModal.querySelector('.close-button');
        const editProfileForm = document.getElementById('edit-profile-form');
        const editUsernameInput = document.getElementById('edit-username');

        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', () => {
                if (editProfileModal) editProfileModal.style.display = 'block';
                // Pre-fill the form with current data
                const currentUsername = document.getElementById('profile-username').textContent;
                if (editUsernameInput) editUsernameInput.value = currentUsername;
            });
        }

        if (closeButton) {
            closeButton.addEventListener('click', () => {
                if (editProfileModal) editProfileModal.style.display = 'none';
            });
        }

        window.addEventListener('click', (event) => {
            if (event.target === editProfileModal) {
                editProfileModal.style.display = 'none';
            }
        });

        if (editProfileForm) {
            editProfileForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const newUsername = editUsernameInput.value;
                const user = auth.currentUser;
                if (user) {
                    showLoading();
                    const success = await updateUsername(user.uid, newUsername);
                    if (success) {
                        document.getElementById('profile-username').textContent = newUsername;
                        document.getElementById('username').textContent = newUsername; // Update in header too
                        alert('Profile updated successfully!');
                        editProfileModal.style.display = 'none';
                    } else {
                        alert('Failed to update profile.');
                    }
                    hideLoading();
                }
            });
        }
    }

    // --- Redeem Page Logic ---
    if (currentPage === 'redeem.html') {
        const redeemForm = document.getElementById('redeem-form');
        const redeemHistoryList = document.getElementById('redeem-history-list');
        let redeemHistoryUnsubscribe = null;

        onAuthStateChanged(auth, async (user) => {
            if (user) {
                showLoading();
                const userData = await getUserData(user.uid);
                if (userData) {
                    document.getElementById('current-coins').textContent = userData.coins;
                    document.getElementById('current-diamonds').textContent = userData.diamonds;

                    // Load redeem history
                    if (redeemHistoryList) {
                        if (redeemHistoryUnsubscribe) {
                            redeemHistoryUnsubscribe();
                        }
                        redeemHistoryUnsubscribe = getRedeemHistory(user.uid, (history) => {
                            redeemHistoryList.innerHTML = ''; // Clear previous history
                            if (history.length === 0) {
                                redeemHistoryList.innerHTML = '<li class="redeem-item placeholder">No redemption history yet.</li>';
                            } else {
                                history.forEach(item => {
                                    const li = document.createElement('li');
                                    li.classList.add('redeem-item');
                                    li.innerHTML = `
                                        <span>${item.amount} Rupees</span>
                                        <span>(${item.coinsUsed} Coins)</span>
                                        <span class="status status-${item.status}">${item.status.charAt(0).toUpperCase() + item.status.slice(1)}</span>
                                        <small>${new Date(item.createdAt).toLocaleString()}</small>
                                    `;
                                    redeemHistoryList.appendChild(li);
                                });
                            }
                        });
                    }
                }
                hideLoading();
            } else {
                hideLoading();
            }
        });

        if (redeemForm) {
            redeemForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const user = auth.currentUser;
                if (!user) {
                    alert('Please log in to redeem.');
                    return;
                }

                showLoading();
                const userData = await getUserData(user.uid);
                const coinsNeeded = 900;
                const redeemAmount = 10; // Rupees

                if (!userData) {
                    alert('Error fetching user data. Please try again.');
                    hideLoading();
                    return;
                }

                if (userData.coins >= coinsNeeded) {
                    // Deduct coins
                    const newCoinBalance = userData.coins - coinsNeeded;
                    const updateSuccess = await updateUserBalance(user.uid, 'coins', newCoinBalance);

                    if (updateSuccess) {
                        // Create redeem request
                        const requestId = await createRedeemRequest(user.uid, user.email, coinsNeeded, redeemAmount);
                        if (requestId) {
                            alert(`Redeem request submitted successfully! Your request ID is: ${requestId}`);
                            // Update UI instantly
                            document.getElementById('current-coins').textContent = newCoinBalance;
                            // Update total redeemed stat
                            const currentStats = await getRewardStats(user.uid);
                            await updateRewardStats(user.uid, 'totalRedeemed', (currentStats.totalRedeemed || 0) + 1);
                        } else {
                            alert('Failed to submit redeem request. Please try again.');
                        }
                    } else {
                        alert('Failed to deduct coins. Please try again.');
                    }
                } else {
                    alert(`You need at least ${coinsNeeded} coins to redeem.`);
                }
                hideLoading();
            });
        }
    }

    // --- Watch Ad Modal Logic ---
    function showWatchAdModal() {
        const modal = document.getElementById('watch-ad-modal');
        const watchAdBtn = document.getElementById('watch-ad-btn');
        const adRewardElement = document.getElementById('ad-reward-animation');
        const adSpinner = document.getElementById('ad-spinner');
        const adCloseButton = modal.querySelector('.close-button');

        if (!modal) return;

        modal.style.display = 'block';

        const user = auth.currentUser;
        if (!user) {
            alert('Please log in to watch ads.');
            modal.style.display = 'none';
            return;
        }

        // Reset button and animations
        watchAdBtn.disabled = false;
        watchAdBtn.textContent = 'Watch Ad';
        if (adRewardElement) adRewardElement.style.display = 'none';
        if (adSpinner) adSpinner.style.display = 'none';

        if (watchAdBtn) {
            watchAdBtn.onclick = async () => {
                watchAdBtn.disabled = true;
                watchAdBtn.textContent = 'Watching...';
                if (adSpinner) adSpinner.style.display = 'block';
                if (adRewardElement) adRewardElement.style.display = 'none';

                // Simulate ad watching time
                setTimeout(async () => {
                    if (adSpinner) adSpinner.style.display = 'none';

                    // Simulate successful ad completion
                    const adSuccess = true; // In a real scenario, this would come from an ad SDK

                    if (adSuccess) {
                        const userData = await getUserData(user.uid);
                        if (userData) {
                            const newDiamondBalance = userData.diamonds + 1;
                            const updateSuccess = await updateUserBalance(user.uid, 'diamonds', newDiamondBalance);

                            if (updateSuccess) {
                                // Update stats
                                const currentStats = await getRewardStats(user.uid);
                                await updateRewardStats(user.uid, 'totalAdsWatched', (currentStats.totalAdsWatched || 0) + 1);

                                // Show reward animation
                                if (adRewardElement) {
                                    adRewardElement.style.display = 'block';
                                    adRewardElement.textContent = '+1 Diamond!';
                                    // Trigger animation class
                                    adRewardElement.classList.add('reward-pop');
                                    adRewardElement.addEventListener('animationend', () => {
                                        adRewardElement.classList.remove('reward-pop');
                                        modal.style.display = 'none'; // Close modal after animation
                                    }, { once: true });
                                }
                                watchAdBtn.textContent = 'Watch Ad'; // Reset button text
                            } else {
                                alert('Failed to add diamond. Please try again.');
                                watchAdBtn.disabled = false;
                                watchAdBtn.textContent = 'Watch Ad';
                            }
                        } else {
                            alert('Failed to fetch user data. Please try again.');
                            watchAdBtn.disabled = false;
                            watchAdBtn.textContent = 'Watch Ad';
                        }
                    } else {
                        alert('Ad failed to load or complete. Please try again.');
                        watchAdBtn.disabled = false;
                        watchAdBtn.textContent = 'Watch Ad';
                    }
                }, 5000); // Simulate 5 seconds of ad watching
            };
        }

        if (adCloseButton) {
            adCloseButton.addEventListener('click', () => {
                modal.style.display = 'none';
                // Potentially stop ad playback if applicable
            });
        }

        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    // --- Mystery Box Modal Logic ---
    function showMysteryBoxModal() {
        const modal = document.getElementById('mystery-box-modal');
        const openBoxBtn = document.getElementById('open-box-btn');
        const boxContainer = document.getElementById('mystery-box-container');
        const rewardRevealElement = document.getElementById('reward-reveal');
        const boxCloseButton = modal.querySelector('.close-button');

        if (!modal) return;

        modal.style.display = 'block';

        const user = auth.currentUser;
        if (!user) {
            alert('Please log in to open mystery boxes.');
            modal.style.display = 'none';
            return;
        }

        // Reset animations and state
        if (boxContainer) boxContainer.classList.remove('shaking', 'opened');
        if (rewardRevealElement) rewardRevealElement.textContent = '';
        openBoxBtn.disabled = false;
        openBoxBtn.textContent = 'Open Box';

        // Fetch current user data to check balance
        getUserData(user.uid).then(userData => {
            if (userData) {
                document.getElementById('box-current-diamonds').textContent = userData.diamonds;
                const boxCost = 19;
                if (userData.diamonds < boxCost) {
                    openBoxBtn.disabled = true;
                    openBoxBtn.textContent = `Need ${boxCost} Diamonds`;
                }
            }
        });

        if (openBoxBtn) {
            openBoxBtn.onclick = async () => {
                openBoxBtn.disabled = true;
                openBoxBtn.textContent = 'Opening...';
                if (boxContainer) boxContainer.classList.add('shaking');

                // Simulate opening time
                setTimeout(async () => {
                    if (boxContainer) boxContainer.classList.remove('shaking');
                    if (boxContainer) boxContainer.classList.add('opened');

                    const boxCost = 19;
                    const coinsReward = 190;
                    const userData = await getUserData(user.uid);

                    if (userData && userData.diamonds >= boxCost) {
                        // Deduct diamonds
                        const newDiamondBalance = userData.diamonds - boxCost;
                        const deductSuccess = await updateUserBalance(user.uid, 'diamonds', newDiamondBalance);

                        if (deductSuccess) {
                            // Add coins
                            const newCoinBalance = userData.coins + coinsReward;
                            const addCoinsSuccess = await updateUserBalance(user.uid, 'coins', newCoinBalance);

                            if (addCoinsSuccess) {
                                // Update stats
                                const currentStats = await getRewardStats(user.uid);
                                await updateRewardStats(user.uid, 'totalBoxesOpened', (currentStats.totalBoxesOpened || 0) + 1);

                                // Reveal reward
                                if (rewardRevealElement) {
                                    rewardRevealElement.textContent = `+${coinsReward} Coins!`;
                                    rewardRevealElement.style.display = 'block';
                                    rewardRevealElement.classList.add('reward-pop');
                                    rewardRevealElement.addEventListener('animationend', () => {
                                        rewardRevealElement.classList.remove('reward-pop');
                                        modal.style.display = 'none'; // Close modal after animation
                                    }, { once: true });
                                }
                                openBoxBtn.textContent = 'Open Box'; // Reset button text
                            } else {
                                alert('Failed to add coins. Please try again.');
                                // Rollback diamond deduction if coin addition fails
                                await updateUserBalance(user.uid, 'diamonds', userData.diamonds);
                                openBoxBtn.disabled = false;
                                openBoxBtn.textContent = 'Open Box';
                            }
                        } else {
                            alert('Failed to deduct diamonds. Please try again.');
                            openBoxBtn.disabled = false;
                            openBoxBtn.textContent = 'Open Box';
                        }
                    } else {
                        alert('Insufficient diamonds. Please try again later.');
                        openBoxBtn.disabled = false;
                        openBoxBtn.textContent = 'Open Box';
                    }
                }, 1500); // Simulate 1.5 seconds of opening animation
            };
        }

        if (boxCloseButton) {
            boxCloseButton.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }

        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    // --- Initial Load Handling ---
    // If on a protected page (not login/register/forgot-password/index), check auth state
    if (!['login.html', 'register.html', 'forgot-password.html', 'index.html'].includes(currentPage)) {
        onAuthStateChanged(auth, (user) => {
            if (!user) {
                // Redirect to login if not authenticated
                window.location.href = 'login.html';
            }
        });
    }

    hideLoading(); // Hide loading overlay once initial setup is done
});
