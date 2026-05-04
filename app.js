/**
 * MilkPro - Smart Collection Management System
 * Core Logic & State Management
 */

// --- Initial State & Storage ---
let state = {
    farmers: JSON.parse(localStorage.getItem('mp_farmers')) || [],
    vendors: JSON.parse(localStorage.getItem('mp_vendors')) || [],
    settings: JSON.parse(localStorage.getItem('mp_settings')) || { baseRate: 7.5 },
    theme: localStorage.getItem('mp_theme') || 'light'
};

const saveState = () => {
    localStorage.setItem('mp_farmers', JSON.stringify(state.farmers));
    localStorage.setItem('mp_vendors', JSON.stringify(state.vendors));
    localStorage.setItem('mp_settings', JSON.stringify(state.settings));
};

// --- Utilities ---
const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const showToast = (message, type = 'success') => {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'error' : ''}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}"></i>
        <span>${message}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

// --- Business Logic ---
const calculateFarmerAmount = (qty, fat) => {
    // Formula: Qty * (Fat / 10) * BaseRate (example formula generic for milk collection)
    // Or simpler: Total Fat = Qty * Fat. Price = Total Fat * (BaseRate / 10)
    // Adjust logic as per user's specific business if needed
    const amt = parseFloat(qty) * (parseFloat(fat) / 10) * state.settings.baseRate;
    return amt.toFixed(2);
};

const getCurrentSession = () => {
    const hour = new Date().getHours();
    return hour < 14 ? 'AM' : 'PM';
};

// --- UI Rendering ---

const updateDashboard = () => {
    const today = new Date().toISOString().split('T')[0];
    
    // Filter today's data
    const todayFarmers = state.farmers.filter(f => f.date === today);
    const todayVendors = state.vendors.filter(v => v.date === today);

    // Calc totals
    const totalCollected = todayFarmers.reduce((sum, f) => sum + parseFloat(f.qty), 0);
    const totalSold = todayVendors.reduce((sum, v) => sum + parseFloat(v.qty), 0);
    const totalPayments = todayFarmers.reduce((sum, f) => sum + parseFloat(f.amount), 0);
    const totalRevenue = todayVendors.reduce((sum, v) => sum + parseFloat(v.amount), 0);
    const netProfitToday = totalRevenue - totalPayments;

    // Update UI
    document.getElementById('stat-collected').innerText = `${totalCollected.toFixed(1)} L`;
    document.getElementById('stat-sold').innerText = `${totalSold.toFixed(1)} L`;
    document.getElementById('stat-paid').innerText = `₹${totalPayments.toLocaleString('en-IN')}`;
    document.getElementById('stat-revenue').innerText = `₹${totalRevenue.toLocaleString('en-IN')}`;
    
    const profitEl = document.getElementById('netProfit');
    profitEl.innerText = `₹${netProfitToday.toLocaleString('en-IN')}`;
    profitEl.style.color = netProfitToday >= 0 ? 'var(--primary-light)' : '#ef4444';
};

const renderFarmerTable = (list = state.farmers) => {
    const tbody = document.getElementById('farmerTableBody');
    tbody.innerHTML = '';
    
    // Sort by date desc
    const sorted = [...list].sort((a, b) => new Date(b.date) - new Date(a.date));

    sorted.slice(0, 50).forEach((item, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formatDate(item.date)}</td>
            <td><span class="badge">${item.session}</span></td>
            <td><strong>#${item.serial}</strong></td>
            <td>${item.qty}</td>
            <td>${item.fat}%</td>
            <td>₹${parseFloat(item.amount).toLocaleString('en-IN')}</td>
            <td>
                <div style="display:flex;gap:8px">
                    <button onclick="editFarmerEntry('${item.id}')" class="btn btn-outline" style="padding:4px 8px"><i class="fas fa-edit"></i></button>
                    <button onclick="deleteFarmerEntry('${item.id}')" class="btn btn-danger" style="padding:4px 8px"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
};

const renderVendorTable = () => {
    const tbody = document.getElementById('vendorTableBody');
    tbody.innerHTML = '';
    
    state.vendors.sort((a,b) => new Date(b.date) - new Date(a.date)).forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formatDate(item.date)}</td>
            <td><strong>${item.name}</strong></td>
            <td>${item.qty} L</td>
            <td>${item.fat}%</td>
            <td>₹${parseFloat(item.amount).toLocaleString('en-IN')}</td>
            <td>
                <button onclick="deleteVendorSale('${item.id}')" class="btn btn-danger" style="padding:4px 8px"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
};

// --- Actions ---

const deleteFarmerEntry = (id) => {
    if(confirm('Delete this entry?')) {
        state.farmers = state.farmers.filter(f => f.id !== id);
        saveState();
        renderFarmerTable();
        updateDashboard();
        showToast('Entry deleted');
    }
};

