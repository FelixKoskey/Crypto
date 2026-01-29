// ==================== CONFIGURATION ====================
const CONFIG = {
ADMIN_PASSWORD: 'admin123', // CHANGE THIS!
BANK_DETAILS: {
bankName: 'Chase Bank',
accountNumber: '1234567890',
accountName: 'CryptoPro Ltd',
swiftCode: 'CHASUS33'
},
AUTO_APPROVE_DEPOSITS: true, // Auto-approve deposits
MINIMUM_DEPOSIT: 50, // Minimum deposit amount
MINIMUM_BALANCE_FOR_TRADING: 100, // Minimum balance to trade
TRADING_FEE: 0.001 // 0.1% trading fee
};

// ==================== APP STATE ====================
let appState = {
accountType: 'demo',
isAdmin: false,
demoBalance: 10000,
realBalance: 0,
adminWallet: 0,
pendingDeposits: [],
approvedDeposits: [],
pendingWithdrawals: [],
transactions: [],
activeTrades: [],
totalDeposited: 0,
totalWithdrawn: 0,
isActive: true
};

// ==================== CRYPTO PRICES ====================
let cryptoPrices = {
'BTC/USDT': 64250,
'ETH/USDT': 3420,
'BNB/USDT': 580,
'SOL/USDT': 145,
'XRP/USDT': 0.52
};

let priceChanges = {
'BTC/USDT': 2.45,
'ETH/USDT': -1.23,
'BNB/USDT': 0.89,
'SOL/USDT': 3.12,
'XRP/USDT': -0.45
};

// ==================== LOAD & SAVE ====================
function loadState() {
const saved = localStorage.getItem('cryptoProActiveApp');
if (saved) {
try {
const parsed = JSON.parse(saved);
appState = { ...appState, ...parsed, isAdmin: false, isActive: true };
} catch (e) {
console.error('Load error:', e);
}
}
updateUI();
checkAccountStatus();
}

function saveState() {
const toSave = { ...appState };
delete toSave.isAdmin;
localStorage.setItem('cryptoProActiveApp', JSON.stringify(toSave));
}

// ==================== CHECK ACCOUNT STATUS ====================
function checkAccountStatus() {
if (appState.accountType === 'real' && appState.realBalance < CONFIG.MINIMUM_BALANCE_FOR_TRADING) {
showDepositPrompt();
}
}

function showDepositPrompt() {
const needed = CONFIG.MINIMUM_BALANCE_FOR_TRADING - appState.realBalance;
if (needed > 0) {
const msg = 💰 Deposit Required\n\nYour balance: $${appState.realBalance.toFixed(2)}\nMinimum required: $${CONFIG.MINIMUM_BALANCE_FOR_TRADING}\n\nDeposit at least $${Math.max(needed, CONFIG.MINIMUM_DEPOSIT).toFixed(2)} to start trading!;

if (confirm(msg + '\n\nOpen deposit page?')) {  
        openModal('deposit');  
    }  
}

}

// ==================== UPDATE UI ====================
function updateUI() {
const balance = appState.accountType === 'demo' ? appState.demoBalance : appState.realBalance;

document.getElementById('totalBalance').textContent = '$' + balance.toFixed(2);  
document.getElementById('usdtAmount').textContent = balance.toFixed(2) + ' USDT';  
document.getElementById('usdtValue').textContent = '$' + balance.toFixed(2);  
  
// Update account type indicator  
const accountIndicator = document.querySelector('.account-type-indicator');  
if (accountIndicator) {  
    accountIndicator.textContent = appState.accountType === 'demo' ? '🎮 DEMO MODE' : '💰 REAL MONEY';  
    accountIndicator.style.background = appState.accountType === 'demo' ? '#ff9800' : '#00ff88';  
}  
  
// Update stats  
document.getElementById('totalDeposited').textContent = '$' + appState.totalDeposited.toFixed(2);  
document.getElementById('activeTrades').textContent = appState.activeTrades.length;  
  
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
        depositsDiv.innerHTML = '<div style="padding: 20px; text-align: center; color: rgba(255,255,255,0.5);">No pending deposits</div>';  
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
        withdrawalsDiv.innerHTML = '<div style="padding: 20px; text-align: center; color: rgba(255,255,255,0.5);">No pending withdrawals</div>';  
    }  
} else {  
    document.getElementById('adminPanel').classList.add('hidden');  
}

}

