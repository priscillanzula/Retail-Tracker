// Global variables to store our data
let transactions = [];
let users = [];
let currentUser = null;
let currentMethod = 'manual';
let recognition = null;
let isRecording = false;
let analyticsPeriod = 'year'; // 'year' or 'month'
let charts = {};

// Initialize the app when page loads
document.addEventListener('DOMContentLoaded', function() {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        document.getElementById('homepage').classList.add('hidden');
        document.getElementById('mainContent').classList.remove('hidden');
        const authButtonsDiv = document.querySelector('.auth-buttons');
        authButtonsDiv.innerHTML = `<span style="color: black; margin-right: 10px;">Welcome, ${currentUser.businessName}!</span><button class="btn btn-secondary" onclick="logoutUser()">Logout</button>`;
        loadSampleData();
        updateDashboard();
        initializeAnalytics();
        updateTransactionsList();
    } else {
        document.getElementById('homepage').classList.remove('hidden');
        document.getElementById('mainContent').classList.add('hidden');
    }

    setupSpeechRecognition();
    if (!document.getElementById('mainContent').classList.contains('hidden')) {
        initializeAnalytics();
    }
    selectMethod('manual');
});

// User Authentication Functions
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}
function showLogin() {
    closeModal('registerModal');
    openModal('loginModal');
}
function showRegister() {
    closeModal('loginModal');
    openModal('registerModal');
}
function showMainContentAfterLogin() {
    document.getElementById('mainContent').classList.remove('hidden');
    document.getElementById('homepage').style.display = 'none';
    document.querySelector('.testimonials').style.display = 'none';
    document.querySelector('.how-it-works').style.display = 'none';
}
function updateAuthButtons() {
    const authButtonsDiv = document.querySelector('.auth-buttons');
    if (currentUser) {
        authButtonsDiv.innerHTML = `<span style="color: black; margin-right: 10px;">Welcome, ${currentUser.businessName}!</span>
            <button class="btn btn-secondary btn-small" onclick="logoutUser()">Logout</button>`;
    } else {
        authButtonsDiv.innerHTML = `<button class="btn btn-small" onclick="openModal('loginModal')">Login</button>
            <button class="btn btn-small" onclick="openModal('registerModal')">Register</button>`;
    }
}
function registerUser() {
    const businessName = document.getElementById('businessName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    if (password.length < 6) {
        alert('Password must be at least 6 characters long.');
        return;
    }
    if (users.some(user => user.email === email)) {
        alert('This email is already registered.');
        return;
    }
    const newUser = { businessName, email, password };
    users.push(newUser);
    alert('Registration successful! You can now log in.');
    closeModal('registerModal');
    showLogin();
}
function loginUser() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const foundUser = users.find(user => user.email === email && user.password === password);
    if (foundUser) {
        currentUser = foundUser;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        alert('Login successful! Welcome back, ' + currentUser.businessName + '!');
        closeModal('loginModal');
        document.getElementById('homepage').classList.add('hidden');
        document.getElementById('mainContent').classList.remove('hidden');
        const authButtonsDiv = document.querySelector('.auth-buttons');
        // authButtonsDiv.innerHTML = `<span style="color: white; margin-right: 10px;">Welcome, ${currentUser.businessName}!</span><button class="btn btn-secondary" onclick="logoutUser()">Logout</button>`;
        // Hide testimonials and how-it-works
        document.getElementById('testimonialsSection').classList.add('hidden');
        document.getElementById('howItWorksSection').classList.add('hidden');
        updateAuthButtons();
        loadSampleData();
        updateDashboard();
        updateTransactionsList();
        initializeAnalytics();
        updatePersonalSummaryCard();
    } else {
        alert('Invalid email or password. Please try again or register.');
    }
}
function logoutUser() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    transactions = [];
    alert('You have been logged out.');
    document.getElementById('mainContent').classList.add('hidden');
    document.getElementById('homepage').classList.remove('hidden');
    
    updateAuthButtons();
    updateDashboard();
    updateTransactionsList();
    initializeAnalytics();
    updatePersonalSummaryCard();
}

