import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Table } from '../models/Table.js';
import { MenuItem } from '../models/MenuItem.js';
import { generateTableQRCode } from '../services/index.js';

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('✅ Connected to MongoDB');

        await Promise.all([User.deleteMany({}), Table.deleteMany({}), MenuItem.deleteMany({})]);
        console.log('🗑️ Cleared existing data');

        // Legacy Users
        await User.create({ email: 'admin@servex.com', password: 'admin123', name: 'Admin User (Legacy)', role: 'admin' });
        await User.create({ email: 'kitchen@servex.com', password: 'kitchen123', name: 'Kitchen Staff (Legacy)', role: 'kitchen' });

        // New Side Walk Users
        await User.create({ email: 'admin@sidewalk.com', password: 'admin123', name: 'Side Walk Admin', role: 'admin' });
        console.log('👤 Created admin user: admin@sidewalk.com');

        await User.create({ email: 'kitchen@sidewalk.com', password: 'kitchen123', name: 'Side Walk Kitchen', role: 'kitchen' });
        console.log('👨‍🍳 Created kitchen user: kitchen@sidewalk.com');

        for (let i = 1; i <= 8; i++) {
            const table = await Table.create({ tableNumber: i, capacity: i <= 4 ? 2 : 4, qrCodeUrl: '', qrCodeData: '' });
            const { url, data } = await generateTableQRCode(table._id.toString());
            table.qrCodeUrl = url;
            table.qrCodeData = data;
            await table.save();
        }
        console.log('🪑 Created 8 tables with QR codes');

        const menuItems = [
            // ☕ Espresso Classics (from 2.jpg)
            { name: 'Espresso', description: 'Concentrated 54ml shot with thick flavoured crema', category: 'Hot Coffee', price: 140, imageUrl: '', tags: ['veg'], preparationTime: 5 },
            { name: 'Americano', description: 'Warm water over espresso | black coffee', category: 'Hot Coffee', price: 160, imageUrl: '', tags: ['veg'], preparationTime: 5 },
            { name: 'Lungo', description: 'Longer espresso made with more water', category: 'Hot Coffee', price: 160, imageUrl: '', tags: ['veg'], preparationTime: 5 },
            { name: 'Cappuccino', description: 'Equal parts of espresso, milk and foam', category: 'Hot Coffee', price: 190, imageUrl: '', tags: ['special', 'veg'], preparationTime: 7 },
            { name: 'Latte', description: 'Espresso with steamed milk & topped with microfoam', category: 'Hot Coffee', price: 200, imageUrl: '', tags: ['veg'], preparationTime: 7 },
            { name: 'Macchiato', description: 'Espresso marked with a small amount of milk foam', category: 'Hot Coffee', price: 180, imageUrl: '', tags: ['veg'], preparationTime: 6 },
            { name: 'Flat White', description: 'Espresso with steamed milk & topped with thin microfoam', category: 'Hot Coffee', price: 200, imageUrl: '', tags: ['veg'], preparationTime: 7 },
            { name: 'Cortado', description: '54ml espresso + 54ml steamed milk | Our favourite coffee', category: 'Hot Coffee', price: 180, imageUrl: '', tags: ['special', 'veg'], preparationTime: 6 },
            { name: 'Mocha', description: 'Espresso with steamed milk and blend of rich chocolate', category: 'Hot Coffee', price: 240, imageUrl: '', tags: ['veg'], preparationTime: 8 },
            { name: 'Affogato', description: 'Espresso over vanilla ice cream', category: 'Hot Coffee', price: 210, imageUrl: '', tags: ['veg'], preparationTime: 5 },
            { name: 'Cafe Bombon', description: 'Espresso over condensed milk, topped with foam', category: 'Hot Coffee', price: 200, imageUrl: '', tags: ['veg'], preparationTime: 6 },
            { name: 'Espresso Tonic', description: 'Espresso with Tonic Water / Ginger Ale', category: 'Cold Coffee', price: 240, imageUrl: '', tags: ['veg'], preparationTime: 5 },

            // 🌿 Indian Inspired Series (from 2.jpg)
            { name: 'Cinnamon Spiced Cappuccino', description: 'Made with Indian cinnamon (dalchini)', category: 'Hot Coffee', price: 210, imageUrl: '', tags: ['veg'], preparationTime: 7 },
            { name: 'Honey Cappuccino', description: 'Made with Kiwi Jim Corbett forest honey', category: 'Hot Coffee', price: 210, imageUrl: '', tags: ['veg'], preparationTime: 7 },

            // 🍳 Breakfast Club (from 6.jpg)
            { name: 'Classic Smoothie Bowl', description: 'House mix smoothie (berry or choco peanut butter), fruits, granola, chia seeds', category: 'Breakfast', price: 400, imageUrl: '', tags: ['veg', 'health'], preparationTime: 10 },
            { name: 'Matcha Smoothie Bowl', description: 'Matcha smoothie, coconut shavings, nut butter, dates', category: 'Breakfast', price: 460, imageUrl: '', tags: ['veg', 'health'], preparationTime: 10 },
            { name: 'Barista\'s Toast', description: 'Honey butter toast dipped in espresso, brown butter, topped with ice cream', category: 'Breakfast', price: 280, imageUrl: '', tags: ['veg', 'special'], preparationTime: 10 },
            { name: 'Mushroom & Cheese Baked Eggs', description: 'Creamy wild mushrooms, cheese, crispy garlic, parsley', category: 'Breakfast', price: 330, imageUrl: '', tags: ['egg'], preparationTime: 15 },
            { name: 'Spicy Spanish Skillet Eggs', description: 'Shakshuka style poached eggs with simmering tomatoes', category: 'Breakfast', price: 280, imageUrl: '', tags: ['egg', 'spicy'], preparationTime: 15 },
            { name: 'Classic Pancakes', description: 'Fresh fruits, whipped cream, maple syrup', category: 'Breakfast', price: 220, imageUrl: '', tags: ['egg'], preparationTime: 12 },
            { name: 'Chuck Berry Pancakes', description: 'Blueberry compote, whipped cream, maple syrup', category: 'Breakfast', price: 250, imageUrl: '', tags: ['egg'], preparationTime: 12 },
            { name: 'Notella Pancakes', description: 'Hazelnut spread, whipped cream, maple syrup', category: 'Breakfast', price: 280, imageUrl: '', tags: ['egg', 'special'], preparationTime: 12 },
            { name: 'Eggs Benedict', description: 'Soft poached eggs, hollandaise, creamy mushrooms on buttered bun', category: 'Breakfast', price: 300, imageUrl: '', tags: ['egg'], preparationTime: 15 },
            { name: 'Vegan Brekkie Burrito', description: 'Wholewheat tortilla, avocado guacamole, tofu scramble', category: 'Breakfast', price: 370, imageUrl: '', tags: ['veg'], preparationTime: 12 },

            // 🥗 Salads & Soups (from 9.jpg)
            { name: 'Caesar Salad', description: 'Traditional salad with croutons, parmesan cheese', category: 'Salads & Soups', price: 300, imageUrl: '', tags: ['veg'], preparationTime: 10 },
            { name: 'Hi Protein Vegetarian Salad', description: 'Chickpea, falafel, whole wheat, cottage cheese, lemon dressing', category: 'Salads & Soups', price: 360, imageUrl: '', tags: ['veg', 'special'], preparationTime: 10 },
            { name: 'South West Chicken Salad', description: 'Cilantro lime marinated chicken breast with avocado dressing', category: 'Salads & Soups', price: 440, imageUrl: '', tags: ['nonveg'], preparationTime: 12 },
            { name: 'Tangy Tomato & Bell Pepper Soup', description: 'Served with Garlic Bread', category: 'Salads & Soups', price: 250, imageUrl: '', tags: ['veg'], preparationTime: 10 },
            { name: 'Mushroom Cappuccino', description: 'Rich creamy mushroom soup served with foam', category: 'Salads & Soups', price: 250, imageUrl: '', tags: ['veg'], preparationTime: 10 },
            { name: 'Cream of Chicken Soup', description: 'Classic creamy chicken soup', category: 'Salads & Soups', price: 260, imageUrl: '', tags: ['nonveg'], preparationTime: 10 },

            // 🥪 Sandwiches (from 10.jpg)
            { name: 'Shroom Melt', description: 'Creamy mushrooms, caramelized onions, rocket leaf', category: 'Sandwiches', price: 360, imageUrl: '', tags: ['veg'], preparationTime: 12 },
            { name: 'Cold Pesto Sandwich', description: 'Pesto, cottage cheese, tomato, balsamic glaze (Best in Focaccia)', category: 'Sandwiches', price: 380, imageUrl: '', tags: ['veg'], preparationTime: 10 },
            { name: 'Greek Guy', description: 'Falafel, hummus, grilled zucchini, peppers, tahini', category: 'Sandwiches', price: 320, imageUrl: '', tags: ['veg'], preparationTime: 12 },
            { name: 'Garlic Chicken', description: 'Oven roasted garlic chicken, olives and mozzarella', category: 'Sandwiches', price: 380, imageUrl: '', tags: ['nonveg'], preparationTime: 15 },
            { name: 'Katsu Chicken Sando', description: 'Fried chicken, mustard coleslaw, pickle in Milk Bread', category: 'Sandwiches', price: 380, imageUrl: '', tags: ['nonveg', 'special'], preparationTime: 15 },
            { name: 'Mediterranean Chicken Shawarma', description: 'Smoked chicken, hummus, tahini, pickled veggies', category: 'Sandwiches', price: 390, imageUrl: '', tags: ['nonveg'], preparationTime: 15 },

            // 🍝 Pasta (from 12.jpg)
            { name: 'Grandmamas Creamy Alfredo', description: 'Butter, cream, garlic, parmesan, exotic veggies', category: 'Mains', price: 410, imageUrl: '', tags: ['veg'], preparationTime: 15 },
            { name: 'House Fresh Arrabbiata', description: 'Chilli flakes, ripe tomatoes, garlic, parmesan', category: 'Mains', price: 380, imageUrl: '', tags: ['veg', 'spicy'], preparationTime: 15 },
            { name: 'Truffle Mac & Cheese', description: 'Elbow macaroni, butter, cheese, garlic, truffle oil', category: 'Mains', price: 480, imageUrl: '', tags: ['veg', 'special'], preparationTime: 15 },
            { name: 'Spaghetti In Mushroom Florentine', description: 'Savoury and creamy spaghetti with mushroom melt sauce', category: 'Mains', price: 430, imageUrl: '', tags: ['veg'], preparationTime: 15 },
            { name: 'Cilantro & Lime Chicken Aglio Olio', description: 'Signature Aglio e Olio with smoked chicken', category: 'Mains', price: 460, imageUrl: '', tags: ['nonveg'], preparationTime: 15 },
            { name: 'Meatballs Spaghetti', description: 'Lamb meatballs, spicy arrabbiata, spaghetti', category: 'Mains', price: 520, imageUrl: '', tags: ['nonveg'], preparationTime: 20 },

            // 🍽️ Full Plates (from 13.jpg)
            { name: 'Sidewalk Signature Veg Full Plate', description: 'Cottage cheese steak, herbed rice, masked potato, exotic vegetables', category: 'Mains', price: 450, imageUrl: '', tags: ['veg', 'special'], preparationTime: 20 },
            { name: 'Parmigiana Chicken', description: 'Breaded boneless chicken breast with pomodoro and mozzarella', category: 'Mains', price: 530, imageUrl: '', tags: ['nonveg'], preparationTime: 20 },
            { name: 'Cashewnut Chicken', description: 'Juicy chicken, creamy cashewnut sauce, mashed potato', category: 'Mains', price: 510, imageUrl: '', tags: ['nonveg'], preparationTime: 20 },
            { name: 'Veggie Burrito Bowl', description: 'Cottage cheese, herbed rice, avocado, tortilla chips, beans', category: 'Mains', price: 440, imageUrl: '', tags: ['veg', 'special'], preparationTime: 15 },
            { name: 'Pesto Cottage Cheese Bowl', description: 'Basil pesto marinated cottage cheese, herbed rice', category: 'Mains', price: 410, imageUrl: '', tags: ['veg'], preparationTime: 15 },
        ];

        await MenuItem.insertMany(menuItems);
        console.log(`☕ Created ${menuItems.length} coffee cafe menu items with photos`);

        console.log(`
✅ Seed completed successfully!
================================
☕ Side Walk
================================
Admin: admin@sidewalk.com / admin123
Kitchen: kitchen@sidewalk.com / kitchen123
Tables: 1-8 created with QR codes
Menu: ${menuItems.length} items with images
================================`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Seed error:', error);
        process.exit(1);
    }
};

seedData();
