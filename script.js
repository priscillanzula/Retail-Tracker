backgroundColor: (context) => {
    // Safely check for parsed and y
    if (context.parsed && typeof context.parsed.y !== 'undefined') {
        return context.parsed.y >= 0 ? '#38a169' : '#e53e3e';
    }
    // fallback color
    return '#805ad5';
}

// Global variables to store our data
let transactions = [];
let currentMethod = 'manual';
let recognition = null;
let isRecording = false;
let analyticsPeriod = 'year';
let charts = {};

// Initialize the app when page loads
document.addEventListener('DOMContentLoaded', function() {
    updateDashboard();
    setupSpeechRecognition();
    initializeAnalytics();
});

// Method selection function
// Method selection function
function selectMethod(method, event) {
    // Remove active class from all methods
    document.querySelectorAll('.input-method').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.voice-controls, .photo-upload, .manual-form').forEach(el => el.classList.remove('active'));
    
    // Add active class to selected method
    if (event && event.target) {
        // If called from a click event
        const methodDiv = event.target.closest('.input-method');
        if (methodDiv) methodDiv.classList.add('active');
    } else {
        // If called programmatically, find by method
        const methodDiv = document.querySelector(`.input-method[onclick*="${method}"]`);
        if (methodDiv) methodDiv.classList.add('active');
    }
    currentMethod = method;
    
    // Show appropriate input section
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

// Voice recording functions
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
    // Lowercase for easier matching
    const text = transcript.toLowerCase();

    // Extract type
    let type = '';
    if (text.includes('income')) type = 'income';
    else if (text.includes('expense')) type = 'expense';

    // Extract amount
    let amountMatch = text.match(/(\d+(\.\d+)?)/);
    let amount = amountMatch ? parseFloat(amountMatch[1]) : '';

    // Extract date (format: YYYY-MM-DD or MM/DD/YYYY or "today"/"yesterday")
    let date = '';
    let dateMatch = text.match(/(\d{4}-\d{2}-\d{2})/); // YYYY-MM-DD
    if (dateMatch) {
        date = dateMatch[1];
    } else if (text.includes('today')) {
        date = new Date().toISOString().split('T')[0];
    } else if (text.includes('yesterday')) {
        let d = new Date();
        d.setDate(d.getDate() - 1);
        date = d.toISOString().split('T')[0];
    }

    // Extract category (looks for "category X" or "in X" or "for X")
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

    // Extract description (after "for" or "on")
    let description = '';
    let descMatch = text.match(/for (.+?)( on | in |$)/);
    if (descMatch) {
        description = descMatch[1].trim();
    } else {
        // fallback: use the whole transcript
        description = transcript;
    }

    // Fill the manual form fields
    if (type) document.getElementById('transactionType').value = type;
    if (amount) document.getElementById('amount').value = amount;
    if (description) document.getElementById('description').value = description;
    if (category) document.getElementById('category').value = category;
    if (date) document.getElementById('transactionDate').value = date;

    // Show manual form for review
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
    
    // Simulate OCR processing
    setTimeout(() => {
        loading.style.display = 'none';

        // Simulate realistic extracted data with date
        const receiptItems = [
            { amount: 25.99, description: 'Office supplies from receipt', type: 'expense', category: 'supplies', date: '2024-05-26' },
            { amount: 45.50, description: 'Business lunch receipt', type: 'expense', category: 'food', date: '2024-05-25' },
            { amount: 12.75, description: 'Parking receipt', type: 'expense', category: 'travel', date: '2024-05-24' },
            { amount: 89.99, description: 'Equipment purchase', type: 'expense', category: 'supplies', date: '2024-05-23' },
            { amount: 150.00, description: 'Client payment received', type: 'income', category: 'services', date: '2024-05-22' }
        ];

        const mockData = receiptItems[Math.floor(Math.random() * receiptItems.length)];

        // Populate manual form
        document.getElementById('transactionType').value = mockData.type;
        document.getElementById('amount').value = mockData.amount;
        document.getElementById('description').value = mockData.description;
        document.getElementById('category').value = mockData.category;
        document.getElementById('transactionDate').value = mockData.date; // <-- Set the date

        // Switch to manual form for review
        selectMethod('manual');

        alert('Receipt processed! Please review the extracted details and click "Add Transaction".');
    }, 2000);
};
        
        reader.readAsDataURL(file);
    }
}

