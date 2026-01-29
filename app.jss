// ==================== CONFIGURATION ====================
const CONFIG = {
    ADMIN_PASSWORD: 'admin123', // CHANGE THIS!
    BANK_DETAILS: {
        bankName: 'Chase Bank',
        accountNumber: '1234567890',
        accountName: 'CryptoPro Ltd',
        swiftCode: 'CHASUS33'
    }
};

// ==================== APP STATE ====================
let appState = {
    accountType: 'demo',
    isAdmin: false,
    demoBalance: 10000,
    realBalance: 0,
    adminWallet: 0,
    pendingDeposits: [],
    pendingWithdrawals: [],
    transactions: []
};

// ==================== CRYPTO PRICES ====================
let cryptoPrices = {
    'BTC/USDT': 64250,
    'ETH/USDT': 3420,
    'BNB/USDT': 580
};

let priceChanges = {
    'BTC/USDT': 2.45,
    'ETH/USDT': -1.23,
    'BNB/USDT': 0.89
};

// ==================== LOAD & SAVE ====================
function loadState() {
    const saved = localStorage.getItem('cryptoProRealApp');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            appState = { ...appState, ...parsed, isAdmin: false };
        } catch (e) {}
    }
    updateUI();
}

function saveState() {
    const toSave = { ...appState };
    delete toSave.isAdmin;
    localStorage.setItem('cryptoProRealApp', JSON.stringify(toSave));
}

// ==================== UPDATE UI ====================
function updateUI() {
    const balance = appState.accountType === 'demo' ? appState.demoBalance : appState.realBalance;
    
    document.getElementById('totalBalance').textContent = '$' + balance.toFixed(2);
    document.getElementById('usdtAmount').textContent = balance.toFixed(2) + ' USDT';
    document.getElementById('usdtValue').textContent = '$' + balance.toFixed(2);
    
    // Update admin panel
    if (appState.isAdmin) {
        document.getElementById('adminPanel').classList.remove('hidden');
        document.getElementById('adminWallet').textContent = appState.adminWallet.toFixed(2);
        
        const depositsDiv = document.getElementById('pendingDeposits');
        if (appState.pendingDeposits.length > 0) {
            depositsDiv.innerHTML = '<div class="section-title">Pending Deposits</div>';
            appState.pendingDeposits.forEach(d => {
                depositsDiv.innerHTML += `
                    <div class="pending-item">
                        <div style="margin-bottom: 8px;">
                            <strong>$${d.amount.toFixed(2)}</strong> - Ref: ${d.reference}
                        </div>
                        <div style="font-size: 12px; color: rgba(255,255,255,0.6); margin-bottom: 12px;">
                            ${new Date(d.timestamp).toLocaleString()}<br>
                            ${d.notes || 'No notes'}
                        </div>
                        <div class="btn-group">
                            <button class="btn btn-primary btn-sm" onclick="approveDeposit('${d.id}')">✅ APPROVE</button>
                            <button class="btn btn-secondary btn-sm" onclick="rejectDeposit('${d.id}')">❌ REJECT</button>
                        </div>
                    </div>
                `;
            });
        } else {
            depositsDiv.innerHTML = '';
        }
        
        const withdrawalsDiv = document.getElementById('pendingWithdrawals');
        if (appState.pendingWithdrawals.length > 0) {
            withdrawalsDiv.innerHTML = '<div class="section-title">Pending Withdrawals</div>';
            appState.pendingWithdrawals.forEach(w => {
                withdrawalsDiv.innerHTML += `
                    <div class="pending-item">
                        <div style="margin-bottom: 8px;">
                            <strong>$${w.amount.toFixed(2)}</strong> - ${w.accountName}
                        </div>
                        <div style="font-size: 12px; color: rgba(255,255,255,0.6); margin-bottom: 12px;">
                            ${w.bankName} - ${w.accountNumber}<br>
                            ${new Date(w.timestamp).toLocaleString()}
                        </div>
                        <div class="btn-group">
                            <button class="btn btn-primary btn-sm" onclick="approveWithdrawal('${w.id}')">✅ APPROVE</button>
                            <button class="btn btn-secondary btn-sm" onclick="rejectWithdrawal('${w.id}')">❌ REJECT</button>
                        </div>
                    </div>
                `;
            });
        } else {
            withdrawalsDiv.innerHTML = '';
        }
    } else {
        document.getElementById('adminPanel').classList.add('hidden');
    }
}

