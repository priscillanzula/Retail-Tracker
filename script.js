backgroundColor: (context) => {
    // Safely check for parsed and y
    if (context.parsed && typeof context.parsed.y !== 'undefined') {
        return context.parsed.y >= 0 ? '#38a169' : '#e53e3e';
    }
    // fallback color
    return '#805ad5';
}

// Global variables to store our data
let transactions = []; // [cite: 1]
let users = []; // Stores registered user data [cite: 1]
let currentUser = null; // Tracks the currently logged-in user [cite: 1]
let currentMethod = 'manual'; // [cite: 1]
let recognition = null; // [cite: 1]
let isRecording = false; // [cite: 1]
let analyticsPeriod = 'year'; // [cite: 1]
let charts = {}; // [cite: 1]

// Initialize the app when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Check if there's a logged-in user in session storage
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        document.getElementById('homepage').classList.add('hidden');
        document.getElementById('mainContent').classList.remove('hidden');
        // Add a logout button to the header
        const authButtonsDiv = document.querySelector('.auth-buttons');
        authButtonsDiv.innerHTML = `<span style="color: white; margin-right: 10px;">Welcome, ${currentUser.businessName}!</span><button class="btn btn-secondary" onclick="logoutUser()">Logout</button>`;
        // Load transactions for the logged-in user (if implemented per user)
        // For now, load sample data if user exists
        loadSampleData();
        updateDashboard(); // [cite: 1]
        initializeAnalytics(); // [cite: 1]
        updateTransactionsList(); // [cite: 1]
    } else {
        document.getElementById('homepage').classList.remove('hidden');
        document.getElementById('mainContent').classList.add('hidden');
    }

    setupSpeechRecognition(); // [cite: 1]
    // Initialize analytics only if content is visible (i.e., user is logged in)
    if (document.getElementById('mainContent').classList.contains('hidden')) {
        // Do nothing, analytics initialized after login
    } else {
        initializeAnalytics();
    }
    selectMethod('manual'); // Default to manual input [cite: 1]
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
    showLogin(); // Automatically switch to login form
}

function loginUser() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const foundUser = users.find(user => user.email === email && user.password === password);

    if (foundUser) {
        currentUser = foundUser;
        localStorage.setItem('currentUser', JSON.stringify(currentUser)); // Store current user
        alert('Login successful! Welcome back, ' + currentUser.businessName + '!');
        closeModal('loginModal');
        document.getElementById('homepage').classList.add('hidden');
        document.getElementById('mainContent').classList.remove('hidden');

        // Update auth buttons
        const authButtonsDiv = document.querySelector('.auth-buttons');
        authButtonsDiv.innerHTML = `<span style="color: white; margin-right: 10px;">Welcome, ${currentUser.businessName}!</span><button class="btn btn-secondary" onclick="logoutUser()">Logout</button>`;


        // Load sample data for demo. In a real app, you'd load user-specific data from a backend.
        loadSampleData();
        updateDashboard(); // [cite: 1]
        updateTransactionsList(); // [cite: 1]
        initializeAnalytics(); // [cite: 1]
    } else {
        alert('Invalid email or password. Please try again or register.');
    }
}

