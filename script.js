const { useState, useEffect, useRef } = React;

// ==================== SIMULATE LIVE STATS ====================
function updateLiveStats() {
    const baseUsers = 1247;
    const variance = Math.floor(Math.random() * 100 - 50);
    const activeUsers = baseUsers + variance;
    document.getElementById('active-users').textContent = activeUsers.toLocaleString();
    
    const baseVolume = 97500000;
    const volumeVariance = Math.floor(Math.random() * 5000000 - 2500000);
    const volume = baseVolume + volumeVariance;
    document.getElementById('volume-24h').textContent = '$' + (volume / 1000000).toFixed(1) + 'M';
}

// ==================== LOADING SCREEN ====================
window.addEventListener('load', () => {
    setTimeout(() => {
        document.getElementById('loading-screen').classList.add('hidden');
        document.getElementById('live-stats').classList.remove('hidden');
        updateLiveStats();
        setInterval(updateLiveStats, 5000);
    }, 2000);
});

// ==================== DATA STORE ====================
class AppStore {
    constructor() {
        this.listeners = new Set();
        this.state = {
            accountType: 'DEMO',
            demoWallets: {
                BTC: { balance: 0, locked: 0 },
                ETH: { balance: 0, locked: 0 },
                USDT: { balance: 10000, locked: 0 },
                BNB: { balance: 0, locked: 0 },
                SOL: { balance: 0, locked: 0 }
            },
            realWallets: {
                BTC: { balance: 0, locked: 0 },
                ETH: { balance: 0, locked: 0 },
                USDT: { balance: 0, locked: 0 },
                BNB: { balance: 0, locked: 0 },
                SOL: { balance: 0, locked: 0 }
            },
            prices: {
                'BTC/USDT': 45000,
                'ETH/USDT': 3000,
                'BNB/USDT': 350,
                'SOL/USDT': 120,
                'ADA/USDT': 0.60
            },
            priceChanges: {},
            signals: [],
            transactions: [],
            pendingWithdrawals: [],
            currentScreen: 'home',
            liveUsers: 1247,
            volume24h: 97500000,
            // ADMIN WALLET - Collects all real money
            adminWallet: 0
        };
        
        const saved = localStorage.getItem('cryptoTradeApp');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this.state = { ...this.state, ...parsed };
            } catch (e) {}
        }
        
        this.startPriceUpdates();
        this.startSignalGeneration();
    }
    
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    
    setState(updates) {
        this.state = { ...this.state, ...updates };
        this.save();
        this.notify();
    }
    
    save() {
        const toSave = {
            accountType: this.state.accountType,
            demoWallets: this.state.demoWallets,
            realWallets: this.state.realWallets,
            transactions: this.state.transactions,
            pendingWithdrawals: this.state.pendingWithdrawals,
            adminWallet: this.state.adminWallet
        };
        localStorage.setItem('cryptoTradeApp', JSON.stringify(toSave));
    }
    
    notify() {
        this.listeners.forEach(listener => listener(this.state));
    }
    
    getCurrentWallets() {
        return this.state.accountType === 'DEMO' 
            ? this.state.demoWallets 
            : this.state.realWallets;
    }
    
    updateBalance(currency, amount) {
        const wallets = this.getCurrentWallets();
        const wallet = wallets[currency];
        if (!wallet) return;
        
        wallet.balance += amount;
        
        if (this.state.accountType === 'DEMO') {
            this.setState({ demoWallets: { ...this.state.demoWallets } });
        } else {
            this.setState({ realWallets: { ...this.state.realWallets } });
        }
    }
    
    addTransaction(transaction) {
        this.setState({
            transactions: [transaction, ...this.state.transactions]
        });
    }
    
    startPriceUpdates() {
        setInterval(() => {
            const prices = { ...this.state.prices };
            const changes = {};
            
            Object.keys(prices).forEach(pair => {
                const oldPrice = prices[pair];
                const changePercent = (Math.random() - 0.5) * 2;
                const change = oldPrice * (changePercent / 100);
                prices[pair] = Math.max(oldPrice + change, oldPrice * 0.95);
                changes[pair] = {
                    absolute: change,
                    percent: changePercent,
                    direction: change >= 0 ? 'up' : 'down'
                };
            });
            
            this.setState({ prices, priceChanges: changes });
        }, 3000);
    }
    
    startSignalGeneration() {
        const generateSignals = () => {
            const pairs = Object.keys(this.state.prices);
            const newSignals = [];
            
            pairs.forEach(pair => {
                if (Math.random() < 0.4) {
                    const price = this.state.prices[pair];
                    const rsi = 30 + Math.random() * 40;
                    const type = rsi < 40 ? 'BUY' : 'SELL';
                    const confidence = rsi < 35 || rsi > 65 ? 'HIGH' : 'MEDIUM';
                    
                    newSignals.push({
                        id: `${pair}_${Date.now()}_${Math.random()}`,
                        pair,
                        type,
                        entryPrice: price,
                        targetPrice: type === 'BUY' ? price * 1.05 : price * 0.95,
                        stopLoss: type === 'BUY' ? price * 0.98 : price * 1.02,
                        confidence,
                        timestamp: Date.now(),
                        analysis: `RSI ${rsi.toFixed(0)} - ${type === 'BUY' ? 'Oversold' : 'Overbought'} conditions detected. ${confidence === 'HIGH' ? 'Strong' : 'Moderate'} momentum.`
                    });
                }
            });
            
            this.setState({ signals: newSignals });
            document.getElementById('active-signals').textContent = newSignals.length;
        };
        
        generateSignals();
        setInterval(generateSignals, 45000);
    }
    
    // ==================== INSTANT DEPOSIT (NO APPROVAL) ====================
    async processDeposit(amount, paymentMethod) {
        if (this.state.accountType !== 'REAL') {
            throw new Error('Switch to REAL account to deposit');
        }
        
        if (amount < 10) {
            throw new Error('Minimum deposit is $10');
        }
        
        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const fee = amount * 0.029; // 2.9% fee
        const netAmount = amount - fee;
        
        const transaction = {
            id: `dep_${Date.now()}`,
            type: 'DEPOSIT',
            amount: netAmount,
            fee,
            currency: 'USDT',
            status: 'COMPLETED', // ✅ INSTANT - NO APPROVAL
            timestamp: Date.now(),
            method: paymentMethod
        };
        
        // ✅ INSTANTLY add to user balance
        this.updateBalance('USDT', netAmount);
        
        // ✅ Add full amount to ADMIN WALLET
        this.setState({
            adminWallet: this.state.adminWallet + amount
        });
        
        this.addTransaction(transaction);
        
        return transaction;
    }
    
    // ==================== WITHDRAWAL (NEEDS ADMIN APPROVAL) ====================
    async processWithdrawal(amount, details) {
        if (this.state.accountType !== 'REAL') {
            throw new Error('Switch to REAL account to withdraw');
        }
        
        const wallets = this.getCurrentWallets();
        if (wallets.USDT.balance < amount) {
            throw new Error('Insufficient balance');
        }
        
        const fee = 2; // $2 flat fee
        const totalAmount = amount + fee;
        
        if (wallets.USDT.balance < totalAmount) {
            throw new Error(`Insufficient balance (fee: $${fee})`);
        }
        
        const transaction = {
            id: `wdr_${Date.now()}`,
            type: 'WITHDRAWAL',
            amount,
            fee,
            currency: 'USDT',
            status: 'PENDING', // ⏳ NEEDS YOUR APPROVAL
            timestamp: Date.now(),
            details
        };
        
        // Lock user funds
        this.updateBalance('USDT', -totalAmount);
        
        // Add to pending queue
        this.setState({
            pendingWithdrawals: [...this.state.pendingWithdrawals, transaction]
        });
        this.addTransaction(transaction);
        
        return transaction;
    }
    
    // ==================== ADMIN: APPROVE WITHDRAWAL ====================
    async approveWithdrawal(transactionId) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const withdrawal = this.state.pendingWithdrawals.find(w => w.id === transactionId);
        if (!withdrawal) throw new Error('Withdrawal not found');
        
        const approved = { ...withdrawal, status: 'COMPLETED', completedAt: Date.now() };
        
        // ✅ Deduct from admin wallet (money sent to user)
        this.setState({
            adminWallet: this.state.adminWallet - (withdrawal.amount + withdrawal.fee),
            pendingWithdrawals: this.state.pendingWithdrawals.filter(w => w.id !== transactionId),
            transactions: this.state.transactions.map(t => 
                t.id === transactionId ? approved : t
            )
        });
        
        return approved;
    }
    
    // ==================== ADMIN: REJECT WITHDRAWAL ====================
    async rejectWithdrawal(transactionId, reason) {
        const withdrawal = this.state.pendingWithdrawals.find(w => w.id === transactionId);
        if (!withdrawal) throw new Error('Withdrawal not found');
        
        // ✅ Refund user (no money leaves admin wallet)
        this.updateBalance('USDT', withdrawal.amount + withdrawal.fee);
        
        const rejected = { ...withdrawal, status: 'FAILED', reason };
        
        this.setState({
            pendingWithdrawals: this.state.pendingWithdrawals.filter(w => w.id !== transactionId),
            transactions: this.state.transactions.map(t => 
                t.id === transactionId ? rejected : t
            )
        });
        
        return rejected;
    }
    
    // ==================== ADMIN: WITHDRAW ALL FUNDS ====================
    async adminWithdrawAll(bankDetails) {
        if (this.state.adminWallet <= 0) {
            throw new Error('No funds available to withdraw');
        }
        
        const amount = this.state.adminWallet;
        
        const transaction = {
            id: `admin_wdr_${Date.now()}`,
            type: 'ADMIN_WITHDRAWAL',
            amount,
            fee: 0,
            currency: 'USDT',
            status: 'COMPLETED',
            timestamp: Date.now(),
            details: bankDetails
        };
        
        // ✅ Withdraw all from admin wallet
        this.setState({
            adminWallet: 0
        });
        
        this.addTransaction(transaction);
        
        return transaction;
    }
    
    resetDemoAccount() {
        this.setState({
            demoWallets: {
                BTC: { balance: 0, locked: 0 },
                ETH: { balance: 0, locked: 0 },
                USDT: { balance: 10000, locked: 0 },
                BNB: { balance: 0, locked: 0 },
                SOL: { balance: 0, locked: 0 }
            }
        });
    }
}