const deleteVendorSale = (id) => {
    if(confirm('Delete this sale record?')) {
        state.vendors = state.vendors.filter(v => v.id !== id);
        saveState();
        renderVendorTable();
        updateDashboard();
        showToast('Sale record deleted');
    }
};

window.editFarmerEntry = (id) => {
    const entry = state.farmers.find(f => f.id === id);
    if(entry) {
        document.getElementById('entryId').value = entry.id;
        document.getElementById('fDate').value = entry.date;
        document.getElementById('fSession').value = entry.session;
        document.getElementById('fSerial').value = entry.serial;
        document.getElementById('fSample').value = entry.sample;
        document.getElementById('fQty').value = entry.qty;
        document.getElementById('fFat').value = entry.fat;
        document.getElementById('fAmount').value = entry.amount;
        document.getElementById('farmerModalTitle').innerText = 'Edit Milk Entry';
        document.getElementById('farmerModal').classList.add('active');
    }
};

// --- Event Listeners ---

document.addEventListener('DOMContentLoaded', () => {
    // Theme setup
    if(state.theme === 'dark') document.body.setAttribute('data-theme', 'dark');

    // Init dash
    updateDashboard();
    renderFarmerTable();
    renderVendorTable();
    
    // Header Session
    const session = getCurrentSession();
    document.getElementById('sessionText').innerText = `${formatDate(new Date())} | ${session === 'AM' ? 'Morning' : 'Evening'} Session`;

    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('data-section');
            
            // UI Update
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
            document.getElementById(sectionId).classList.add('active');
            
            document.getElementById('pageTitle').innerText = link.querySelector('span').innerText;
            
            if(sectionId === 'reports') {
                // Set default dates for reports
                const today = new Date().toISOString().split('T')[0];
                document.getElementById('reportEnd').value = today;
                const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
                document.getElementById('reportStart').value = thirtyDaysAgo;
            }

            // Close sidebar on mobile
            document.getElementById('sidebar').classList.remove('open');
        });
    });

    // Mobile Sidebar
    document.getElementById('menuToggleBtn').onclick = () => document.getElementById('sidebar').classList.add('open');
    document.getElementById('menuCloseBtn').onclick = () => document.getElementById('sidebar').classList.remove('open');

    // Theme Toggle
    document.getElementById('themeToggle').onclick = () => {
        const isDark = document.body.hasAttribute('data-theme');
        if(isDark) {
            document.body.removeAttribute('data-theme');
            state.theme = 'light';
        } else {
            document.body.setAttribute('data-theme', 'dark');
            state.theme = 'dark';
        }
        localStorage.setItem('mp_theme', state.theme);
    };

    // Farmer Entry Modal Logic
    document.getElementById('openAddFarmerModal').onclick = () => {
        document.getElementById('farmerForm').reset();
        document.getElementById('entryId').value = '';
        document.getElementById('fDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('fSession').value = getCurrentSession();
        document.getElementById('farmerModalTitle').innerText = 'Add Milk Entry';
        document.getElementById('farmerModal').classList.add('active');
    };

    // Close Modals
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.onclick = () => {
            btn.closest('.modal').classList.remove('active');
        };
    });

    // Auto Calculation for Farmer
    const farmerCalcInputs = ['fQty', 'fFat'];
    farmerCalcInputs.forEach(id => {
        document.getElementById(id).oninput = () => {
            const qty = document.getElementById('fQty').value;
            const fat = document.getElementById('fFat').value;
            if(qty && fat) {
                document.getElementById('fAmount').value = calculateFarmerAmount(qty, fat);
            }
        };
    });

    document.getElementById('farmerForm').onsubmit = (e) => {
        e.preventDefault();
        const id = document.getElementById('entryId').value || Date.now().toString();
        const entry = {
            id,
            date: document.getElementById('fDate').value,
            session: document.getElementById('fSession').value,
            serial: document.getElementById('fSerial').value,
            sample: document.getElementById('fSample').value,
            qty: document.getElementById('fQty').value,
            fat: document.getElementById('fFat').value,
            amount: document.getElementById('fAmount').value
        };

        const existingIdx = state.farmers.findIndex(f => f.id === id);
        if(existingIdx > -1) {
            state.farmers[existingIdx] = entry;
            showToast('Entry updated!');
        } else {
            state.farmers.unshift(entry);
            showToast('Entry saved!');
        }

        saveState();
        renderFarmerTable();
        updateDashboard();
        document.getElementById('farmerModal').classList.remove('active');
    };

    // Vendor Entry Logic
    document.getElementById('openAddVendorModal').onclick = () => {
        document.getElementById('vendorForm').reset();
        document.getElementById('vDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('vendorModal').classList.add('active');
    };

    document.getElementById('vendorForm').onsubmit = (e) => {
        e.preventDefault();
        const entry = {
            id: Date.now().toString(),
            name: document.getElementById('vName').value,
            date: document.getElementById('vDate').value,
            qty: document.getElementById('vQty').value,
            fat: document.getElementById('vFat').value,
            amount: document.getElementById('vAmount').value
        };
        state.vendors.unshift(entry);
        saveState();
        renderVendorTable();
        updateDashboard();
        document.getElementById('vendorModal').classList.remove('active');
        showToast('Sale recorded!');
    };

    // Search logic
    document.getElementById('searchFarmer').oninput = (e) => {
        const term = e.target.value;
        const filtered = state.farmers.filter(f => f.serial.includes(term));
        renderFarmerTable(filtered);
    };

    // Settings
    document.getElementById('settingsForm').onsubmit = (e) => {
        e.preventDefault();
        state.settings.baseRate = parseFloat(document.getElementById('baseRate').value);
        saveState();
        showToast('Settings saved!');
    };

    // Report Generation Logic
    document.getElementById('generateReport').onclick = () => {
        const type = document.getElementById('reportType').value;
        const start = document.getElementById('reportStart').value;
        const end = document.getElementById('reportEnd').value;

        if(!start || !end) return showToast('Select dates', 'error');

        let data = state.farmers.filter(f => f.date >= start && f.date <= end);
        data.sort((a,b) => new Date(a.date) - new Date(b.date));

        const output = document.getElementById('reportOutput');
        output.classList.remove('hidden');
        
        const summaryCont = document.getElementById('reportSummary');
        const totalQty = data.reduce((s,f) => s + parseFloat(f.qty), 0);
        const totalAmt = data.reduce((s,f) => s + parseFloat(f.amount), 0);

        summaryCont.innerHTML = `
            <div class="stat-card">
                <div class="stat-info"><h3>Total Milk</h3><p>${totalQty.toFixed(1)} L</p></div>
            </div>
            <div class="stat-card">
                <div class="stat-info"><h3>Total Payable</h3><p>₹${totalAmt.toLocaleString('en-IN')}</p></div>
            </div>
            <div class="stat-card">
                <div class="stat-info"><h3>Average Fat</h3><p>${(data.reduce((s,f)=>s+parseFloat(f.fat),0)/(data.length||1)).toFixed(1)}%</p></div>
            </div>
        `;

        const rHead = document.getElementById('reportTableHeader');
        rHead.innerHTML = `<tr><th>Date</th><th>Serial</th><th>Qty</th><th>Fat</th><th>Amount</th></tr>`;
        
        const rBody = document.getElementById('reportTableBody');
        rBody.innerHTML = '';
        data.forEach(item => {
            rBody.innerHTML += `<tr>
                <td>${item.date} (${item.session})</td>
                <td>#${item.serial}</td>
                <td>${item.qty} L</td>
                <td>${item.fat}%</td>
                <td>₹${item.amount}</td>
            </tr>`;
        });
        
        document.getElementById('reportTitle').innerText = `${type.toUpperCase()} REPORT (${start} to ${end})`;
    };

    // Export to CSV
    document.getElementById('exportExcel').onclick = () => {
        if(state.farmers.length === 0) return showToast('No data to export', 'error');
        
        let csv = 'Date,Session,Serial,Qty,Fat,Amount\n';
        state.farmers.forEach(f => {
            csv += `${f.date},${f.session},${f.serial},${f.qty},${f.fat},${f.amount}\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `milk_report_${new Date().getTime()}.csv`;
        a.click();
    };

    // Print Receipt logic (Farmer Entry)
    document.getElementById('printReceipt').onclick = () => {
        const qty = document.getElementById('fQty').value;
        const amt = document.getElementById('fAmount').value;
        const serial = document.getElementById('fSerial').value;
        if(!qty) return;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html><head><title>Receipt</title>
            <style>
                body { font-family: monospace; text-align: center; padding: 20px; }
                .receipt { border: 1px dashed #000; padding: 10px; display: inline-block; }
                h2 { margin: 5px 0; }
            </style>
            </head><body>
                <div class="receipt">
                    <h2>MILKPRO CENTER</h2>
                    <p>Date: ${new Date().toLocaleDateString()}</p>
                    <p>Farmer: #${serial}</p>
                    <hr>
                    <p>Qty: ${qty} Liters</p>
                    <p>Fat: ${document.getElementById('fFat').value}%</p>
                    <h3>Amount: ₹${amt}</h3>
                    <hr>
                    <p>Thank you!</p>
                </div>
                <script>window.print(); window.close();</script>
            </body></html>
        `);
    };
});