// Sample Data Load (for demo purposes)
function loadSampleData() {
    transactions = [
        { id: 1, type: 'income', amount: 1500, description: 'Client Project A', category: 'services', date: '5/20/2024', time: '10:00:00 AM', year: 2024, month: 5, timestamp: new Date('2024-05-20T10:00:00') },
        { id: 2, type: 'expense', amount: 120, description: 'Software Subscription', category: 'utilities', date: '5/15/2024', time: '02:30:00 PM', year: 2024, month: 5, timestamp: new Date('2024-05-15T14:30:00') },
        { id: 3, type: 'income', amount: 800, description: 'Online Course Sales', category: 'sales', date: '4/28/2024', time: '09:15:00 AM', year: 2024, month: 4, timestamp: new Date('2024-04-28T09:15:00') },
        { id: 4, type: 'expense', amount: 50, description: 'Office Supplies', category: 'supplies', date: '4/10/2024', time: '11:00:00 AM', year: 2024, month: 4, timestamp: new Date('2024-04-10T11:00:00') },
        { id: 5, type: 'income', amount: 2000, description: 'Consulting Fee', category: 'services', date: '3/05/2024', time: '03:00:00 PM', year: 2024, month: 3, timestamp: new Date('2024-03-05T15:00:00') },
        { id: 6, type: 'expense', amount: 300, description: 'Marketing Ads', category: 'marketing', date: '3/01/2024', time: '09:00:00 AM', year: 2024, month: 3, timestamp: new Date('2024-03-01T09:00:00') },
        { id: 7, type: 'income', amount: 100, description: 'Book Sales', category: 'sales', date: '2/14/2024', time: '01:00:00 PM', year: 2024, month: 2, timestamp: new Date('2024-02-14T13:00:00') },
        { id: 8, type: 'expense', amount: 75, description: 'Internet Bill', category: 'utilities', date: '2/01/2024', time: '05:00:00 PM', year: 2024, month: 2, timestamp: new Date('2024-02-01T17:00:00') },
        { id: 9, type: 'income', amount: 900, description: 'Freelance Design', category: 'services', date: '1/25/2024', time: '11:00:00 AM', year: 2024, month: 1, timestamp: new Date('2024-01-25T11:00:00') },
        { id: 10, type: 'expense', amount: 400, description: 'New Laptop', category: 'supplies', date: '1/08/2024', time: '04:00:00 PM', year: 2024, month: 1, timestamp: new Date('2024-01-08T16:00:00') },
        { id: 11, type: 'income', amount: 1100, description: 'Client Retainer', category: 'services', date: '12/10/2023', time: '09:00:00 AM', year: 2023, month: 12, timestamp: new Date('2023-12-10T09:00:00') },
        { id: 12, type: 'expense', amount: 60, description: 'Coffee Meetings', category: 'food', date: '12/03/2023', time: '08:00:00 AM', year: 2023, month: 12, timestamp: new Date('2023-12-03T08:00:00') }
    ];
}

// Method selection function
function selectMethod(method, event) {
    document.querySelectorAll('.input-method').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.voice-controls, .photo-upload, .manual-form').forEach(el => el.classList.remove('active'));
    if (event && event.target) {
        const methodDiv = event.target.closest('.input-method');
        if (methodDiv) methodDiv.classList.add('active');
    } else {
        const methodDiv = document.querySelector(`.input-method[onclick*="${method}"]`);
        if (methodDiv) methodDiv.classList.add('active');
    }
    currentMethod = method;
    if (method === 'voice') {
        document.getElementById('voiceControls').classList.add('active');
    } else if (method === 'photo') {
        document.getElementById('photoUpload').classList.add('active');
    } else {
        document.getElementById('manualForm').classList.add('active');
    }
}