const store = new AppStore();

// ==================== CUSTOM HOOK ====================
function useStore() {
    const [state, setState] = useState(store.state);
    
    useEffect(() => {
        return store.subscribe(setState);
    }, []);
    
    return [state, store];
}

// ==================== MAIN APP COMPONENT ====================
function App() {
    const [state, appStore] = useStore();
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [showAdminWithdrawModal, setShowAdminWithdrawModal] = useState(false);
    
    const wallets = appStore.getCurrentWallets();
    const totalBalance = Object.entries(wallets).reduce((sum, [currency, wallet]) => {
        const price = currency === 'USDT' ? 1 : state.prices[`${currency}/USDT`] || 0;
        return sum + (wallet.balance * price);
    }, 0);

    return (
        <div>
            {/* Header Card */}
            <div className="glass p-6 mb-6 slide-in">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">🚀 CryptoTrade Pro</h1>
                        <p style={{color: 'rgba(255,255,255,0.7)'}}>Live Professional Trading Platform</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        {/* Admin Wallet Display */}
                        <div className="glass p-3 rounded-xl">
                            <div style={{textAlign: 'center'}}>
                                <p style={{color: 'rgba(255,255,255,0.7)', fontSize: '12px'}}>💰 Admin Wallet</p>
                                <p className="font-bold text-lg" style={{color: '#4CAF50'}}>
                                    ${state.adminWallet.toFixed(2)}
                                </p>
                                {state.adminWallet > 0 && (
                                    <button
                                        onClick={() => setShowAdminWithdrawModal(true)}
                                        style={{
                                            marginTop: '8px',
                                            padding: '6px 12px',
                                            background: '#4CAF50',
                                            color: 'white',
                                            borderRadius: '8px',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            border: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        💸 Withdraw All
                                    </button>
                                )}
                            </div>
                        </div>
                        
                        {/* Account Switcher */}
                        <div className="glass p-3 rounded-xl">
                            <div className="flex items-center gap-3">
                                <span style={{color: 'rgba(255,255,255,0.7)', fontSize: '14px'}}>
                                    {state.accountType === 'DEMO' ? '🎮 Demo' : '💰 Real'}
                                </span>
                                <label style={{position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer'}}>
                                    <input 
                                        type="checkbox" 
                                        style={{position: 'absolute', opacity: 0}}
                                        checked={state.accountType === 'REAL'}
                                        onChange={(e) => appStore.setState({ 
                                            accountType: e.target.checked ? 'REAL' : 'DEMO' 
                                        })}
                                    />
                                    <div style={{
                                        width: '44px',
                                        height: '24px',
                                        background: state.accountType === 'REAL' ? '#4CAF50' : 'rgba(255,255,255,0.2)',
                                        borderRadius: '12px',
                                        position: 'relative',
                                        transition: 'background 0.3s'
                                    }}>
                                        <div style={{
                                            position: 'absolute',
                                            top: '2px',
                                            left: state.accountType === 'REAL' ? '22px' : '2px',
                                            width: '20px',
                                            height: '20px',
                                            background: 'white',
                                            borderRadius: '50%',
                                            transition: 'left 0.3s'
                                        }}></div>
                                    </div>
                                </label>
                            </div>
                        </div>
                        
                        {state.pendingWithdrawals.length > 0 && (
                            <button
                                onClick={() => setShowAdminModal(true)}
                                className="btn-warning rounded-xl font-semibold"
                                style={{padding: '12px 20px'}}
                            >
                                🔔 Admin ({state.pendingWithdrawals.length})
                            </button>
                        )}
                    </div>
                </div>

                {/* Balance Display */}
                <div style={{
                    background: 'linear-gradient(135deg, rgba(66, 126, 234, 0.2), rgba(118, 75, 162, 0.2))',
                    borderRadius: '16px',
                    padding: '24px'
                }}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p style={{color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginBottom: '4px'}}>
                                Total Balance
                            </p>
                            <h2 className="text-4xl font-bold mb-1">
                                ${totalBalance.toLocaleString('en-US', { 
                                    minimumFractionDigits: 2, 
                                    maximumFractionDigits: 2 
                                })}
                            </h2>
                            <p style={{color: '#4CAF50', fontSize: '14px'}}>+5.24% (24h) 📈</p>
                        </div>
                        
                        <div className="flex gap-3">
                            {state.accountType === 'REAL' ? (
                                <>
                                    <button
                                        onClick={() => setShowDepositModal(true)}
                                        className="btn-success rounded-xl font-semibold"
                                        style={{padding: '14px 24px'}}
                                    >
                                        💵 Deposit (Instant)
                                    </button>
                                    <button
                                        onClick={() => setShowWithdrawModal(true)}
                                        className="btn-primary rounded-xl font-semibold"
                                        style={{padding: '14px 24px'}}
                                    >
                                        💸 Withdraw
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => appStore.resetDemoAccount()}
                                    className="btn-primary rounded-xl font-semibold"
                                    style={{padding: '14px 24px'}}
                                >
                                    🔄 Reset Demo ($10,000)
                                </button>
                            )}
                        </div>
                    </div>
                    
                    {state.accountType === 'DEMO' && (
                        <div style={{
                            marginTop: '16px',
                            background: 'rgba(33, 150, 243, 0.2)',
                            borderRadius: '12px',
                            padding: '12px'
                        }}>
                            <p style={{color: '#64B5F6', fontSize: '14px'}}>
                                ℹ️ Demo Mode: Practice with virtual money. Switch to REAL to trade with real USD.
                            </p>
                        </div>
                    )}
                    
                    {state.accountType === 'REAL' && (
                        <div style={{
                            marginTop: '16px',
                            background: 'rgba(76, 175, 80, 0.2)',
                            borderRadius: '12px',
                            padding: '12px'
                        }}>
                            <p style={{color: '#4CAF50', fontSize: '14px'}}>
                                ✅ <strong>Deposits:</strong> Instant & automatic | ⏳ <strong>Withdrawals:</strong> Admin approval required (1-2 hours)
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <div className="glass p-2 mb-6 flex gap-2">
                {['home', 'signals', 'wallet', 'transactions'].map(screen => (
                    <button
                        key={screen}
                        onClick={() => appStore.setState({ currentScreen: screen })}
                        style={{
                            flex: 1,
                            padding: '12px',
                            borderRadius: '12px',
                            fontWeight: 600,
                            background: state.currentScreen === screen ? 'white' : 'transparent',
                            color: state.currentScreen === screen ? '#764ba2' : 'rgba(255,255,255,0.7)',
                            transition: 'all 0.3s'
                        }}
                    >
                        {screen === 'home' && '🏠 Home'}
                        {screen === 'signals' && '📊 Signals'}
                        {screen === 'wallet' && '💼 Wallet'}
                        {screen === 'transactions' && '📜 History'}
                    </button>
                ))}
            </div>

            {/* Screen Content */}
            {state.currentScreen === 'home' && <HomeScreen state={state} />}
            {state.currentScreen === 'signals' && <SignalsScreen signals={state.signals} />}
            {state.currentScreen === 'wallet' && <WalletScreen wallets={wallets} prices={state.prices} priceChanges={state.priceChanges} />}
            {state.currentScreen === 'transactions' && <TransactionsScreen transactions={state.transactions} />}

            {/* Modals */}
            {showDepositModal && (
                <DepositModal 
                    onClose={() => setShowDepositModal(false)}
                    appStore={appStore}
                />
            )}
            
            {showWithdrawModal && (
                <WithdrawModal 
                    onClose={() => setShowWithdrawModal(false)}
                    appStore={appStore}
                    balance={wallets.USDT.balance}
                />
            )}
            
            {showAdminModal && (
                <AdminModal 
                    onClose={() => setShowAdminModal(false)}
                    appStore={appStore}
                    pendingWithdrawals={state.pendingWithdrawals}
                />
            )}
            
            {showAdminWithdrawModal && (
                <AdminWithdrawModal 
                    onClose={() => setShowAdminWithdrawModal(false)}
                    appStore={appStore}
                    adminWallet={state.adminWallet}
                />
            )}
        </div>
    );
}

// ==================== HOME SCREEN ====================
function HomeScreen({ state }) {
    return (
        <div>
            {/* Live Prices */}
            <div className="glass p-6 mb-6 slide-in">
                <h3 className="text-2xl font-bold mb-4">📈 Live Market Prices</h3>
                <div className="grid-3">
                    {Object.entries(state.prices).map(([pair, price]) => {
                        const change = state.priceChanges[pair];
                        const isUp = change?.direction === 'up';
                        
                        return (
                            <div key={pair} className="card">
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <p className="font-bold text-lg">{pair}</p>
                                        <p className="text-2xl font-bold mt-1">
                                            ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    <div className="text-4xl">💎</div>
                                </div>
                                {change && (
                                    <div className={`badge ${isUp ? 'badge-success' : 'badge-danger'}`}>
                                        {isUp ? '📈' : '📉'} {change.percent.toFixed(2)}%
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Active Signals */}
            {state.signals.length > 0 && (
                <div className="glass p-6 slide-in">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-2xl font-bold">
                            🎯 Active Trading Signals ({state.signals.length})
                        </h3>
                        <span className="badge badge-success pulse">🔴 LIVE</span>
                    </div>
                    <div className="grid-2">
                        {state.signals.slice(0, 4).map(signal => (
                            <SignalCard key={signal.id} signal={signal} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ==================== SIGNALS SCREEN ====================
function SignalsScreen({ signals }) {
    return (
        <div className="glass p-6 slide-in">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold">
                    🎯 All Trading Signals ({signals.length})
                </h3>
                <span className="badge badge-info pulse">Real-Time Updates</span>
            </div>
            {signals.length === 0 ? (
                <div className="text-center" style={{padding: '60px 0'}}>
                    <div style={{fontSize: '64px', marginBottom: '16px'}}>📊</div>
                    <p style={{color: 'rgba(255,255,255,0.7)'}}>
                        Analyzing markets... New signals coming soon!
                    </p>
                </div>
            ) : (
                <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                    {signals.map(signal => (
                        <SignalCard key={signal.id} signal={signal} detailed />
                    ))}
                </div>
            )}
        </div>
    );
}

// ==================== SIGNAL CARD ====================
function SignalCard({ signal, detailed = false }) {
    const isBuy = signal.type === 'BUY';
    
    return (
        <div className={`signal-card ${isBuy ? 'buy' : 'sell'}`} style={{
            padding: '20px',
            borderRadius: '16px'
        }}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <h4 className="text-xl font-bold">{signal.pair}</h4>
                    <span className={`font-bold text-lg ${isBuy ? 'text-green-400' : 'text-red-400'}`}>
                        {signal.type}
                    </span>
                </div>
                <span className={`badge ${signal.confidence === 'HIGH' ? 'badge-success' : 'badge-warning'}`}>
                    {signal.confidence}
                </span>
            </div>
            
            <div className="grid-3 mb-3">
                <div>
                    <p style={{color: 'rgba(255,255,255,0.5)', fontSize: '12px'}}>Entry</p>
                    <p className="font-medium">${signal.entryPrice.toFixed(2)}</p>
                </div>
                <div>
                    <p style={{color: 'rgba(255,255,255,0.5)', fontSize: '12px'}}>Target</p>
                    <p className="font-medium" style={{color: '#4CAF50'}}>
                        ${signal.targetPrice.toFixed(2)}
                    </p>
                </div>
                <div>
                    <p style={{color: 'rgba(255,255,255,0.5)', fontSize: '12px'}}>Stop Loss</p>
                    <p className="font-medium" style={{color: '#f44336'}}>
                        ${signal.stopLoss.toFixed(2)}
                    </p>
                </div>
            </div>
            
            {detailed && (
                <div style={{
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: '12px',
                    padding: '12px',
                    marginTop: '12px'
                }}>
                    <p style={{color: 'rgba(255,255,255,0.8)', fontSize: '14px'}}>
                        {signal.analysis}
                    </p>
                </div>
            )}
            
            <p style={{color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginTop: '8px'}}>
                Generated: {new Date(signal.timestamp).toLocaleTimeString()}
            </p>
        </div>
    );
}

// ==================== WALLET SCREEN ====================
function WalletScreen({ wallets, prices, priceChanges }) {
    return (
        <div className="glass p-6 slide-in">
            <h3 className="text-2xl font-bold mb-6">💼 Your Portfolio</h3>
            <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                {Object.entries(wallets).map(([currency, wallet]) => {
                    const price = currency === 'USDT' ? 1 : prices[`${currency}/USDT`] || 0;
                    const usdValue = wallet.balance * price;
                    const change = priceChanges[`${currency}/USDT`];
                    const isUp = change?.direction === 'up';
                    
                    return (
                        <div key={currency} className="card">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div style={{fontSize: '48px'}}>
                                        {currency === 'BTC' && '₿'}
                                        {currency === 'ETH' && 'Ξ'}
                                        {currency === 'USDT' && '💵'}
                                        {currency === 'BNB' && '🔸'}
                                        {currency === 'SOL' && '◎'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg">{currency}</p>
                                        <p style={{color: 'rgba(255,255,255,0.7)'}}>
                                            {wallet.balance.toFixed(4)} {currency}
                                        </p>
                                        {change && currency !== 'USDT' && (
                                            <span className={`badge ${isUp ? 'badge-success' : 'badge-danger'}`} style={{marginTop: '4px'}}>
                                                {isUp ? '📈' : '📉'} {change.percent.toFixed(2)}%
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold">
                                        ${usdValue.toLocaleString('en-US', { 
                                            minimumFractionDigits: 2, 
                                            maximumFractionDigits: 2 
                                        })}
                                    </p>
                                    <p style={{color: 'rgba(255,255,255,0.5)', fontSize: '14px'}}>
                                        @ ${price.toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ==================== TRANSACTIONS SCREEN ====================
function TransactionsScreen({ transactions }) {
    return (
        <div className="glass p-6 slide-in">
            <h3 className="text-2xl font-bold mb-6">
                📜 Transaction History ({transactions.length})
            </h3>
            {transactions.length === 0 ? (
                <div className="text-center" style={{padding: '60px 0'}}>
                    <div style={{fontSize: '64px', marginBottom: '16px'}}>📋</div>
                    <p style={{color: 'rgba(255,255,255,0.7)'}}>No transactions yet</p>
                </div>
            ) : (
                <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                    {transactions.map(tx => (
                        <div key={tx.id} className="card">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div style={{fontSize: '32px'}}>
                                        {tx.type === 'DEPOSIT' && '⬇️'}
                                        {tx.type === 'WITHDRAWAL' && '⬆️'}
                                        {tx.type === 'ADMIN_WITHDRAWAL' && '👨‍💼'}
                                        {tx.type === 'TRADE' && '🔄'}
                                    </div>
                                    <div>
                                        <p className="font-bold">
                                            {tx.type === 'ADMIN_WITHDRAWAL' ? 'ADMIN WITHDRAWAL' : tx.type}
                                        </p>
                                        <p style={{color: 'rgba(255,255,255,0.5)', fontSize: '14px'}}>
                                            {new Date(tx.timestamp).toLocaleString()}
                                        </p>
                                        {tx.method && (
                                            <p style={{color: 'rgba(255,255,255,0.5)', fontSize: '12px'}}>
                                                via {tx.method}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`text-2xl font-bold ${
                                        tx.type === 'DEPOSIT' ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                        {tx.type === 'DEPOSIT' ? '+' : '-'}${tx.amount.toFixed(2)}
                                    </p>
                                    <span className={`badge ${
                                        tx.status === 'COMPLETED' ? 'badge-success' :
                                        tx.status === 'PENDING' ? 'badge-warning' :
                                        'badge-danger'
                                    }`}>
                                        {tx.status}
                                    </span>
                                    {tx.fee > 0 && (
                                        <p style={{color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginTop: '4px'}}>
                                            Fee: ${tx.fee.toFixed(2)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ==================== DEPOSIT MODAL ====================
function DepositModal({ onClose, appStore }) {
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('card');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const methods = [
        { id: 'card', name: 'Credit/Debit Card', icon: '💳', fee: '2.9%' },
        { id: 'bank', name: 'Bank Transfer', icon: '🏦', fee: 'Free' },
        { id: 'crypto', name: 'Crypto Wallet', icon: '₿', fee: 'Network fee' },
        { id: 'paypal', name: 'PayPal', icon: '🅿️', fee: '2.9%' }
    ];

    const handleDeposit = async () => {
        setError('');
        const amt = parseFloat(amount);
        
        if (!amt || amt < 10) {
            setError('Minimum deposit is $10');
            return;
        }
        
        setLoading(true);
        try {
            await appStore.processDeposit(amt, method);
            setSuccess(true);
            setTimeout(() => onClose(), 2000);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-2">💵 Instant Deposit</h2>
                <p style={{color: '#4CAF50', fontSize: '14px', marginBottom: '24px'}}>
                    ✅ Funds added instantly - No approval needed!
                </p>
                
                {success ? (
                    <div className="text-center" style={{padding: '40px 0'}}>
                        <div style={{fontSize: '64px', marginBottom: '16px'}}>✅</div>
                        <p className="text-2xl font-bold">Deposit Successful!</p>
                        <p style={{color: 'rgba(255,255,255,0.7)', marginTop: '8px'}}>
                            Funds instantly added to your account
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="mb-4">
                            <label style={{color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginBottom: '8px', display: 'block'}}>
                                Amount (USD)
                            </label>
                            <input
                                type="number"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                placeholder="0.00"
                                style={{fontSize: '20px'}}
                            />
                            <p style={{color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginTop: '4px'}}>
                                Minimum: $10 | Instant processing
                            </p>
                        </div>

                        <div className="mb-4">
                            <label style={{color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginBottom: '8px', display: 'block'}}>
                                Payment Method
                            </label>
                            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                                {methods.map(m => (
                                    <button
                                        key={m.id}
                                        onClick={() => setMethod(m.id)}
                                        className="card"
                                        style={{
                                            textAlign: 'left',
                                            border: method === m.id ? '2px solid #4CAF50' : '2px solid transparent',
                                            padding: '16px'
                                        }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span style={{fontSize: '24px'}}>{m.icon}</span>
                                                <span className="font-medium">{m.name}</span>
                                            </div>
                                            <span style={{color: 'rgba(255,255,255,0.5)', fontSize: '14px'}}>
                                                {m.fee}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {error && (
                            <div className="card" style={{
                                background: 'rgba(244, 67, 54, 0.2)',
                                border: '1px solid rgba(244, 67, 54, 0.5)',
                                padding: '16px',
                                marginBottom: '16px'
                            }}>
                                <p style={{color: '#f44336', fontSize: '14px'}}>❌ {error}</p>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="btn-primary"
                                style={{
                                    flex: 1,
                                    background: 'rgba(255,255,255,0.1)',
                                    padding: '14px'
                                }}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeposit}
                                disabled={loading}
                                className="btn-success"
                                style={{flex: 1, padding: '14px'}}
                            >
                                {loading ? '⏳ Processing...' : '✅ Deposit Instantly'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ==================== WITHDRAW MODAL ====================
function WithdrawModal({ onClose, appStore, balance }) {
    const [amount, setAmount] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [bankName, setBankName] = useState('');
    const [accountName, setAccountName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleWithdraw = async () => {
        setError('');
        const amt = parseFloat(amount);
        
        if (!amt || amt < 10) {
            setError('Minimum withdrawal is $10');
            return;
        }
        
        if (!accountNumber || !bankName || !accountName) {
            setError('Please fill in all bank details');
            return;
        }
        
        setLoading(true);
        try {
            await appStore.processWithdrawal(amt, {
                accountNumber,
                bankName,
                accountName
            });
            setSuccess(true);
            setTimeout(() => onClose(), 2000);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-2">💸 Withdraw USD</h2>
                <p style={{color: '#ff9800', fontSize: '14px', marginBottom: '24px'}}>
                    ⏳ Requires admin approval (1-2 hours)
                </p>
                
                {success ? (
                    <div className="text-center" style={{padding: '40px 0'}}>
                        <div style={{fontSize: '64px', marginBottom: '16px'}}>⏳</div>
                        <p className="text-2xl font-bold">Withdrawal Requested!</p>
                        <p style={{color: 'rgba(255,255,255,0.7)', marginTop: '8px'}}>
                            Pending admin approval
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="card" style={{
                            background: 'rgba(33, 150, 243, 0.2)',
                            border: '1px solid rgba(33, 150, 243, 0.5)',
                            padding: '16px',
                            marginBottom: '24px'
                        }}>
                            <p style={{color: '#64B5F6', fontSize: '14px'}}>
                                💰 Available: ${balance.toFixed(2)}
                            </p>
                        </div>

                        <div style={{display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px'}}>
                            <div>
                                <label style={{color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginBottom: '8px', display: 'block'}}>
                                    Amount (USD)
                                </label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    placeholder="0.00"
                                />
                                <p style={{color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginTop: '4px'}}>
                                    Fee: $2.00
                                </p>
                            </div>

                            <div>
                                <label style={{color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginBottom: '8px', display: 'block'}}>
                                    Bank Name
                                </label>
                                <input
                                    type="text"
                                    value={bankName}
                                    onChange={e => setBankName(e.target.value)}
                                    placeholder="e.g., Chase Bank"
                                />
                            </div>

                            <div>
                                <label style={{color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginBottom: '8px', display: 'block'}}>
                                    Account Number
                                </label>
                                <input
                                    type="text"
                                    value={accountNumber}
                                    onChange={e => setAccountNumber(e.target.value)}
                                    placeholder="123456789"
                                />
                            </div>

                            <div>
                                <label style={{color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginBottom: '8px', display: 'block'}}>
                                    Account Holder Name
                                </label>
                                <input
                                    type="text"
                                    value={accountName}
                                    onChange={e => setAccountName(e.target.value)}
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="card" style={{
                                background: 'rgba(244, 67, 54, 0.2)',
                                border: '1px solid rgba(244, 67, 54, 0.5)',
                                padding: '16px',
                                marginBottom: '16px'
                            }}>
                                <p style={{color: '#f44336', fontSize: '14px'}}>❌ {error}</p>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="btn-primary"
                                style={{
                                    flex: 1,
                                    background: 'rgba(255,255,255,0.1)',
                                    padding: '14px'
                                }}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleWithdraw}
                                disabled={loading}
                                className="btn-primary"
                                style={{flex: 1, padding: '14px'}}
                            >
                                {loading ? 'Processing...' : 'Request Withdrawal'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ==================== ADMIN MODAL ====================
function AdminModal({ onClose, appStore, pendingWithdrawals }) {
    const [processing, setProcessing] = useState(null);
    const [showRejectModal, setShowRejectModal] = useState(null);
    const [rejectReason, setRejectReason] = useState('');

    const handleApprove = async (id) => {
        setProcessing(id);
        try {
            await appStore.approveWithdrawal(id);
        } catch (e) {
            alert(e.message);
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async () => {
        if (!rejectReason) {
            alert('Please provide a reason');
            return;
        }
        setProcessing(showRejectModal);
        try {
            await appStore.rejectWithdrawal(showRejectModal, rejectReason);
            setShowRejectModal(null);
            setRejectReason('');
        } catch (e) {
            alert(e.message);
        } finally {
            setProcessing(null);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" style={{maxWidth: '700px'}} onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-6">
                    👨‍💼 Admin Dashboard - Pending Withdrawals ({pendingWithdrawals.length})
                </h2>

                {pendingWithdrawals.length === 0 ? (
                    <div className="text-center" style={{padding: '60px 0'}}>
                        <div style={{fontSize: '64px', marginBottom: '16px'}}>✅</div>
                        <p className="font-bold text-xl">All Clear!</p>
                        <p style={{color: 'rgba(255,255,255,0.7)', marginTop: '8px'}}>
                            No pending withdrawals
                        </p>
                    </div>
                ) : (
                    <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                        {pendingWithdrawals.map(withdrawal => (
                            <div key={withdrawal.id} className="card" style={{
                                background: 'rgba(255, 152, 0, 0.1)',
                                border: '2px solid rgba(255, 152, 0, 0.3)',
                                padding: '24px'
                            }}>
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold mb-2">
                                            💸 ${withdrawal.amount.toFixed(2)} USD
                                        </h3>
                                        <p style={{color: 'rgba(255,255,255,0.7)', fontSize: '14px'}}>
                                            {new Date(withdrawal.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                    <span className="badge badge-warning">PENDING</span>
                                </div>

                                <div className="card" style={{
                                    background: 'rgba(0,0,0,0.3)',
                                    padding: '16px',
                                    marginBottom: '16px'
                                }}>
                                    <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                                        <div className="flex justify-between">
                                            <span style={{color: 'rgba(255,255,255,0.5)', fontSize: '14px'}}>Bank:</span>
                                            <span className="font-medium text-sm">
                                                {withdrawal.details.bankName}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span style={{color: 'rgba(255,255,255,0.5)', fontSize: '14px'}}>Account:</span>
                                            <span className="font-medium text-sm">
                                                {withdrawal.details.accountNumber}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span style={{color: 'rgba(255,255,255,0.5)', fontSize: '14px'}}>Name:</span>
                                            <span className="font-medium text-sm">
                                                {withdrawal.details.accountName}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span style={{color: 'rgba(255,255,255,0.5)', fontSize: '14px'}}>Fee:</span>
                                            <span className="font-medium text-sm">
                                                ${withdrawal.fee.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleApprove(withdrawal.id)}
                                        disabled={processing === withdrawal.id}
                                        className="btn-success"
                                        style={{flex: 1, padding: '14px'}}
                                    >
                                        {processing === withdrawal.id ? '⏳ Processing...' : '✅ Approve'}
                                    </button>
                                    <button
                                        onClick={() => setShowRejectModal(withdrawal.id)}
                                        disabled={processing === withdrawal.id}
                                        className="btn-danger"
                                        style={{flex: 1, padding: '14px'}}
                                    >
                                        ❌ Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <button
                    onClick={onClose}
                    className="btn-primary"
                    style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.1)',
                        padding: '14px',
                        marginTop: '24px'
                    }}
                >
                    Close
                </button>

                {showRejectModal && (
                    <div className="modal-overlay" onClick={() => setShowRejectModal(null)}>
                        <div className="modal-content" style={{maxWidth: '400px'}} onClick={e => e.stopPropagation()}>
                            <h3 className="text-xl font-bold mb-4">❌ Reject Withdrawal</h3>
                            <textarea
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                                placeholder="Enter rejection reason..."
                                style={{height: '120px', marginBottom: '16px'}}
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowRejectModal(null)}
                                    className="btn-primary"
                                    style={{
                                        flex: 1,
                                        background: 'rgba(255,255,255,0.1)',
                                        padding: '14px'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReject}
                                    className="btn-danger"
                                    style={{flex: 1, padding: '14px'}}
                                >
                                    Confirm Reject
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ==================== ADMIN WITHDRAW ALL MODAL ====================
function AdminWithdrawModal({ onClose, appStore, adminWallet }) {
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountName, setAccountName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleWithdraw = async () => {
        setError('');
        
        if (!bankName || !accountNumber || !accountName) {
            setError('Please fill in all bank details');
            return;
        }
        
        setLoading(true);
        try {
            await appStore.adminWithdrawAll({
                bankName,
                accountNumber,
                accountName
            });
            setSuccess(true);
            setTimeout(() => onClose(), 2000);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-2">👨‍💼 Admin Withdrawal</h2>
                <p style={{color: '#4CAF50', fontSize: '14px', marginBottom: '24px'}}>
                    💰 Withdraw all funds from platform
                </p>
                
                {success ? (
                    <div className="text-center" style={{padding: '40px 0'}}>
                        <div style={{fontSize: '64px', marginBottom: '16px'}}>✅</div>
                        <p className="text-2xl font-bold">Withdrawal Successful!</p>
                        <p style={{color: 'rgba(255,255,255,0.7)', marginTop: '8px'}}>
                            ${adminWallet.toFixed(2)} sent to your bank
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="card" style={{
                            background: 'rgba(76, 175, 80, 0.2)',
                            border: '1px solid rgba(76, 175, 80, 0.5)',
                            padding: '20px',
                            marginBottom: '24px',
                            textAlign: 'center'
                        }}>
                            <p style={{color: 'rgba(255,255,255,0.7)', fontSize: '14px'}}>
                                Total Platform Funds
                            </p>
                            <p className="text-4xl font-bold" style={{color: '#4CAF50', margin: '8px 0'}}>
                                ${adminWallet.toFixed(2)}
                            </p>
                            <p style={{color: 'rgba(255,255,255,0.5)', fontSize: '12px'}}>
                                Available for withdrawal
                            </p>
                        </div>

                        <div style={{display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px'}}>
                            <div>
                                <label style={{color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginBottom: '8px', display: 'block'}}>
                                    Your Bank Name
                                </label>
                                <input
                                    type="text"
                                    value={bankName}
                                    onChange={e => setBankName(e.target.value)}
                                    placeholder="e.g., Chase Bank"
                                />
                            </div>

                            <div>
                                <label style={{color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginBottom: '8px', display: 'block'}}>
                                    Your Account Number
                                </label>
                                <input
                                    type="text"
                                    value={accountNumber}
                                    onChange={e => setAccountNumber(e.target.value)}
                                    placeholder="123456789"
                                />
                            </div>

                            <div>
                                <label style={{color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginBottom: '8px', display: 'block'}}>
                                    Account Holder Name
                                </label>
                                <input
                                    type="text"
                                    value={accountName}
                                    onChange={e => setAccountName(e.target.value)}
                                    placeholder="Your Name"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="card" style={{
                                background: 'rgba(244, 67, 54, 0.2)',
                                border: '1px solid rgba(244, 67, 54, 0.5)',
                                padding: '16px',
                                marginBottom: '16px'
                            }}>
                                <p style={{color: '#f44336', fontSize: '14px'}}>❌ {error}</p>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="btn-primary"
                                style={{
                                    flex: 1,
                                    background: 'rgba(255,255,255,0.1)',
                                    padding: '14px'
                                }}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleWithdraw}
                                disabled={loading}
                                className="btn-success"
                                style={{flex: 1, padding: '14px'}}
                            >
                                {loading ? '⏳ Processing...' : `💸 Withdraw $${adminWallet.toFixed(2)}`}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ==================== RENDER APP ====================
ReactDOM.render(<App />, document.getElementById('root'));