// ==================== LIVE PRICE UPDATES ====================
function updatePrices() {
    Object.keys(cryptoPrices).forEach(pair => {
        const oldPrice = cryptoPrices[pair];
        const change = (Math.random() - 0.5) * 50;
        cryptoPrices[pair] = Math.max(oldPrice + change, oldPrice * 0.95);
        
        const changePercent = ((cryptoPrices[pair] - oldPrice) / oldPrice) * 100;
        priceChanges[pair] = changePercent;
        
        // Update display
        if (pair === 'BTC/USDT') {
            const el = document.getElementById('btcPrice');
            const asset = document.getElementById('btcAsset');
            el.textContent = '$' + cryptoPrices[pair].toFixed(2);
            document.getElementById('btcChange').textContent = (priceChanges[pair] >= 0 ? '+' : '') + priceChanges[pair].toFixed(2) + '%';
            document.getElementById('btcChange').className = 'asset-change ' + (priceChanges[pair] >= 0 ? 'positive' : 'negative');
            asset.classList.add(change >= 0 ? 'price-up' : 'price-down');
            setTimeout(() => asset.classList.remove('price-up', 'price-down'), 500);
        } else if (pair === 'ETH/USDT') {
            const el = document.getElementById('ethPrice');
            const asset = document.getElementById('ethAsset');
            el.textContent = '$' + cryptoPrices[pair].toFixed(2);
            document.getElementById('ethChange').textContent = (priceChanges[pair] >= 0 ? '+' : '') + priceChanges[pair].toFixed(2) + '%';
            document.getElementById('ethChange').className = 'asset-change ' + (priceChanges[pair] >= 0 ? 'positive' : 'negative');
            asset.classList.add(change >= 0 ? 'price-up' : 'price-down');
            setTimeout(() => asset.classList.remove('price-up', 'price-down'), 500);
        } else if (pair === 'BNB/USDT') {
            const el = document.getElementById('bnbPrice');
            const asset = document.getElementById('bnbAsset');
            el.textContent = '$' + cryptoPrices[pair].toFixed(2);
            document.getElementById('bnbChange').textContent = (priceChanges[pair] >= 0 ? '+' : '') + priceChanges[pair].toFixed(2) + '%';
            document.getElementById('bnbChange').className = 'asset-change ' + (priceChanges[pair] >= 0 ? 'positive' : 'negative');
            asset.classList.add(change >= 0 ? 'price-up' : 'price-down');
            setTimeout(() => asset.classList.remove('price-up', 'price-down'), 500);
        }
    });
}

// ==================== LIVE TRADING SIGNALS ====================
function generateSignal() {
    const pairs = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT'];
    const pair = pairs[Math.floor(Math.random() * pairs.length)];
    const type = Math.random() > 0.5 ? 'BUY' : 'SELL';
    const price = cryptoPrices[pair];
    const entry = price;
    const target = type === 'BUY' ? price * 1.05 : price * 0.95;
    const stop = type === 'BUY' ? price * 0.98 : price * 1.02;
    const confidence = Math.random() > 0.5 ? 'HIGH' : 'MEDIUM';
    
    const signalHTML = `
        <div class="signal-item">
            <div class="signal-header">
                <div class="signal-pair">${pair}</div>
                <div class="signal-type ${type.toLowerCase()}">${type} ${confidence === 'HIGH' ? '🔥' : '⚡'}</div>
            </div>
            <div class="signal-data">
                <div>
                    <div class="signal-label">ENTRY</div>
                    <div class="signal-value">$${entry.toFixed(2)}</div>
                </div>
                <div>
                    <div class="signal-label">TARGET</div>
                    <div class="signal-value" style="color: #00ff88;">$${target.toFixed(2)}</div>
                </div>
                <div>
                    <div class="signal-label">STOP</div>
                    <div class="signal-value" style="color: #ff006e;">$${stop.toFixed(2)}</div>
                </div>
            </div>
        </div>
    `;
    
    const feed = document.getElementById('signalsFeed');
    feed.insertAdjacentHTML('afterbegin', signalHTML);
    
    // Keep only last 3 signals
    while (feed.children.length > 3) {
        feed.removeChild(feed.lastChild);
    }
}