// Speech Recognition Setup
function setupSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        recognition.onstart = function() {
            isRecording = true;
            document.getElementById('voiceStatus').textContent = '🎤 Listening... Speak now!';
            document.getElementById('voiceStatus').style.background = '#fed7d7';
        };
        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            document.getElementById('voiceStatus').textContent = `Heard: "${transcript}"`;
            document.getElementById('voiceStatus').style.background = '#c6f6d5';
            processVoiceInput(transcript);
        };
        recognition.onerror = function(event) {
            document.getElementById('voiceStatus').textContent = `Error: ${event.error}`;
            document.getElementById('voiceStatus').style.background = '#fed7d7';
            isRecording = false;
        };
        recognition.onend = function() {
            isRecording = false;
        };
    } else {
        document.getElementById('voiceControls').innerHTML = '<p style="color: #f56565;">Speech recognition not supported in this browser. Please use Chrome or Edge.</p>';
    }
}
function startVoiceRecording() {
    if (recognition && !isRecording) {
        recognition.start();
    }
}
function stopVoiceRecording() {
    if (recognition && isRecording) {
        recognition.stop();
    }
}
function processVoiceInput(transcript) {
    const text = transcript.toLowerCase();
    let type = '';
    if (text.includes('income')) type = 'income';
    else if (text.includes('expense')) type = 'expense';
    let amountMatch = text.match(/(\d+(\.\d+)?)/);
    let amount = amountMatch ? parseFloat(amountMatch[1]) : '';
    let date = '';
    let dateMatch = text.match(/(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
        date = dateMatch[1];
    } else if (text.includes('today')) {
        date = new Date().toISOString().split('T')[0];
    } else if (text.includes('yesterday')) {
        let d = new Date();
        d.setDate(d.getDate() - 1);
        date = d.toISOString().split('T')[0];
    }
    let category = '';
    let catMatch = text.match(/category (\w+)/);
    if (catMatch) {
        category = catMatch[1];
    } else {
        let inMatch = text.match(/in (\w+)/);
        if (inMatch) category = inMatch[1];
        let forMatch = text.match(/for ([a-z ]+)/);
        if (forMatch) category = forMatch[1].trim().split(' ')[0];
    }
    let description = '';
    let descMatch = text.match(/for (.+?)( on | in |$)/);
    if (descMatch) {
        description = descMatch[1].trim();
    } else {
        description = transcript;
    }
    if (type) document.getElementById('transactionType').value = type;
    if (amount) document.getElementById('amount').value = amount;
    if (description) document.getElementById('description').value = description;
    if (category) document.getElementById('category').value = category;
    if (date) document.getElementById('transactionDate').value = date;
    selectMethod('manual');
}

// Photo upload handler
function handlePhotoUpload() {
    const input = document.getElementById('photoInput');
    const preview = document.getElementById('photoPreview');
    const loading = document.getElementById('photoLoading');
    preview.innerHTML = '';
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const reader = new FileReader();
        loading.style.display = 'block';
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.maxWidth = '200px';
            img.style.maxHeight = '200px';
            img.style.borderRadius = '8px';
            img.style.marginTop = '15px';
            preview.appendChild(img);
            setTimeout(() => {
                loading.style.display = 'none';
                const receiptItems = [
                    { amount: 25.99, description: 'Office supplies from receipt', type: 'expense', category: 'supplies', date: '2024-05-26' },
                    { amount: 45.50, description: 'Business lunch receipt', type: 'expense', category: 'food', date: '2024-05-25' },
                    { amount: 12.75, description: 'Parking receipt', type: 'expense', category: 'travel', date: '2024-05-24' },
                    { amount: 89.99, description: 'Equipment purchase', type: 'expense', category: 'supplies', date: '2024-05-23' },
                    { amount: 150.00, description: 'Client payment received', type: 'income', category: 'services', date: '2024-05-22' }
                ];
                const mockData = receiptItems[Math.floor(Math.random() * receiptItems.length)];
                document.getElementById('transactionType').value = mockData.type;
                document.getElementById('amount').value = mockData.amount;
                document.getElementById('description').value = mockData.description;
                document.getElementById('category').value = mockData.category;
                document.getElementById('transactionDate').value = mockData.date;
                selectMethod('manual');
                alert('Receipt processed! Please review the extracted details and click "Add Transaction".');
            }, 2000);
        };
        reader.readAsDataURL(file);
    }
}

