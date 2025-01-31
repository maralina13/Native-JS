let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let currentCurrency = 'RUB';
let exchangeRates = {};
let budgetChart;

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

// Функция для создания или обновления диаграммы
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

// Функция для создания диаграммы
function createChart(income, expense) {
    const ctx = document.getElementById('budgetChart').getContext('2d');
    budgetChart = new Chart(ctx, {
        type: 'bar',
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
                    display: false
                }
            }
        },
    });
}

// Обновляем диаграмму при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    updateChart();
});