function logoutUser() {
    currentUser = null;
    localStorage.removeItem('currentUser'); // Clear stored user
    transactions = []; // Clear transactions on logout
    alert('You have been logged out.');
    document.getElementById('mainContent').classList.add('hidden');
    document.getElementById('homepage').classList.remove('hidden');

    // Reset auth buttons
    const authButtonsDiv = document.querySelector('.auth-buttons');
    authButtonsDiv.innerHTML = `<button class="btn" onclick="openModal('loginModal')">Login</button>
                                <button class="btn" onclick="openModal('registerModal')">Register</button>`;

    // Clear dashboard and charts
    updateDashboard();
    updateTransactionsList();
    // Re-initialize analytics to clear charts
    initializeAnalytics(); // This will clear charts as there's no data
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
function selectMethod(method, event) { // [cite: 1]
    // Remove active class from all methods
    document.querySelectorAll('.input-method').forEach(el => el.classList.remove('active')); // [cite: 1]
    document.querySelectorAll('.voice-controls, .photo-upload, .manual-form').forEach(el => el.classList.remove('active')); // [cite: 1]

    // Add active class to selected method
    if (event && event.target) { // [cite: 1]
        // If called from a click event
        const methodDiv = event.target.closest('.input-method'); // [cite: 1]
        if (methodDiv) methodDiv.classList.add('active'); // [cite: 1]
    } else {
        // If called programmatically, find by method
        const methodDiv = document.querySelector(`.input-method[onclick*="${method}"]`); // [cite: 1]
        if (methodDiv) methodDiv.classList.add('active'); // [cite: 1]
    }
    currentMethod = method; // [cite: 1]

    // Show appropriate input section
    if (method === 'voice') { // [cite: 1]
        document.getElementById('voiceControls').classList.add('active'); // [cite: 1]
    } else if (method === 'photo') { // [cite: 1]
        document.getElementById('photoUpload').classList.add('active'); // [cite: 1]
    } else {
        document.getElementById('manualForm').classList.add('active'); // [cite: 1]
    }
}

// Speech Recognition Setup
function setupSpeechRecognition() { // [cite: 1]
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) { // [cite: 1]
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition; // [cite: 1]
        recognition = new SpeechRecognition(); // [cite: 1]

        recognition.continuous = false; // [cite: 1]
        recognition.interimResults = false; // [cite: 1]
        recognition.lang = 'en-US'; // [cite: 1]

        recognition.onstart = function() { // [cite: 1]
            isRecording = true; // [cite: 1]
            document.getElementById('voiceStatus').textContent = '🎤 Listening... Speak now!'; // [cite: 1]
            document.getElementById('voiceStatus').style.background = '#fed7d7'; // [cite: 1]
        };

        recognition.onresult = function(event) { // [cite: 1]
            const transcript = event.results[0][0].transcript; // [cite: 1]
            document.getElementById('voiceStatus').textContent = `Heard: "${transcript}"`; // [cite: 1]
            document.getElementById('voiceStatus').style.background = '#c6f6d5'; // [cite: 1]
            processVoiceInput(transcript); // [cite: 1]
        };

        recognition.onerror = function(event) { // [cite: 1]
            document.getElementById('voiceStatus').textContent = `Error: ${event.error}`; // [cite: 1]
            document.getElementById('voiceStatus').style.background = '#fed7d7'; // [cite: 1]
            isRecording = false; // [cite: 1]
        };

        recognition.onend = function() { // [cite: 1]
            isRecording = false; // [cite: 1]
        };
    } else {
        document.getElementById('voiceControls').innerHTML = '<p style="color: #f56565;">Speech recognition not supported in this browser. Please use Chrome or Edge.</p>'; // [cite: 1]
    }
}

// Voice recording functions
function startVoiceRecording() { // [cite: 1]
    if (recognition && !isRecording) { // [cite: 1]
        recognition.start(); // [cite: 1]
    }
}

function stopVoiceRecording() { // [cite: 1]
    if (recognition && isRecording) { // [cite: 1]
        recognition.stop(); // [cite: 1]
    }
}