// ==================== LIVE PRICE UPDATES ====================
function updatePrices() {
Object.keys(cryptoPrices).forEach(pair => {
const oldPrice = cryptoPrices[pair];
const volatility = pair === 'BTC/USDT' ? 100 : (pair === 'ETH/USDT' ? 20 : 5);
const change = (Math.random() - 0.5) * volatility;
cryptoPrices[pair] = Math.max(oldPrice + change, oldPrice * 0.95);

const changePercent = ((cryptoPrices[pair] - oldPrice) / oldPrice) * 100;  
    priceChanges[pair] = changePercent;  
      
    // Update display  
    updatePriceDisplay(pair, changePercent > 0);  
});  
  
// Update active trades  
updateActiveTrades();

}

function updatePriceDisplay(pair, isUp) {
const pairKey = pair.split('/')[0].toLowerCase();
const priceEl = document.getElementById(pairKey + 'Price');
const changeEl = document.getElementById(pairKey + 'Change');
const assetEl = document.getElementById(pairKey + 'Asset');

if (priceEl && changeEl && assetEl) {  
    priceEl.textContent = '$' + cryptoPrices[pair].toFixed(2);  
    changeEl.textContent = (priceChanges[pair] >= 0 ? '+' : '') + priceChanges[pair].toFixed(2) + '%';  
    changeEl.className = 'asset-change ' + (priceChanges[pair] >= 0 ? 'positive' : 'negative');  
    assetEl.classList.add(isUp ? 'price-up' : 'price-down');  
    setTimeout(() => assetEl.classList.remove('price-up', 'price-down'), 500);  
}

}

// ==================== ACTIVE TRADES MANAGEMENT ====================
function updateActiveTrades() {
appState.activeTrades.forEach((trade, index) => {
const currentPrice = cryptoPrices[trade.pair];
const priceChange = currentPrice - trade.entryPrice;
const profitLoss = trade.type === 'BUY' ? priceChange : -priceChange;
const profitLossPercent = (profitLoss / trade.entryPrice) * 100;

trade.currentPrice = currentPrice;  
    trade.profitLoss = profitLoss * (trade.amount / trade.entryPrice);  
    trade.profitLossPercent = profitLossPercent;  
      
    // Auto-close on target or stop loss  
    if (trade.type === 'BUY') {  
        if (currentPrice >= trade.target || currentPrice <= trade.stopLoss) {  
            closeTrade(index);  
        }  
    } else {  
        if (currentPrice <= trade.target || currentPrice >= trade.stopLoss) {  
            closeTrade(index);  
        }  
    }  
});  
  
saveState();

}

function closeTrade(index) {
const trade = appState.activeTrades[index];
if (!trade) return;

const finalAmount = trade.amount + trade.profitLoss;  
  
if (appState.accountType === 'demo') {  
    appState.demoBalance += finalAmount;  
} else {  
    appState.realBalance += finalAmount;  
}  
  
appState.transactions.push({  
    id: Date.now(),  
    type: 'TRADE_CLOSED',  
    pair: trade.pair,  
    tradeType: trade.type,  
    entryPrice: trade.entryPrice,  
    exitPrice: trade.currentPrice,  
    amount: trade.amount,  
    profit: trade.profitLoss,  
    timestamp: new Date().toISOString(),  
    account: appState.accountType  
});  
  
appState.activeTrades.splice(index, 1);  
saveState();  
updateUI();  
  
const msg = trade.profitLoss > 0   
    ? `✅ Trade Closed - PROFIT!\n\n${trade.pair} ${trade.type}\nProfit: $${trade.profitLoss.toFixed(2)}`  
    : `❌ Trade Closed - LOSS\n\n${trade.pair} ${trade.type}\nLoss: $${Math.abs(trade.profitLoss).toFixed(2)}`;  
  
showNotification(msg);

}

// ==================== LIVE TRADING SIGNALS ====================
function generateSignal() {
const pairs = Object.keys(cryptoPrices);
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
if (feed) {  
    feed.insertAdjacentHTML('afterbegin', signalHTML);  
    while (feed.children.length > 3) {  
        feed.removeChild(feed.lastChild);  
    }  
}

}

