// src/utils/dummyData.js
const categories = ['women', 'men', 'kids', 'accessories', 'shoes'];
const brands = ['Nike', 'Adidas', 'Zara', 'H&M', 'Gucci', 'Prada', 'Levi\'s', 'Calvin Klein'];

const generateDummyProducts = (count = 100) => {
    const products = [];
    for (let i = 1; i <= count; i++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        const brand = brands[Math.floor(Math.random() * brands.length)];
        const price = Math.round((20 + Math.random() * 180) * 100) / 100;
        const discount = Math.round((5 + Math.random() * 45) * 10) / 10;
        const discountedPrice = Math.round((price * (1 - discount / 100)) * 100) / 100;

        products.push({
            id: i,
            title: `${brand} ${category} ${i}`,
            description: `Premium ${category} item from ${brand}. High quality material with excellent craftsmanship.`,
            price: price,
            discountPercentage: discount,
            rating: Math.round((3 + Math.random() * 2) * 10) / 10,
            stock: Math.floor(10 + Math.random() * 90),
            brand: brand,
            category: category,
            thumbnail: `https://picsum.photos/seed/${i}/200/200`,
            images: [
                `https://picsum.photos/seed/${i}/400/400`,
                `https://picsum.photos/seed/${i + 1}/400/400`,
                `https://picsum.photos/seed/${i + 2}/400/400`
            ]
        });
    }
    return products;
};

module.exports = {
    generateDummyProducts,
    categories,
    brands
};