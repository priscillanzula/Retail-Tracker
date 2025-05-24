  // Global variables to store our data
  let transactions = [];
  let currentMethod = 'manual';
  let recognition = null;
  let isRecording = false;

  // Initialize the app when page loads
  document.addEventListener('DOMContentLoaded', function() {
      updateDashboard();
      setupSpeechRecognition();
  });

  // Method selection function
  function selectMethod(method) {
      // Remove active class from all methods
      document.querySelectorAll('.input-method').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.voice-controls, .photo-upload, .manual-form').forEach(el => el.classList.remove('active'));
      
      // Add active class to selected method
      event.target.closest('.input-method').classList.add('active');
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

  // Process voice input and extract transaction details
  function processVoiceInput(transcript) {
      const text = transcript.toLowerCase();
      
      // Extract type (income or expense)
      let type = 'expense'; // default
      if (text.includes('income') || text.includes('earned') || text.includes('sold') || text.includes('revenue')) {
          type = 'income';
      }
      
      // Extract amount using regex
      const amountMatch = text.match(/(\d+(?:,\d{3})*(?:\.\d{2})?)/);
      let amount = parseFloat(amountMatch[1].replace(/,/g, ''));
      
      // Extract description (everything after amount-related words)
      let description = transcript;
      if (text.includes('for ')) {
          description = transcript.split('for ')[1];
      } else if (text.includes('from ')) {
          description = transcript.split('from ')[1];
      }
      
      // Auto-populate the manual form
      document.getElementById('transactionType').value = type;
      document.getElementById('amount').value = amount;
      document.getElementById('description').value = description;
      
      // Show manual form for review
      selectMethod('manual');
      
      // Auto-submit if we have valid data
      if (amount > 0 && description.length > 3) {
        setTimeout(() => {
            selectMethod('manual');
            document.getElementById('manualForm').scrollIntoView({behavior: 'smooth'});
            const addBtn = document.querySelector('#manualForm .btn');
            addBtn.style.animation = 'pulse 2s infinite';
            addBtn.textContent = '✅ Add This Transaction';
        }, 500);
      }
  }

  // Photo upload handler
  function handlePhotoUpload() {
      const file = document.getElementById('photoInput').files[0];
      if (!file) return;
      
      // Show loading
      document.getElementById('photoLoading').style.display = 'block';
      
      // Create preview
      const reader = new FileReader();
      reader.onload = function(e) {
          const preview = document.getElementById('photoPreview');
          preview.innerHTML = `<img src="${e.target.result}" alt="Receipt preview" class="photo-preview">`;
      };
      reader.readAsDataURL(file);
      
      // Simulate OCR processing (in real app, you'd use OCR API)
      setTimeout(() => {
          document.getElementById('photoLoading').style.display = 'none';
          
          // Simulate more realistic extracted data
          const receiptItems = [
            { amount: 25.99, description: 'Office supplies from receipt', type: 'expense' },
            { amount: 45.50, description: 'Business lunch receipt', type: 'expense' },
            { amount: 12.75, description: 'Parking receipt', type: 'expense' },
            { amount: 89.99, description: 'Equipment purchase', type: 'expense' },
            { amount: 150.00, description: 'Client payment received', type: 'income' }
        ];

        const mockData = receiptItems[Math.floor(Math.random() * receiptItems.length)];

          
          // Populate manual form
          document.getElementById('transactionType').value = mockData.type;
          document.getElementById('amount').value = mockData.amount;
          document.getElementById('description').value = mockData.description;
          
          // Switch to manual form for review
          selectMethod('manual');
          
          alert('Receipt processed! Please review the extracted details and click "Add Transaction".');
      }, 2000);
  }

  // Add transaction function
  function addTransaction() {
      const type = document.getElementById('transactionType').value;
      const amount = parseFloat(document.getElementById('amount').value);
      const description = document.getElementById('description').value;
      const category = document.getElementById('category').value;
      
      if (!amount || amount <= 0) {
          alert('Please enter a valid amount');
          return;
      }
      
      if (!description.trim()) {
          alert('Please enter a description');
          return;
      }
      
      // Create transaction object
      const transaction = {
          id: Date.now(),
          type: type,
          amount: amount,
          description: description.trim(),
          category: category,
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString()
      };
      
      // Add to transactions array
      transactions.unshift(transaction);
      
      // Update display
      updateDashboard();
      updateTransactionsList();
      
      // Clear form
      document.getElementById('amount').value = '';
      document.getElementById('description').value = '';
      
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
      }
  }