// ==================== LIVE MARKET ACTIVITY ====================
function generateMarketActivity() {
const pairs = Object.keys(cryptoPrices);
const pair = pairs[Math.floor(Math.random() * pairs.length)];
const type = Math.random() > 0.5 ? 'BUY' : 'SELL';
const amount = (Math.random() * 5000 + 100).toFixed(2);

const users = ['Pro_Trader', 'Crypto_King', 'Moon_Hunter', 'Diamond_Hands', 'Whale_Alert'];  
const user = users[Math.floor(Math.random() * users.length)] + '_' + Math.floor(Math.random() * 999);  
  
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
if (feed) {  
    feed.insertAdjacentHTML('afterbegin', activityHTML);  
    if (feed.children.length > 8) {  
        const lastItem = feed.lastChild;  
        lastItem.classList.add('removing');  
        setTimeout(() => {  
            if (feed.contains(lastItem)) feed.removeChild(lastItem);  
        }, 500);  
    }  
}

}

// ==================== LIVE STATS UPDATES ====================
function updateLiveStats() {
const baseUsers = 1247;
const variance = Math.floor(Math.random() * 100 - 50);
const usersEl = document.getElementById('liveUsers');
if (usersEl) usersEl.textContent = (baseUsers + variance).toLocaleString();

const baseVolume = 97.5;  
const volumeChange = (Math.random() - 0.5) * 2;  
const newVolume = baseVolume + volumeChange;  
const volumeEl = document.getElementById('volume24h');  
if (volumeEl) volumeEl.textContent = '$' + newVolume.toFixed(1) + 'M';

}

// ==================== ACCOUNT SWITCH ====================
function switchAccount(type) {
appState.accountType = type;
document.getElementById('demoBtn').classList.toggle('active', type === 'demo');
document.getElementById('realBtn').classList.toggle('active', type === 'real');
saveState();
updateUI();

if (type === 'real') {  
    checkAccountStatus();  
}

}

// ==================== MODAL FUNCTIONS ====================
function openModal(type) {
const modal = document.getElementById(type + 'Modal');
if (modal) {
modal.classList.add('active');
if (type === 'adminWithdraw') {
document.getElementById('adminTotal').textContent = appState.adminWallet.toFixed(2);
}
if (type === 'deposit') {
// Show bank details
document.getElementById('depositBankName').textContent = CONFIG.BANK_DETAILS.bankName;
document.getElementById('depositAccountNumber').textContent = CONFIG.BANK_DETAILS.accountNumber;
document.getElementById('depositAccountName').textContent = CONFIG.BANK_DETAILS.accountName;
}
}
}

function closeModal(type) {
const modal = document.getElementById(type + 'Modal');
if (modal) modal.classList.remove('active');
}

// ==================== DEPOSIT (AUTO-APPROVE) ====================
function submitDeposit() {
if (appState.accountType === 'demo') {
alert('❌ Switch to REAL account to make deposits');
return;
}

const amount = parseFloat(document.getElementById('depositAmount').value);  
const reference = document.getElementById('depositReference').value.trim();  
const notes = document.getElementById('depositNotes').value.trim();  
  
if (!amount || amount < CONFIG.MINIMUM_DEPOSIT) {  
    alert(`❌ Minimum deposit is $${CONFIG.MINIMUM_DEPOSIT}`);  
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
  
if (CONFIG.AUTO_APPROVE_DEPOSITS) {  
    // AUTO-APPROVE INSTANTLY  
    appState.realBalance += amount;  
    appState.adminWallet += amount;  
    appState.totalDeposited += amount;  
    deposit.status = 'APPROVED';  
    appState.approvedDeposits.push(deposit);  
      
    appState.transactions.push({ ...deposit, type: 'DEPOSIT' });  
      
    saveState();  
    updateUI();  
    closeModal('deposit');  
      
    alert(`✅ DEPOSIT APPROVED!\n\nAmount: $${amount.toFixed(2)}\nReference: ${reference}\n\n💰 Your balance has been updated!\n\nNew Balance: $${appState.realBalance.toFixed(2)}`);  
} else {  
    appState.pendingDeposits.push(deposit);  
    appState.transactions.push({ ...deposit, type: 'DEPOSIT' });  
      
    saveState();  
    updateUI();  
    closeModal('deposit');  
      
    alert(`✅ Deposit request submitted!\n\nAmount: $${amount.toFixed(2)}\nReference: ${reference}\n\nYour deposit will be reviewed within 1-24 hours.`);  
}  
  
document.getElementById('depositAmount').value = '';  
document.getElementById('depositReference').value = '';  
document.getElementById('depositNotes').value = '';

}

// ==================== TRADING (WORKING) ====================
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
    if (appState.accountType === 'real') {  
        alert(`❌ Insufficient balance!\n\nYour balance: $${balance.toFixed(2)}\nRequired: $${amount.toFixed(2)}\n\nPlease deposit more funds.`);  
        if (confirm('Open deposit page?')) {  
            closeModal('trade');  
            openModal('deposit');  
        }  
    } else {  
        alert('❌ Insufficient balance');  
    }  
    return;  
}  
  