// Add transaction function
function addTransaction() {
    if (!currentUser) {
        alert('Please login to add transactions.');
        return;
    }
    const type = document.getElementById('transactionType').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const description = document.getElementById('description').value;
    const category = document.getElementById('category').value;
    const dateInput = document.getElementById('transactionDate').value;
    if (!amount || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }
    if (!description.trim()) {
        alert('Please enter a description');
        return;
    }
    const dateObj = dateInput ? new Date(dateInput) : new Date();
    const date = dateObj.toLocaleDateString();
    const time = dateObj.toLocaleTimeString();
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    const transaction = {
        id: Date.now(),
        type: type,
        amount: amount,
        description: description.trim(),
        category: category,
        date: date,
        time: time,
        year: year,
        month: month,
        timestamp: dateObj
    };
    transactions.unshift(transaction);
    updateDashboard();
    updateTransactionsList();
    updateAnalytics();
    
    document.getElementById('amount').value = '';
    document.getElementById('description').value = '';
    document.getElementById('transactionDate').value = '';
    document.getElementById('category').value = 'other';
    document.getElementById('transactionType').value = 'income';
    const addBtn = document.querySelector('#manualForm .btn');
    addBtn.textContent = '➕ Add Transaction';
    addBtn.style.animation = '';
    alert(`✅ ${type === 'income' ? 'Income' : 'Expense'} of $${amount.toFixed(2)} added successfully!`);
    
}

// Update dashboard calculations
function updateDashboard() {
    if (!currentUser) return;
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const profit = income - expenses;
    document.getElementById('totalIncome').textContent = `$${income.toFixed(2)}`;
    document.getElementById('totalExpenses').textContent = `$${expenses.toFixed(2)}`;
    document.getElementById('netProfit').textContent = `$${profit.toFixed(2)}`;
    document.getElementById('totalTransactions').textContent = transactions.length;
    const profitElement = document.getElementById('netProfit');
    if (profit >= 0) {
        profitElement.className = 'amount profit';
    } else {
        profitElement.className = 'amount expense';
    }
}
function updatePersonalSummaryCard() {
    const card = document.getElementById('personalSummaryCard');
    if (!currentUser) {
        card.style.display = 'none';
        return;
    }
    // Get current month and year
    const now = new Date();
    const thisMonth = now.getMonth() + 1;
    const thisYear = now.getFullYear();
    // Filter transactions for this month
    const monthTx = transactions.filter(t => {
        const txDate = new Date(t.date);
        return txDate.getFullYear() === thisYear && (txDate.getMonth() + 1) === thisMonth;
    });
    const income = monthTx.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
    const expenses = monthTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
    const netProfit = income - expenses;
    document.getElementById('summaryUserName').textContent = currentUser.businessName;
    // document.getElementById('summaryBalance').textContent = `Ksh ${netProfit.toLocaleString()}`;
    document.getElementById('summaryTip').textContent = netProfit >= 0
        ? "Great job! You're on track!. 🎯"
        : "Watch your expenses to improve your balance!";
    card.style.display = 'block';
}
// Update transactions list display
function updateTransactionsList() {
    if (!currentUser) return;
    const container = document.getElementById('transactionsList');
    if (transactions.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #718096; padding: 40px;">No transactions yet. Add your first transaction above!</p>';
        return;
    }
    container.innerHTML = transactions.map(transaction => `
        <div class="transaction-item">
            <div class="transaction-info">
                <div class="transaction-desc">
                    ${transaction.type === 'income' ? '💰' : '💸'} ${transaction.description}
                </div>
                <div class="transaction-meta">
                    ${transaction.category} • ${transaction.date} at ${transaction.time}
                </div>
            </div>
            <div class="transaction-amount ${transaction.type}">
                ${transaction.type === 'income' ? '+' : '-'}$${transaction.amount.toFixed(2)}
            </div>
            <button class="delete-btn" onclick="deleteTransaction(${transaction.id})">🗑️</button>
        </div>
    `).join('');
}

// Delete transaction function
function deleteTransaction(id) {
    if (!currentUser) return;
    if (confirm('Are you sure you want to delete this transaction?')) {
        transactions = transactions.filter(t => t.id !== id);
        updateDashboard();
        updateTransactionsList();
        updateAnalytics();
        updatePersonalSummaryCard();
    }
}

// Initialize Analytics
function initializeAnalytics() {
    if (!currentUser) {
        for (const chartKey in charts) {
            if (charts[chartKey]) {
                charts[chartKey].destroy();
                charts[chartKey] = null;
            }
        }
        updateSummaryCards();
        return;
    }
    for (const chartKey in charts) {
        if (charts[chartKey]) {
            charts[chartKey].destroy();
        }
    }
    createTrendsChart();
    createCategoryChart();
    createPieChart();
    createMonthlyChart();
    updateAnalytics();
}