function processVoiceInput(transcript) { // [cite: 1]
    // Lowercase for easier matching
    const text = transcript.toLowerCase(); // [cite: 1]

    // Extract type
    let type = ''; // [cite: 1]
    if (text.includes('income')) type = 'income'; // [cite: 1]
    else if (text.includes('expense')) type = 'expense'; // [cite: 1]

    // Extract amount
    let amountMatch = text.match(/(\d+(\.\d+)?)/); // [cite: 1]
    let amount = amountMatch ? parseFloat(amountMatch[1]) : ''; // [cite: 1]

    // Extract date (format: YYYY-MM-DD or MM/DD/YYYY or "today"/"yesterday")
    let date = ''; // [cite: 1]
    let dateMatch = text.match(/(\d{4}-\d{2}-\d{2})/); // YYYY-MM-DD [cite: 1]
    if (dateMatch) { // [cite: 1]
        date = dateMatch[1]; // [cite: 1]
    } else if (text.includes('today')) { // [cite: 1]
        date = new Date().toISOString().split('T')[0]; // [cite: 1]
    } else if (text.includes('yesterday')) { // [cite: 1]
        let d = new Date(); // [cite: 1]
        d.setDate(d.getDate() - 1); // [cite: 1]
        date = d.toISOString().split('T')[0]; // [cite: 1]
    }

    // Extract category (looks for "category X" or "in X" or "for X")
    let category = ''; // [cite: 1]
    let catMatch = text.match(/category (\w+)/); // [cite: 1]
    if (catMatch) { // [cite: 1]
        category = catMatch[1]; // [cite: 1]
    } else {
        let inMatch = text.match(/in (\w+)/); // [cite: 1]
        if (inMatch) category = inMatch[1]; // [cite: 1]
        let forMatch = text.match(/for ([a-z ]+)/); // [cite: 1]
        if (forMatch) category = forMatch[1].trim().split(' ')[0]; // [cite: 1]
    }

    // Extract description (after "for" or "on")
    let description = ''; // [cite: 1]
    let descMatch = text.match(/for (.+?)( on | in |$)/); // [cite: 1]
    if (descMatch) { // [cite: 1]
        description = descMatch[1].trim(); // [cite: 1]
    } else {
        // fallback: use the whole transcript
        description = transcript; // [cite: 1]
    }

    // Fill the manual form fields
    if (type) document.getElementById('transactionType').value = type; // [cite: 1]
    if (amount) document.getElementById('amount').value = amount; // [cite: 1]
    if (description) document.getElementById('description').value = description; // [cite: 1]
    if (category) document.getElementById('category').value = category; // [cite: 1]
    if (date) document.getElementById('transactionDate').value = date; // [cite: 1]

    // Show manual form for review
    selectMethod('manual'); // [cite: 1]


}

// Photo upload handler
function handlePhotoUpload() { // [cite: 1]
    const input = document.getElementById('photoInput'); // [cite: 1]
    const preview = document.getElementById('photoPreview'); // [cite: 1]
    const loading = document.getElementById('photoLoading'); // [cite: 1]

    preview.innerHTML = ''; // [cite: 1]

    if (input.files && input.files[0]) { // [cite: 1]
        const file = input.files[0]; // [cite: 1]
        const reader = new FileReader(); // [cite: 1]

        loading.style.display = 'block'; // [cite: 1]

        reader.onload = function(e) { // [cite: 1]
            const img = document.createElement('img'); // [cite: 1]
            img.src = e.target.result; // [cite: 1]
            img.style.maxWidth = '200px'; // [cite: 1]
            img.style.maxHeight = '200px'; // [cite: 1]
            img.style.borderRadius = '8px'; // [cite: 1]
            img.style.marginTop = '15px'; // [cite: 1]
            preview.appendChild(img); // [cite: 1]

            // Simulate OCR processing
            setTimeout(() => {
                loading.style.display = 'none'; // [cite: 1]

                // Simulate realistic extracted data with date
                const receiptItems = [ // [cite: 1]
                    { amount: 25.99, description: 'Office supplies from receipt', type: 'expense', category: 'supplies', date: '2024-05-26' }, // [cite: 1]
                    { amount: 45.50, description: 'Business lunch receipt', type: 'expense', category: 'food', date: '2024-05-25' }, // [cite: 1]
                    { amount: 12.75, description: 'Parking receipt', type: 'expense', category: 'travel', date: '2024-05-24' }, // [cite: 1]
                    { amount: 89.99, description: 'Equipment purchase', type: 'expense', category: 'supplies', date: '2024-05-23' }, // [cite: 1]
                    { amount: 150.00, description: 'Client payment received', type: 'income', category: 'services', date: '2024-05-22' } // [cite: 1]
                ];

                const mockData = receiptItems[Math.floor(Math.random() * receiptItems.length)]; // [cite: 1]

                // Populate manual form
                document.getElementById('transactionType').value = mockData.type; // [cite: 1]
                document.getElementById('amount').value = mockData.amount; // [cite: 1]
                document.getElementById('description').value = mockData.description; // [cite: 1]
                document.getElementById('category').value = mockData.category; // [cite: 1]
                document.getElementById('transactionDate').value = mockData.date; // <-- Set the date [cite: 1]

                // Switch to manual form for review
                selectMethod('manual'); // [cite: 1]

                alert('Receipt processed! Please review the extracted details and click "Add Transaction".'); // [cite: 1]
            }, 2000); // [cite: 1]
        };

        reader.readAsDataURL(file); // [cite: 1]
    }
}