// Check minimum balance for real account  
if (appState.accountType === 'real' && balance < CONFIG.MINIMUM_BALANCE_FOR_TRADING) {  
    alert(`❌ Minimum balance required: $${CONFIG.MINIMUM_BALANCE_FOR_TRADING}\n\nYour balance: $${balance.toFixed(2)}\n\nPlease deposit more funds.`);  
    if (confirm('Open deposit page?')) {  
        closeModal('trade');  
        openModal('deposit');  
    }  
    return;  
}  
  
// Deduct amount  
if (appState.accountType === 'demo') {  
    appState.demoBalance -= amount;  
} else {  
    appState.realBalance -= amount;  
}  
  
// Create trade  
const entryPrice = cryptoPrices[pair];  
const target = type === 'BUY' ? entryPrice * 1.05 : entryPrice * 0.95;  
const stopLoss = type === 'BUY' ? entryPrice * 0.98 : entryPrice * 1.02;  
  
const trade = {  
    id: Date.now().toString(),  
    pair: pair,  
    type: type,  
    amount: amount,  
    entryPrice: entryPrice,  
    currentPrice: entryPrice,  
    target: target,  
    stopLoss: stopLoss,  
    profitLoss: 0,  
    profitLossPercent: 0,  
    timestamp: new Date().toISOString()  
};  
  
appState.activeTrades.push(trade);  
  
appState.transactions.push({  
    id: Date.now(),  
    type: 'TRADE_OPENED',  
    pair: pair,  
    tradeType: type,  
    amount: amount,  
    entryPrice: entryPrice,  
    timestamp: new Date().toISOString(),  
    account: appState.accountType  
});  
  
saveState();  
updateUI();  
closeModal('trade');  
  
alert(`✅ Trade Executed!\n\n${pair} ${type}\nAmount: $${amount.toFixed(2)}\nEntry: $${entryPrice.toFixed(2)}\nTarget: $${target.toFixed(2)}\nStop Loss: $${stopLoss.toFixed(2)}\n\n📊 Trade is now active!`);  
  
document.getElementById('tradeAmount').value = '';

}