// Add transaction function
function addTransaction() {
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
    // Use selected date or today's date if not set
    const dateObj = dateInput ? new Date(dateInput) : new Date();
    const date = dateObj.toLocaleDateString();
    const time = dateObj.toLocaleTimeString();
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1; // 1-based

    // Create transaction object
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
    // Add to transactions array
    transactions.unshift(transaction);
    
    // Update all displays
    updateDashboard();
    updateTransactionsList();
    updateAnalytics();
    
    // Clear form
    document.getElementById('amount').value = '';
    document.getElementById('description').value = '';
    
    // Reset button text if it was changed
    const addBtn = document.querySelector('#manualForm .btn');
    addBtn.textContent = '➕ Add Transaction';
    addBtn.style.animation = '';
    
    // Show success message
    alert(`✅ ${type === 'income' ? 'Income' : 'Expense'} of $${amount.toFixed(2)} added successfully!`);
}

// Update dashboard calculations
function updateDashboard() {
    const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const profit = income - expenses;
    
    document.getElementById('totalIncome').textContent = `$${income.toFixed(2)}`;
    document.getElementById('totalExpenses').textContent = `$${expenses.toFixed(2)}`;
    document.getElementById('netProfit').textContent = `$${profit.toFixed(2)}`;
    document.getElementById('totalTransactions').textContent = transactions.length;
    
    // Change profit color based on positive/negative
    const profitElement = document.getElementById('netProfit');
    if (profit >= 0) {
        profitElement.className = 'amount profit';
    } else {
        profitElement.className = 'amount expense';
    }
}

// Update transactions list display
function updateTransactionsList() {
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
    if (confirm('Are you sure you want to delete this transaction?')) {
        transactions = transactions.filter(t => t.id !== id);
        updateDashboard();
        updateTransactionsList();
        updateAnalytics();
    }
}

// Initialize Analytics
function initializeAnalytics() {
    createTrendsChart();
    createCategoryChart();
    createPieChart();
    createMonthlyChart();
    updateAnalytics();
}

// Set analytics period
function setAnalyticsPeriod(period) {
    analyticsPeriod = period;
    document.querySelectorAll('.time-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
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
                legend: {
                    position: 'top',
                }
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
                legend: {
                    display: false
                }
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
                legend: {
                    position: 'bottom'
                }
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
                    // fallback color
                    return '#805ad5';
                }
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
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
    if (transactions.length === 0) {
        // Reset all charts and summaries
        updateSummaryCards();
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
    const data = getTimeSeriesData();
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
// Get time series data
function getTimeSeriesData() {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentDate = new Date();
    const labels = [];
    const incomeData = [];
    const expenseData = [];
    
    for (let i = 11; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthLabel = months[date.getMonth()] + ' ' + date.getFullYear();
        labels.push(monthLabel);
        
        const monthTransactions = transactions.filter(t => {
            const tDate = new Date(t.timestamp);
            return tDate.getMonth() === date.getMonth() && tDate.getFullYear() === date.getFullYear();
        });
        
        const monthIncome = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const monthExpenses = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        
        incomeData.push(monthIncome);
        expenseData.push(monthExpenses);
    }
    
    return { labels, income: incomeData, expenses: expenseData };
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

// Get monthly data
function getMonthlyData() {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentDate = new Date();
    const labels = [];
    const data = [];
    
    for (let i = 11; i >= 0; i--) { // Show last 12 months instead of 6
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthLabel = months[date.getMonth()] + ' ' + date.getFullYear();
        labels.push(monthLabel);
        
        const monthTransactions = transactions.filter(t => {
            const tDate = new Date(t.timestamp);
            return tDate.getMonth() === date.getMonth() && tDate.getFullYear() === date.getFullYear();
        });
        
        const monthIncome = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const monthExpenses = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const netProfit = monthIncome - monthExpenses;
        
        data.push(netProfit);
    }
    
    return { labels, data };
}

// Update summary cards
function updateSummaryCards() {
    if (transactions.length === 0) {
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