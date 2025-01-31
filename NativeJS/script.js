document.addEventListener('DOMContentLoaded', () => {
    const transactionForm = document.getElementById('transactionForm');
    const amountInput = document.getElementById('amount');
    const typeInput = document.getElementById('type');
    const descriptionInput = document.getElementById('description');
    const transactionList = document.getElementById('transactionList');
    const balanceElement = document.getElementById('balance');
    const balanceGif = document.getElementById('balanceGif');
    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    let balance = parseFloat(localStorage.getItem('balance')) || 0;
    let currentCurrency = 'RUB';
    let exchangeRates = {};

    const ctx = document.getElementById('budgetChart').getContext('2d');
    let budgetChart;

    if (isNaN(balance) || balance === null) {
        balance = 0;
        localStorage.setItem('balance', balance);
    }

    amountInput.addEventListener('input', function() {
        this.value = this.value.replace(/[^0-9.-]/g, '').replace(/(\..*)\./g, '$1');
        if (this.value.includes('.')) {
            this.value = parseFloat(this.value).toFixed(2);
        }
    });

    updateBalance();
    renderTransactions();
    updateChart();

    // Обработчик события отправки формы
    transactionForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Конвертируем сумму в RUB перед сохранением
        const amountInRub = convertAmountToRub(parseFloat(amountInput.value), currentCurrency);

        const transaction = {
            id: Date.now(),
            amount: amountInRub,
            type: typeInput.value,
            description: descriptionInput.value,
        };
        addTransaction(transaction);
        transactionForm.reset();
        amountInput.blur();
        descriptionInput.blur();
    });

    function addTransaction(transaction) {
        if (transaction.type === 'income') {
            balance += transaction.amount;
        } else {
            balance -= transaction.amount;
        }
        transactions.push(transaction);
        saveToLocalStorage();
        updateBalance();
        renderTransactions();
        updateChart(); // Обновляем диаграмму
    }

    // Функция для обновления баланса
    function updateBalance() {
        const convertedBalance = convertAmount(balance, currentCurrency);
        let balanceText = `${convertedBalance.toFixed(2)} ${currentCurrency}`;

        if (balance === 0) {
            balanceElement.style.color = 'black'; // Черный цвет для нулевого баланса
            balanceText = `0.00 ${currentCurrency}`; // Убираем минус для нулевого баланса
        } else if (balance < 0) {
            balanceElement.style.color = '#e74c3c'; // Красный цвет для отрицательного баланса
        } else {
            balanceElement.style.color = '#2ecc71'; // Зеленый цвет для положительного баланса
        }

        balanceElement.textContent = balanceText;

        // Обновляем гифку в зависимости от баланса
        updateBalanceGif();
    }

    // Функция для обновления гифки
    function updateBalanceGif() {
        if (balance <= 0) {
            balanceGif.src = 'https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExOXk3djk5a2JremRqZzl3Y3pkNjBocGVjbGN4cjhlZngxMTF4M3gxZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/SXrALo0dgR0iw5qvez/giphy.gif';
        } else {
            balanceGif.src = 'https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExcG1nNTRoN3FnYW0wbnY1aXl6am11MWJsd2hmdzQ3ZzM1d3BhamFycCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/H1NI3c1rAZI16lk3ny/giphy.gif';
        }
    }

    // Функция для отображения списка операций
    function renderTransactions() {
        transactionList.innerHTML = '';

        // Добавляем новые транзакции в начало списка
        for (let i = transactions.length - 1; i >= 0; i--) {
            const li = document.createElement('li');
            li.className = transactions[i].type;
            const convertedAmount = convertAmount(transactions[i].amount, currentCurrency);
            li.innerHTML = `
                <span>${transactions[i].description}: ${convertedAmount.toFixed(2)} ${currentCurrency}</span>
                <button onclick="deleteTransaction(${transactions[i].id})">Удалить</button>
            `;
            transactionList.insertBefore(li, transactionList.firstChild);
        }
    }

    // Функция для удаления операции
    window.deleteTransaction = (id) => {
        const transaction = transactions.find((t) => t.id === id);
        if (transaction.type === 'income') {
            balance -= transaction.amount;
        } else {
            balance += transaction.amount;
        }
        transactions = transactions.filter((t) => t.id !== id);
        saveToLocalStorage();
        updateBalance();
        renderTransactions();
        updateChart();
    };

    function saveToLocalStorage() {
        localStorage.setItem('transactions', JSON.stringify(transactions));
        localStorage.setItem('balance', balance);
    }

    function updateChart() {
        const income = transactions
            .filter((t) => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        const expense = transactions
            .filter((t) => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const convertedIncome = convertAmount(income, currentCurrency);
        const convertedExpense = convertAmount(expense, currentCurrency);

        if (budgetChart) {
            budgetChart.data.datasets[0].data = [convertedIncome, convertedExpense];
            budgetChart.update();
        } else {
            createChart(convertedIncome, convertedExpense);
        }
    }

    function createChart(income, expense) {
        budgetChart = new Chart(ctx, {
            type: 'bar', // Тип диаграммы (столбчатая)
            data: {
                labels: ['Доходы', 'Расходы'],
                datasets: [
                    {
                        label: '', // Убираем название "Сумма"
                        data: [income, expense],
                        backgroundColor: ['#2ecc71', '#e74c3c'], // Зеленый для доходов, красный для расходов
                        borderWidth: 1,
                    },
                ],
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                    },
                },
                legend: {
                    display: false, // Скрываем легенду
                },
                tooltips: {
                    enabled: true,
                    mode: 'index',
                    intersect: false,
                },
                hover: {
                    mode: 'nearest',
                    intersect: true
                },
                plugins: {
                    legend: {
                        display: false // Полностью скрываем легенду
                    }
                }
            },
        });
    }

    // Функция для получения курсов валют
    async function fetchExchangeRates() {
        try {
            const response = await fetch('https://api.exchangerate-api.com/v4/latest/RUB');
            const data = await response.json();
            exchangeRates = data.rates;
            console.log('Курсы валют загружены:', exchangeRates);
        } catch (error) {
            console.error('Ошибка при получении курсов валют:', error);
        }
    }

    // Функция для конвертации суммы в RUB
    function convertAmountToRub(amount, currency) {
        if (currency === 'RUB') {
            return amount;
        }
        const rate = exchangeRates[currency];
        return amount * (exchangeRates['RUB'] / rate);
    }

    // Функция для конвертации суммы
    function convertAmount(amount, currency) {
        if (currency === 'RUB') {
            return amount;
        }
        const rate = exchangeRates[currency];
        return (amount / exchangeRates['RUB']) * rate;
    }

    // Обработчик события смены валюты
    document.getElementById('currency').addEventListener('change', async () => {
        currentCurrency = document.getElementById('currency').value;
        if (!exchangeRates[currentCurrency]) {
            await fetchExchangeRates();
        }
        updateBalance();
        renderTransactions();
        updateChart(); // Обновляем диаграмму при смене валюты
    });

    // Загружаем курсы валют при загрузке страницы
    fetchExchangeRates();
});