// Add transaction function
function addTransaction() { // [cite: 1]
    if (!currentUser) {
        alert('Please login to add transactions.');
        return;
    }

    const type = document.getElementById('transactionType').value; // [cite: 1]
    const amount = parseFloat(document.getElementById('amount').value); // [cite: 1]
    const description = document.getElementById('description').value; // [cite: 1]
    const category = document.getElementById('category').value; // [cite: 1]
    const dateInput = document.getElementById('transactionDate').value; // [cite: 1]

    if (!amount || amount <= 0) { // [cite: 1]
        alert('Please enter a valid amount'); // [cite: 1]
        return; // [cite: 1]
    }

    if (!description.trim()) { // [cite: 1]
        alert('Please enter a description'); // [cite: 1]
        return; // [cite: 1]
    }
    // Use selected date or today's date if not set
    const dateObj = dateInput ? new Date(dateInput) : new Date(); // [cite: 1]
    const date = dateObj.toLocaleDateString(); // [cite: 1]
    const time = dateObj.toLocaleTimeString(); // [cite: 1]
    const year = dateObj.getFullYear(); // [cite: 1]
    const month = dateObj.getMonth() + 1; // 1-based [cite: 1]

    // Create transaction object
    const transaction = { // [cite: 1]
        id: Date.now(), // [cite: 1]
        type: type, // [cite: 1]
        amount: amount, // [cite: 1]
        description: description.trim(), // [cite: 1]
        category: category, // [cite: 1]
        date: date, // [cite: 1]
        time: time, // [cite: 1]
        year: year, // [cite: 1]
        month: month, // [cite: 1]
        timestamp: dateObj // [cite: 1]
    };
    // Add to transactions array
    transactions.unshift(transaction); // [cite: 1]

    // Update all displays
    updateDashboard(); // [cite: 1]
    updateTransactionsList(); // [cite: 1]
    updateAnalytics(); // [cite: 1]

    // Clear form
    document.getElementById('amount').value = ''; // [cite: 1]
    document.getElementById('description').value = ''; // [cite: 1]
    document.getElementById('transactionDate').value = ''; // Clear date input
    document.getElementById('category').value = 'other'; // Reset category
    document.getElementById('transactionType').value = 'income'; // Reset type

    // Reset button text if it was changed
    const addBtn = document.querySelector('#manualForm .btn'); // [cite: 1]
    addBtn.textContent = '➕ Add Transaction'; // [cite: 1]
    addBtn.style.animation = ''; // [cite: 1]

    // Show success message
    alert(`✅ ${type === 'income' ? 'Income' : 'Expense'} of $${amount.toFixed(2)} added successfully!`); // [cite: 1]
}