// ==================== LIVE MARKET ACTIVITY ====================
function generateMarketActivity() {
    const pairs = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'SOL/USDT', 'ADA/USDT'];
    const pair = pairs[Math.floor(Math.random() * pairs.length)];
    const type = Math.random() > 0.5 ? 'BUY' : 'SELL';
    const amount = (Math.random() * 5000 + 100).toFixed(2);
    const price = cryptoPrices[pair] || (Math.random() * 1000);
    
    const users = ['User_' + Math.floor(Math.random() * 9999), 'Trader_' + Math.floor(Math.random() * 9999), 'Pro_' + Math.floor(Math.random() * 9999)];
    const user = users[Math.floor(Math.random() * users.length)];
    
    const activityHTML = `
        <div class="feed-item ${type.toLowerCase()}">
            <div style="flex: 1;">
                <div style="font-weight: 700; margin-bottom: 4px;">${user}</div>
                <div style="font-size: 12px; color: rgba(255,255,255,0.6);">${pair} • ${type}</div>
            </div>
            <div style="text-align: right;">
                <div style="font-weight: 700; color: ${type === 'BUY' ? '#00ff88' : '#ff006e'};">$${amount}</div>
                <div style="font-size: 12px; color: rgba(255,255,255,0.6);">Just now</div>
            </div>
        </div>
    `;
    
    const feed = document.getElementById('marketFeed');
    feed.insertAdjacentHTML('afterbegin', activityHTML);
    
    // Remove old items
    if (feed.children.length > 8) {
        const lastItem = feed.lastChild;
        lastItem.classList.add('removing');
        setTimeout(() => feed.removeChild(lastItem), 500);
    }
}

// ==================== LIVE STATS UPDATES ====================
function updateLiveStats() {
    // Users
    const baseUsers = 1247;
    const variance = Math.floor(Math.random() * 100 - 50);
    document.getElementById('liveUsers').textContent = (baseUsers + variance).toLocaleString();
    
    // Volume
    const baseVolume = 97.5;
    const volumeChange = (Math.random() - 0.5) * 2;
    const newVolume = baseVolume + volumeChange;
    document.getElementById('volume24h').textContent = '$' + newVolume.toFixed(1) + 'M';
}

// ==================== ACCOUNT SWITCH ====================
function switchAccount(type) {
    appState.accountType = type;
    document.getElementById('demoBtn').classList.toggle('active', type === 'demo');
    document.getElementById('realBtn').classList.toggle('active', type === 'real');
    saveState();
    updateUI();
}

// ==================== MODAL FUNCTIONS ====================
function openModal(type) {
    const modal = document.getElementById(type + 'Modal');
    if (modal) {
        modal.classList.add('active');
        if (type === 'adminWithdraw') {
            document.getElementById('adminTotal').textContent = appState.adminWallet.toFixed(2);
        }
    }
}

function closeModal(type) {
    const modal = document.getElementById(type + 'Modal');
    if (modal) modal.classList.remove('active');
}

// ==================== DEPOSIT ====================
function submitDeposit() {
    if (appState.accountType === 'demo') {
        alert('❌ Switch to REAL account to make deposits');
        return;
    }
    
    const amount = parseFloat(document.getElementById('depositAmount').value);
    const reference = document.getElementById('depositReference').value.trim();
    const notes = document.getElementById('depositNotes').value.trim();
    
    if (!amount || amount < 10) {
        alert('❌ Minimum deposit is $10');
        return;
    }
    
    if (!reference) {
        alert('❌ Please enter transaction reference');
        return;
    }
    
    const deposit = {
        id: Date.now().toString(),
        amount: amount,
        reference: reference,
        notes: notes,
        timestamp: new Date().toISOString(),
        status: 'PENDING'
    };
    
    appState.pendingDeposits.push(deposit);
    appState.transactions.push({ ...deposit, type: 'DEPOSIT' });
    
    saveState();
    updateUI();
    closeModal('deposit');
    
    alert(`✅ Deposit request submitted!\n\nAmount: $${amount.toFixed(2)}\nReference: ${reference}\n\nYour deposit will be reviewed within 1-24 hours.`);
    
    document.getElementById('depositAmount').value = '';
    document.getElementById('depositReference').value = '';
    document.getElementById('depositNotes').value = '';
}