// ==================== WITHDRAWAL ====================
function submitWithdrawal() {
if (appState.accountType === 'demo') {
alert('❌ Switch to REAL account to withdraw');
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
    alert(`❌ Insufficient balance\n\nRequired: $${totalAmount.toFixed(2)} (including $2 fee)\nYour balance: $${appState.realBalance.toFixed(2)}\n\nDeposit more funds to withdraw.`);  
    if (confirm('Open deposit page?')) {  
        closeModal('withdraw');  
        openModal('deposit');  
    }  
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
  
alert(`⏳ Withdrawal Request Submitted!\n\nAmount: $${amount.toFixed(2)}\nFee: $2.00\nTotal Deducted: $${totalAmount.toFixed(2)}\n\nProcessing time: 1-48 hours\n\nYou will receive confirmation once processed.`);  
  
document.getElementById('withdrawAmount').value = '';  
document.getElementById('userBankName').value = '';  
document.getElementById('userAccountNumber').value = '';  
document.getElementById('userAccountName').value = '';

}

// ==================== ADMIN FUNCTIONS ====================
function approveDeposit(id) {
const deposit = appState.pendingDeposits.find(d => d.id === id);
if (!deposit) return;

if (confirm(`✅ Approve deposit of $${deposit.amount.toFixed(2)}?\n\nRef: ${deposit.reference}`)) {  
    appState.realBalance += deposit.amount;  
    appState.adminWallet += deposit.amount;  
    appState.totalDeposited += deposit.amount;  
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
    appState.totalWithdrawn += withdrawal.amount;  
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
  
if (confirm(`💸 Withdraw $${amount.toFixed(2)} from admin wallet?`)) {  
    appState.adminWallet -= amount;  
      
    appState.transactions.push({  
        id: Date.now(),  
        type: 'ADMIN_WITHDRAWAL',  
        amount: amount,  
        bankName: bankName,  
        accountNumber: accountNumber,  
        timestamp: new Date().toISOString(),  
        status: 'COMPLETED'  
    });saveState();  
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
if (confirm('🚪 Logout from admin panel?')) {
appState.isAdmin = false;
updateUI();
alert('✅ Logged out');
}
}

// ==================== NOTIFICATIONS ====================
function showNotification(message) {
// Simple alert for now - can be enhanced with toast notifications
console.log('NOTIFICATION:', message);
}

// ==================== INITIALIZE ====================
window.addEventListener('load', function() {
console.log('🚀 CryptoPro Active App Loading...');

loadState();  
updateUI();  
  
// Start live updates  
setInterval(updatePrices, 2000); // Prices every 2s  
setInterval(updateLiveStats, 5000); // Stats every 5s  
setInterval(generateSignal, 8000); // Signals every 8s  
setInterval(generateMarketActivity, 3000); // Activity every 3s  
setInterval(saveState, 5000); // Auto-save every 5s  
  
// Generate initial content  
setTimeout(() => {  
    generateSignal();  
    generateSignal();  
    generateMarketActivity();  
    generateMarketActivity();  
    generateMarketActivity();  
}, 500);  
  
// Close modals on outside click  
document.querySelectorAll('.modal').forEach(modal => {  
    modal.addEventListener('click', function(e) {  
        if (e.target === this) {  
            this.classList.remove('active');  
        }  
    });  
});  
  
// Add keyboard shortcuts  
document.addEventListener('keydown', function(e) {  
    if (e.key === 'Escape') {  
        document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));  
    }  
});  
  
console.log('✅ CryptoPro FULLY ACTIVE!');  
console.log('💰 Auto-Approve Deposits:', CONFIG.AUTO_APPROVE_DEPOSITS ? 'ENABLED' : 'DISABLED');  
console.log('📊 Minimum Deposit: $' + CONFIG.MINIMUM_DEPOSIT);  
console.log('🎯 Trading Active: YES');  
console.log('💸 Withdrawals Active: YES');

});

// ==================== HELPER FUNCTIONS ====================
function resetApp() {
if (confirm('⚠️ RESET ALL DATA?\n\nThis will delete:\n- All balances\n- All transactions\n- All pending requests\n\nThis action cannot be undone!')) {
if (confirm('Are you ABSOLUTELY sure?')) {
localStorage.removeItem('cryptoProActiveApp');
location.reload();
}
}
}

function exportData() {
const data = JSON.stringify(appState, null, 2);
const blob = new Blob([data], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'cryptopro-backup-' + Date.now() + '.json';
a.click();
URL.revokeObjectURL(url);
alert('✅ Data exported successfully!');
}

// Make functions globally available
window.switchAccount = switchAccount;
window.openModal = openModal;
window.closeModal = closeModal;
window.submitDeposit = submitDeposit;
window.executeTrade = executeTrade;
window.submitWithdrawal = submitWithdrawal;
window.approveDeposit = approveDeposit;
window.rejectDeposit = rejectDeposit;
window.approveWithdrawal = approveWithdrawal;
window.rejectWithdrawal = rejectWithdrawal;
window.confirmAdminWithdraw = confirmAdminWithdraw;
window.adminLogin = adminLogin;
window.logout = logout;
window.resetApp = resetApp;
window.exportData = exportData;