// Set analytics period (month/year) for trends chart
function setAnalyticsPeriod(period, event) {
    if (!currentUser) return;
    analyticsPeriod = period;
    document.querySelectorAll('.time-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.target) {
        event.target.classList.add('active');
    } else {
        const targetBtn = document.querySelector(`.time-btn[onclick*="${period}"]`);
        if (targetBtn) targetBtn.classList.add('active');
    }
    updateAnalytics();
}

// Create Trends Chart
function createTrendsChart() {
    const ctx = document.getElementById('trendsChart').getContext('2d');
    charts.trends = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Income',
                data: [],
                borderColor: '#13c45c',
                backgroundColor: 'rgba(19, 196, 92, 0.1)',
                tension: 0.4
            }, {
                label: 'Expenses',
                data: [],
                borderColor: '#bd0d0d',
                backgroundColor: 'rgba(189, 13, 13, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value;
                        }
                    }
                }
            }
        }
    });
}

// Create Category Chart
function createCategoryChart() {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    charts.category = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Amount ($)',
                data: [],
                backgroundColor: [
                    '#667eea', '#764ba2', '#13c45c', '#bd0d0d',
                    '#f093fb', '#f5576c', '#4facfe', '#00f2fe'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value;
                        }
                    }
                }
            }
        }
    });
}

// Create Pie Chart
function createPieChart() {
    const ctx = document.getElementById('pieChart').getContext('2d');
    charts.pie = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Income', 'Expenses'],
            datasets: [{
                data: [0, 0],
                backgroundColor: ['#13c45c', '#bd0d0d'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

// Create Monthly Chart
function createMonthlyChart() {
    const ctx = document.getElementById('monthlyChart').getContext('2d');
    charts.monthly = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Net Profit',
                data: [],
                backgroundColor: function(context) {
                    if (context.parsed && typeof context.parsed.y !== 'undefined') {
                        return context.parsed.y >= 0 ? '#13c45c' : '#bd0d0d';
                    }
                    return '#805ad5';
                }
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    ticks: {
                        callback: function(value) {
                            return '$' + value;
                        }
                    }
                }
            }
        }
    });
}

// Update Analytics
function updateAnalytics() {
    if (!currentUser) return;
    if (transactions.length === 0) {
        updateSummaryCards();
        for (const chartKey in charts) {
            if (charts[chartKey]) {
                charts[chartKey].destroy();
                charts[chartKey] = null;
            }
        }
        createTrendsChart();
        createCategoryChart();
        createPieChart();
        createMonthlyChart();
        return;
    }
    updateTrendsChart();
    updateCategoryChart();
    updatePieChart();
    updateMonthlyChart();
    updateSummaryCards();
}

// Update Trends Chart
function updateTrendsChart() {
    const data = getTrendsData();
    charts.trends.data.labels = data.labels;
    charts.trends.data.datasets[0].data = data.income;
    charts.trends.data.datasets[1].data = data.expenses;
    charts.trends.update();
}

// Update Category Chart
function updateCategoryChart() {
    const categoryData = getCategoryData();
    charts.category.data.labels = categoryData.labels;
    charts.category.data.datasets[0].data = categoryData.data;
    charts.category.update();
}

// Update Pie Chart
function updatePieChart() {
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    charts.pie.data.datasets[0].data = [totalIncome, totalExpenses];
    charts.pie.update();
}

// Update Monthly Chart
function updateMonthlyChart() {
    const monthlyData = getMonthlyData();
    charts.monthly.data.labels = monthlyData.labels;
    charts.monthly.data.datasets[0].data = monthlyData.data;
    charts.monthly.update();
}