// ==================== TRADING ====================
function executeTrade() {
    const amount = parseFloat(document.getElementById('tradeAmount').value);
    const type = document.getElementById('tradeType').value;
    const pair = document.getElementById('tradePair').value;
    
    const balance = appState.accountType === 'demo' ? appState.demoBalance : appState.realBalance;
    
    if (!amount || amount < 10) {
        alert('❌ Minimum trade amount is $10');
        return;
    }
    
    if (balance < amount) {
        alert('❌ Insufficient balance');
        return;
    }
    
    alert('⏳ Executing trade...');
    
    setTimeout(() => {
        if (appState.accountType === 'demo') {
            appState.demoBalance -= amount;
        } else {
            appState.realBalance -= amount;
        }
        
        let profitMultiplier;
        if (appState.accountType === 'demo') {
            profitMultiplier = Math.random() < 0.85 ? (1 + (Math.random() * 0.10 + 0.05)) : (1 - (Math.random() * 0.03));
        } else {
            profitMultiplier = Math.random() < 0.45 ? (1 + (Math.random() * 0.08)) : (1 - (Math.random() * 0.15));
        }
        
        const finalAmount = amount * profitMultiplier;
        const profit = finalAmount - amount;
        
        if (appState.accountType === 'demo') {
            appState.demoBalance += finalAmount;
        } else {
            appState.realBalance += finalAmount;
        }
        
        appState.transactions.push({
            id: Date.now(),
            type: 'TRADE',
            pair: pair,
            tradeType: type,
            amount: amount,
            profit: profit,
            timestamp: new Date().toISOString(),
            account: appState.accountType
        });
        
        saveState();
        updateUI();
        closeModal('trade');
        
        if (profit > 0) {
            alert(`✅ Trade successful!\n\nProfit: $${profit.toFixed(2)}\nNew Balance: $${(appState.accountType === 'demo' ? appState.demoBalance : appState.realBalance).toFixed(2)}`);
        } else {
            alert(`❌ Trade closed in loss\n\nLoss: $${Math.abs(profit).toFixed(2)}\nRemaining: $${(appState.accountType === 'demo' ? appState.demoBalance : appState.realBalance).toFixed(2)}`);
        }
        
        document.getElementById('tradeAmount').value = '';
    }, 2000);
}

// ==================== WITHDRAWAL ====================
function submitWithdrawal() {
    if (appState.accountType === 'demo') {
        alert('❌ Switch to REAL account');
        return;
    }
    
    const amount = parseFloat(document.getElementById('withdrawAmount').value);
    const bankName = document.getElementById('userBankName').value.trim();
    const accountNumber = document.getElementById('userAccountNumber').value.trim();
    const accountName = document.getElementById('userAccountName').value.trim();
    
    if (!amount || amount < 10) {
        alert('❌ Minimum withdrawal is $10');
        return;
    }
    
    if (!bankName || !accountNumber || !accountName) {
        alert('❌ Please fill all bank details');
        return;
    }
    
    const fee = 2;
    const totalAmount = amount + fee;
    
    if (appState.realBalance < totalAmount) {
        alert(`❌ Insufficient balance\n\nRequired: $${totalAmount.toFixed(2)}\nYour balance: $${appState.realBalance.toFixed(2)}`);
        return;
    }
    
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
    
    appState.realBalance -= totalAmount;
    appState.pendingWithdrawals.push(withdrawal);
    appState.transactions.push({ ...withdrawal, type: 'WITHDRAWAL' });
    
    saveState();
    updateUI();
    closeModal('withdraw');
    
    alert(`⏳ Withdrawal request submitted!\n\nAmount: $${amount.toFixed(2)}\nFee: $2.00\n\nProcessing time: 1-48 hours`);
    
    document.getElementById('withdrawAmount').value = '';
    document.getElementById('userBankName').value = '';
    document.getElementById('userAccountNumber').value = '';
    document.getElementById('userAccountName').value = '';
}

// ==================== ADMIN FUNCTIONS ====================
function approveDeposit(id) {
    const deposit = appState.pendingDeposits.find(d => d.id === id);
    if (!deposit) return;
    
    if (confirm(`✅ Approve $${deposit.amount.toFixed(2)}?\n\nRef: ${deposit.reference}`)) {
        appState.realBalance += deposit.amount;
        appState.adminWallet += deposit.amount;
        appState.pendingDeposits = appState.pendingDeposits.filter(d => d.id !== id);
        
        const tx = appState.transactions.find(t => t.id === deposit.id);
        if (tx) tx.status = 'APPROVED';
        
        saveState();
        updateUI();
        alert('✅ Deposit approved!');
    }
}

function rejectDeposit(id) {
    const deposit = appState.pendingDeposits.find(d => d.id === id);
    if (!deposit) return;
    
    const reason = prompt('❌ Rejection reason:');
    if (!reason) return;
    
    appState.pendingDeposits = appState.pendingDeposits.filter(d => d.id !== id);
    
    const tx = appState.transactions.find(t => t.id === deposit.id);
    if (tx) {
        tx.status = 'REJECTED';
        tx.reason = reason;
    }
    
    saveState();
    updateUI();
    alert(`❌ Deposit rejected\n\nReason: ${reason}`);
}