// Update dashboard calculations
function updateDashboard() { // [cite: 1]
    if (!currentUser) return; // Only update if logged in

    const income = transactions // [cite: 1]
        .filter(t => t.type === 'income') // [cite: 1]
        .reduce((sum, t) => sum + t.amount, 0); // [cite: 1]

    const expenses = transactions // [cite: 1]
        .filter(t => t.type === 'expense') // [cite: 1]
        .reduce((sum, t) => sum + t.amount, 0); // [cite: 1]

    const profit = income - expenses; // [cite: 1]

    document.getElementById('totalIncome').textContent = `$${income.toFixed(2)}`; // [cite: 1]
    document.getElementById('totalExpenses').textContent = `$${expenses.toFixed(2)}`; // [cite: 1]
    document.getElementById('netProfit').textContent = `$${profit.toFixed(2)}`; // [cite: 1]
    document.getElementById('totalTransactions').textContent = transactions.length; // [cite: 1]

    // Change profit color based on positive/negative
    const profitElement = document.getElementById('netProfit'); // [cite: 1]
    if (profit >= 0) { // [cite: 1]
        profitElement.className = 'amount profit'; // [cite: 1]
    } else {
        profitElement.className = 'amount expense'; // [cite: 1]
    }
}

// Update transactions list display
function updateTransactionsList() { // [cite: 1]
    if (!currentUser) return; // Only update if logged in

    const container = document.getElementById('transactionsList'); // [cite: 1]

    if (transactions.length === 0) { // [cite: 1]
        container.innerHTML = '<p style="text-align: center; color: #718096; padding: 40px;">No transactions yet. Add your first transaction above!</p>'; // [cite: 1]
        return; // [cite: 1]
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
    `).join(''); // [cite: 1]
}

// Delete transaction function
function deleteTransaction(id) { // [cite: 1]
    if (!currentUser) return; // Only allow if logged in

    if (confirm('Are you sure you want to delete this transaction?')) { // [cite: 1]
        transactions = transactions.filter(t => t.id !== id); // [cite: 1]
        updateDashboard(); // [cite: 1]
        updateTransactionsList(); // [cite: 1]
        updateAnalytics(); // [cite: 1]
    }
}

// Initialize Analytics
function initializeAnalytics() { // [cite: 1]
    if (!currentUser) {
        // Clear existing charts if any, and return
        for (const chartKey in charts) {
            if (charts[chartKey]) {
                charts[chartKey].destroy();
                charts[chartKey] = null; // Clear reference
            }
        }
        updateSummaryCards(); // Clear summary cards
        return;
    }

    // Destroy existing charts if they exist before creating new ones
    for (const chartKey in charts) {
        if (charts[chartKey]) {
            charts[chartKey].destroy();
        }
    }

    createTrendsChart(); // [cite: 1]
    createCategoryChart(); // [cite: 1]
    createPieChart(); // [cite: 1]
    createMonthlyChart(); // [cite: 1]
    updateAnalytics(); // [cite: 1]
}

// Set analytics period
function setAnalyticsPeriod(period, event) { // [cite: 1]
    if (!currentUser) return; // Only allow if logged in

    analyticsPeriod = period; // [cite: 1]
    document.querySelectorAll('.time-btn').forEach(btn => btn.classList.remove('active')); // [cite: 1]
    if (event && event.target) { // Ensure event and target exist
        event.target.classList.add('active'); // [cite: 1]
    } else {
        // If called programmatically, find and activate the button
        const targetBtn = document.querySelector(`.time-btn[onclick*="${period}"]`);
        if (targetBtn) targetBtn.classList.add('active');
    }
    updateAnalytics(); // [cite: 1]
}

// Create Trends Chart
function createTrendsChart() { // [cite: 1]
    const ctx = document.getElementById('trendsChart').getContext('2d'); // [cite: 1]
    charts.trends = new Chart(ctx, { // [cite: 1]
        type: 'line', // [cite: 1]
        data: { // [cite: 1]
            labels: [], // [cite: 1]
            datasets: [{ // [cite: 1]
                label: 'Income', // [cite: 1]
                data: [], // [cite: 1]
                borderColor: '#13c45c', // [cite: 1]
                backgroundColor: 'rgba(19, 196, 92, 0.1)', // [cite: 1]
                tension: 0.4 // [cite: 1]
            }, {
                label: 'Expenses', // [cite: 1]
                data: [], // [cite: 1]
                borderColor: '#bd0d0d', // [cite: 1]
                backgroundColor: 'rgba(189, 13, 13, 0.1)', // [cite: 1]
                tension: 0.4 // [cite: 1]
            }]
        },
        options: { // [cite: 1]
            responsive: true, // [cite: 1]
            plugins: { // [cite: 1]
                legend: { // [cite: 1]
                    position: 'top', // [cite: 1]
                }
            },
            scales: { // [cite: 1]
                y: { // [cite: 1]
                    beginAtZero: true, // [cite: 1]
                    ticks: { // [cite: 1]
                        callback: function(value) { // [cite: 1]
                            return '$' + value; // [cite: 1]
                        }
                    }
                }
            }
        }
    });
}

// Create Category Chart
function createCategoryChart() { // [cite: 1]
    const ctx = document.getElementById('categoryChart').getContext('2d'); // [cite: 1]
    charts.category = new Chart(ctx, { // [cite: 1]
        type: 'bar', // [cite: 1]
        data: { // [cite: 1]
            labels: [], // [cite: 1]
            datasets: [{ // [cite: 1]
                label: 'Amount ($)', // [cite: 1]
                data: [], // [cite: 1]
                backgroundColor: [ // [cite: 1]
                    '#667eea', '#764ba2', '#13c45c', '#bd0d0d', // [cite: 1]
                    '#f093fb', '#f5576c', '#4facfe', '#00f2fe' // [cite: 1]
                ]
            }]
        },
        options: { // [cite: 1]
            responsive: true, // [cite: 1]
            plugins: { // [cite: 1]
                legend: { // [cite: 1]
                    display: false // [cite: 1]
                }
            },
            scales: { // [cite: 1]
                y: { // [cite: 1]
                    beginAtZero: true, // [cite: 1]
                    ticks: { // [cite: 1]
                        callback: function(value) { // [cite: 1]
                            return '$' + value; // [cite: 1]
                        }
                    }
                }
            }
        }
    });
}

// Create Pie Chart
function createPieChart() { // [cite: 1]
    const ctx = document.getElementById('pieChart').getContext('2d'); // [cite: 1]
    charts.pie = new Chart(ctx, { // [cite: 1]
        type: 'doughnut', // [cite: 1]
        data: { // [cite: 1]
            labels: ['Income', 'Expenses'], // [cite: 1]
            datasets: [{ // [cite: 1]
                data: [0, 0], // [cite: 1]
                backgroundColor: ['#13c45c', '#bd0d0d'], // [cite: 1]
                borderWidth: 0 // [cite: 1]
            }]
        },
        options: { // [cite: 1]
            responsive: true, // [cite: 1]
            plugins: { // [cite: 1]
                legend: { // [cite: 1]
                    position: 'bottom' // [cite: 1]
                }
            }
        }
    });
}

// Create Monthly Chart
function createMonthlyChart() { // [cite: 1]
    const ctx = document.getElementById('monthlyChart').getContext('2d'); // [cite: 1]
    charts.monthly = new Chart(ctx, { // [cite: 1]
        type: 'bar', // [cite: 1]
        data: { // [cite: 1]
            labels: [], // [cite: 1]
            datasets: [{ // [cite: 1]
                label: 'Net Profit', // [cite: 1]
                data: [], // [cite: 1]
                backgroundColor: function(context) { // [cite: 1]
                    // Safely check for parsed and y
                    if (context.parsed && typeof context.parsed.y !== 'undefined') { // [cite: 1]
                        return context.parsed.y >= 0 ? '#13c45c' : '#bd0d0d'; // [cite: 1]
                    }
                    // fallback color
                    return '#805ad5'; // [cite: 1]
                }
            }]
        },
        options: { // [cite: 1]
            responsive: true, // [cite: 1]
            plugins: { // [cite: 1]
                legend: { // [cite: 1]
                    display: false // [cite: 1]
                }
            },
            scales: { // [cite: 1]
                y: { // [cite: 1]
                    ticks: { // [cite: 1]
                        callback: function(value) { // [cite: 1]
                            return '$' + value; // [cite: 1]
                        }
                    }
                }
            }
        }
    });
}

// Update Analytics
function updateAnalytics() { // [cite: 1]
    if (!currentUser) return; // Only update if logged in

    if (transactions.length === 0) { // [cite: 1]
        // Reset all charts and summaries
        updateSummaryCards(); // [cite: 1]
        // Destroy existing charts if they exist
        for (const chartKey in charts) {
            if (charts[chartKey]) {
                charts[chartKey].destroy();
                charts[chartKey] = null; // Clear reference
            }
        }
        createTrendsChart(); // Recreate empty charts
        createCategoryChart();
        createPieChart();
        createMonthlyChart();
        return; // [cite: 1]
    }

    updateTrendsChart(); // [cite: 1]
    updateCategoryChart(); // [cite: 1]
    updatePieChart(); // [cite: 1]
    updateMonthlyChart(); // [cite: 1]
    updateSummaryCards(); // [cite: 1]
}

// Update Trends Chart
function updateTrendsChart() { // [cite: 1]
    const data = getTimeSeriesData(); // [cite: 1]
    charts.trends.data.labels = data.labels; // [cite: 1]
    charts.trends.data.datasets[0].data = data.income; // [cite: 1]
    charts.trends.data.datasets[1].data = data.expenses; // [cite: 1]
    charts.trends.update(); // [cite: 1]
}

// Update Category Chart
function updateCategoryChart() { // [cite: 1]
    const categoryData = getCategoryData(); // [cite: 1]
    charts.category.data.labels = categoryData.labels; // [cite: 1]
    charts.category.data.datasets[0].data = categoryData.data; // [cite: 1]
    charts.category.update(); // [cite: 1]
}

// Update Pie Chart
function updatePieChart() { // [cite: 1]
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0); // [cite: 1]
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0); // [cite: 1]

    charts.pie.data.datasets[0].data = [totalIncome, totalExpenses]; // [cite: 1]
    charts.pie.update(); // [cite: 1]
}

// Update Monthly Chart
function updateMonthlyChart() { // [cite: 1]
    const monthlyData = getMonthlyData(); // [cite: 1]
    charts.monthly.data.labels = monthlyData.labels; // [cite: 1]
    charts.monthly.data.datasets[0].data = monthlyData.data; // [cite: 1]
    charts.monthly.update(); // [cite: 1]
}
// Get time series data
function getTimeSeriesData() { // [cite: 1]
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']; // [cite: 1]
    const currentDate = new Date(); // [cite: 1]
    const labels = []; // [cite: 1]
    const incomeData = []; // [cite: 1]
    const expenseData = []; // [cite: 1]

    for (let i = 11; i >= 0; i--) { // [cite: 1]
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1); // [cite: 1]
        const monthLabel = months[date.getMonth()] + ' ' + date.getFullYear(); // [cite: 1]
        labels.push(monthLabel); // [cite: 1]

        const monthTransactions = transactions.filter(t => { // [cite: 1]
            const tDate = new Date(t.timestamp); // [cite: 1]
            return tDate.getMonth() === date.getMonth() && tDate.getFullYear() === date.getFullYear(); // [cite: 1]
        });

        const monthIncome = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0); // [cite: 1]
        const monthExpenses = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0); // [cite: 1]

        incomeData.push(monthIncome); // [cite: 1]
        expenseData.push(monthExpenses); // [cite: 1]
    }

    return { labels, income: incomeData, expenses: expenseData }; // [cite: 1]
}

// Get category data
function getCategoryData() { // [cite: 1]
    const categories = {}; // [cite: 1]

    transactions.forEach(t => { // [cite: 1]
        if (!categories[t.category]) { // [cite: 1]
            categories[t.category] = 0; // [cite: 1]
        }
        categories[t.category] += t.amount; // [cite: 1]
    });

    const labels = Object.keys(categories); // [cite: 1]
    const data = Object.values(categories); // [cite: 1]

    return { labels, data }; // [cite: 1]
}

// Get monthly data
function getMonthlyData() { // [cite: 1]
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']; // [cite: 1]
    const currentDate = new Date(); // [cite: 1]
    const labels = []; // [cite: 1]
    const data = []; // [cite: 1]

    for (let i = 11; i >= 0; i--) { // Show last 12 months instead of 6 [cite: 1]
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1); // [cite: 1]
        const monthLabel = months[date.getMonth()] + ' ' + date.getFullYear(); // [cite: 1]
        labels.push(monthLabel); // [cite: 1]

        const monthTransactions = transactions.filter(t => { // [cite: 1]
            const tDate = new Date(t.timestamp); // [cite: 1]
            return tDate.getMonth() === date.getMonth() && tDate.getFullYear() === date.getFullYear(); // [cite: 1]
        });

        const monthIncome = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0); // [cite: 1]
        const monthExpenses = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0); // [cite: 1]
        const netProfit = monthIncome - monthExpenses; // [cite: 1]

        data.push(netProfit); // [cite: 1]
    }

    return { labels, data }; // [cite: 1]
}

// Update summary cards
function updateSummaryCards() { // [cite: 1]
    if (!currentUser || transactions.length === 0) { // [cite: 1]
        document.getElementById('topIncomeCategory').textContent = 'N/A'; // [cite: 1]
        document.getElementById('topExpenseCategory').textContent = 'N/A'; // [cite: 1]
        document.getElementById('bestMonth').textContent = 'N/A'; // [cite: 1]
        document.getElementById('avgTransaction').textContent = '$0.00'; // [cite: 1]
        return; // [cite: 1]
    }

    // Top income category
    const incomeCategories = {}; // [cite: 1]
    transactions.filter(t => t.type === 'income').forEach(t => { // [cite: 1]
        incomeCategories[t.category] = (incomeCategories[t.category] || 0) + t.amount; // [cite: 1]
    });
    const topIncomeCategory = Object.keys(incomeCategories).reduce((a, b) => // [cite: 1]
        incomeCategories[a] > incomeCategories[b] ? a : b, 'N/A'); // [cite: 1]

    // Top expense category
    const expenseCategories = {}; // [cite: 1]
    transactions.filter(t => t.type === 'expense').forEach(t => { // [cite: 1]
        expenseCategories[t.category] = (expenseCategories[t.category] || 0) + t.amount; // [cite: 1]
    });
    const topExpenseCategory = Object.keys(expenseCategories).reduce((a, b) => // [cite: 1]
        expenseCategories[a] > expenseCategories[b] ? a : b, 'N/A'); // [cite: 1]

    // Best month
    const monthlyProfits = getMonthlyData(); // [cite: 1]
    const bestMonthIndex = monthlyProfits.data.indexOf(Math.max(...monthlyProfits.data)); // [cite: 1]
    const bestMonth = monthlyProfits.labels[bestMonthIndex] || 'N/A'; // [cite: 1]

    // Average transaction
    const avgTransaction = transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length; // [cite: 1]

    document.getElementById('topIncomeCategory').textContent = topIncomeCategory.charAt(0).toUpperCase() + topIncomeCategory.slice(1); // [cite: 1]
    document.getElementById('topExpenseCategory').textContent = topExpenseCategory.charAt(0).toUpperCase() + topExpenseCategory.slice(1); // [cite: 1]
    document.getElementById('bestMonth').textContent = bestMonth; // [cite: 1]
    document.getElementById('avgTransaction').textContent = '$' + avgTransaction.toFixed(2); // [cite: 1]
}