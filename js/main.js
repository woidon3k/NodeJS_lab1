const burgerBtn = document.getElementById('burger-btn');
const navMenu = document.getElementById('nav-menu');

burgerBtn.addEventListener('click', () => {
    navMenu.classList.toggle('open');
});

const productsMock = [
    { id: '101', name: 'Молоко Яготинське 2.6%', category: 'Молочні продукти', price: 42.50, stock: 24, daysToExpire: 14 },
    { id: '102', name: 'Хліб Білий Нарізний', category: 'Хлібобулочні', price: 24.00, stock: 5, daysToExpire: 2 }, 
    { id: '103', name: 'Сир Гауда', category: 'Молочні продукти', price: 320.00, stock: 0, daysToExpire: 30 }, 
    { id: '104', name: 'Йогурт Чудо', category: 'Молочні продукти', price: 35.00, stock: 12, daysToExpire: -1 }, 
    { id: '105', name: 'Ковбаса Лікарська', category: 'М\'ясні вироби', price: 250.00, stock: 8, daysToExpire: 4 },
    { id: '106', name: 'Пиво Світле 18+', category: 'Алкоголь', price: 45.00, stock: 150, daysToExpire: 180 }
];

function renderCatalog(products) {
    const grid = document.getElementById('catalog-grid');
    grid.innerHTML = ''; 

    products.forEach(product => {
        let badgeClass = 'success';
        let statusText = 'В нормі';

        if (product.daysToExpire < 0) {
            badgeClass = 'danger';
            statusText = 'Прострочено';
        } else if (product.daysToExpire <= 3 || product.stock <= 5) {
            badgeClass = 'warning';
            statusText = 'Увага (Мало/Термін)';
        }

        if (product.stock === 0) {
            badgeClass = 'danger';
            statusText = 'Немає на складі';
        }

        const cardHTML = `
            <article class="card">
                <div class="card-header">
                    <h3>${product.name}</h3>
                    <span class="badge ${badgeClass}">${statusText}</span>
                </div>
                <div class="card-body">
                    <p><strong>Категорія:</strong> ${product.category}</p>
                    <p><strong>Ціна:</strong> ${product.price.toFixed(2)} грн</p>
                    <p><strong>Залишок:</strong> ${product.stock} шт.</p>
                    <p><strong>Придатність:</strong> ${product.daysToExpire >= 0 ? product.daysToExpire + ' днів' : 'Вичерпано!'}</p>
                </div>
                <div class="card-footer">
                    <button class="btn btn-primary" ${product.stock === 0 ? 'disabled' : ''}>
                        Редагувати
                    </button>
                </div>
            </article>
        `;
        
        grid.insertAdjacentHTML('beforeend', cardHTML);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    renderCatalog(productsMock);
});