function approveWithdrawal(id) {
    const withdrawal = appState.pendingWithdrawals.find(w => w.id === id);
    if (!withdrawal) return;
    
    if (confirm(`✅ Approve withdrawal?\n\nAmount: $${withdrawal.amount.toFixed(2)}\nTo: ${withdrawal.accountName}\n\nYou must send money to user's bank!`)) {
        appState.adminWallet -= (withdrawal.amount + withdrawal.fee);
        appState.pendingWithdrawals = appState.pendingWithdrawals.filter(w => w.id !== id);
        
        const tx = appState.transactions.find(t => t.id === withdrawal.id);
        if (tx) tx.status = 'COMPLETED';
        
        saveState();
        updateUI();
        alert('✅ Withdrawal approved!\n\nSend $' + withdrawal.amount.toFixed(2) + ' to user\'s bank now!');
    }
}

function rejectWithdrawal(id) {
    const withdrawal = appState.pendingWithdrawals.find(w => w.id === id);
    if (!withdrawal) return;
    
    const reason = prompt('❌ Rejection reason:');
    if (!reason) return;
    
    appState.realBalance += (withdrawal.amount + withdrawal.fee);
    appState.pendingWithdrawals = appState.pendingWithdrawals.filter(w => w.id !== id);
    
    const tx = appState.transactions.find(t => t.id === withdrawal.id);
    if (tx) {
        tx.status = 'REJECTED';
        tx.reason = reason;
    }
    
    saveState();
    updateUI();
    alert(`❌ Withdrawal rejected and refunded\n\nReason: ${reason}`);
}

function confirmAdminWithdraw() {
    const amount = parseFloat(document.getElementById('adminWithdrawAmount').value);
    const bankName = document.getElementById('adminBankName').value.trim();
    const accountNumber = document.getElementById('adminAccountNumber').value.trim();
    
    if (!amount || amount <= 0) {
        alert('❌ Enter valid amount');
        return;
    }
    
    if (amount > appState.adminWallet) {
        alert(`❌ Insufficient funds\n\nAvailable: $${appState.adminWallet.toFixed(2)}`);
        return;
    }
    
    if (!bankName || !accountNumber) {
        alert('❌ Fill in bank details');
        return;
    }
    
    if (confirm(`💸 Withdraw $${amount.toFixed(2)}?`)) {
        appState.adminWallet -= amount;
        
        appState.transactions.push({
            id: Date.now(),
            type: 'ADMIN_WITHDRAWAL',
            amount: amount,
            bankName: bankName,
            accountNumber: accountNumber,
            timestamp: new Date().toISOString(),
            status: 'COMPLETED'
        });
        
        saveState();
        updateUI();
        closeModal('adminWithdraw');
        
        alert(`✅ Withdrawal successful!\n\n$${amount.toFixed(2)} recorded.\n\nRemaining: $${appState.adminWallet.toFixed(2)}`);
        
        document.getElementById('adminWithdrawAmount').value = '';
        document.getElementById('adminBankName').value = '';
        document.getElementById('adminAccountNumber').value = '';
    }
}

function adminLogin() {
    const password = document.getElementById('adminPassword').value;
    
    if (password === CONFIG.ADMIN_PASSWORD) {
        appState.isAdmin = true;
        updateUI();
        closeModal('adminLogin');
        alert('✅ Admin login successful!');
        document.getElementById('adminPassword').value = '';
    } else {
        alert('❌ Invalid password!');
    }
}

function logout() {
    if (confirm('🚪 Logout?')) {
        appState.isAdmin = false;
        updateUI();
        alert('✅ Logged out');
    }
}

// ==================== INITIALIZE ====================
window.addEventListener('load', function() {
    loadState();
    updateUI();
    
    // Start live updates
    setInterval(updatePrices, 3000); // Prices every 3s
    setInterval(updateLiveStats, 5000); // Stats every 5s
    setInterval(generateSignal, 8000); // Signals every 8s
    setInterval(generateMarketActivity, 4000); // Activity every 4s
    setInterval(saveState, 10000); // Auto-save every 10s
    
    // Generate initial content
    generateSignal();
    generateSignal();
    generateMarketActivity();
    generateMarketActivity();
    
    // Close modals on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    });
    
    console.log('✅ CryptoPro ACTIVE System Loaded!');
});