// Get trends data for chart (month/year)
function getTrendsData() {
    if (analyticsPeriod === 'year') {
        // Group by year
        const years = [...new Set(transactions.map(t => t.year))].sort();
        const income = years.map(y =>
            transactions.filter(t => t.type === 'income' && t.year === y)
                .reduce((sum, t) => sum + t.amount, 0)
        );
        const expenses = years.map(y =>
            transactions.filter(t => t.type === 'expense' && t.year === y)
                .reduce((sum, t) => sum + t.amount, 0)
        );
        return { labels: years.map(String), income, expenses };
    } else {
        // Group by actual months in data (YYYY-MM)
        const monthSet = new Set(
            transactions.map(t => {
                const d = t.timestamp ? new Date(t.timestamp) : new Date(t.date);
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            })
        );
        const months = Array.from(monthSet).sort();
        const labels = months.map(m => {
            const [y, mo] = m.split('-');
            return `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(mo)-1]} ${y}`;
        });
        const income = months.map(m => {
            return transactions.filter(t => {
                const d = t.timestamp ? new Date(t.timestamp) : new Date(t.date);
                return t.type === 'income' && `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === m;
            }).reduce((sum, t) => sum + t.amount, 0);
        });
        const expenses = months.map(m => {
            return transactions.filter(t => {
                const d = t.timestamp ? new Date(t.timestamp) : new Date(t.date);
                return t.type === 'expense' && `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === m;
            }).reduce((sum, t) => sum + t.amount, 0);
        });
        return { labels, income, expenses };
    }
}
// Get category data
function getCategoryData() {
    const categories = {};
    transactions.forEach(t => {
        if (!categories[t.category]) {
            categories[t.category] = 0;
        }
        categories[t.category] += t.amount;
    });
    const labels = Object.keys(categories);
    const data = Object.values(categories);
    return { labels, data };
}

// Get monthly data for summary chart
function getMonthlyData() {
    // Group by actual months in data (YYYY-MM)
    const monthSet = new Set(
        transactions.map(t => {
            const d = t.timestamp ? new Date(t.timestamp) : new Date(t.date);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        })
    );
    const months = Array.from(monthSet).sort();
    const labels = months.map(m => {
        const [y, mo] = m.split('-');
        return `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(mo)-1]} ${y}`;
    });
    const data = months.map(m => {
        const income = transactions.filter(t => {
            const d = t.timestamp ? new Date(t.timestamp) : new Date(t.date);
            return t.type === 'income' && `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === m;
        }).reduce((sum, t) => sum + t.amount, 0);
        const expenses = transactions.filter(t => {
            const d = t.timestamp ? new Date(t.timestamp) : new Date(t.date);
            return t.type === 'expense' && `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === m;
        }).reduce((sum, t) => sum + t.amount, 0);
        return income - expenses;
    });
    return { labels, data };
}
// Update summary cards
function updateSummaryCards() {
    if (!currentUser || transactions.length === 0) {
        document.getElementById('topIncomeCategory').textContent = 'N/A';
        document.getElementById('topExpenseCategory').textContent = 'N/A';
        document.getElementById('bestMonth').textContent = 'N/A';
        document.getElementById('avgTransaction').textContent = '$0.00';
        return;
    }
    // Top income category
    const incomeCategories = {};
    transactions.filter(t => t.type === 'income').forEach(t => {
        incomeCategories[t.category] = (incomeCategories[t.category] || 0) + t.amount;
    });
    const topIncomeCategory = Object.keys(incomeCategories).reduce((a, b) =>
        incomeCategories[a] > incomeCategories[b] ? a : b, 'N/A');
    // Top expense category
    const expenseCategories = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
        expenseCategories[t.category] = (expenseCategories[t.category] || 0) + t.amount;
    });
    const topExpenseCategory = Object.keys(expenseCategories).reduce((a, b) =>
        expenseCategories[a] > expenseCategories[b] ? a : b, 'N/A');
    // Best month
    const monthlyProfits = getMonthlyData();
    const bestMonthIndex = monthlyProfits.data.indexOf(Math.max(...monthlyProfits.data));
    const bestMonth = monthlyProfits.labels[bestMonthIndex] || 'N/A';
    // Average transaction
    const avgTransaction = transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length;
    document.getElementById('topIncomeCategory').textContent = topIncomeCategory.charAt(0).toUpperCase() + topIncomeCategory.slice(1);
    document.getElementById('topExpenseCategory').textContent = topExpenseCategory.charAt(0).toUpperCase() + topExpenseCategory.slice(1);
    document.getElementById('bestMonth').textContent = bestMonth;
    document.getElementById('avgTransaction').textContent = '$' + avgTransaction.toFixed(2);
}