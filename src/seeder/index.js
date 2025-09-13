const connectDB = require('../db/dbConnection');
require('dotenv').config()
const adminSeeder = require('./admin.seeder');
const currencySeeder = require('./currency.seeder');

const seeder = async () => {
    try {
        await connectDB(); // Db connect.
        console.log('✅ Seeding database...');

        await adminSeeder(); // Admin seeder.
        await currencySeeder(); // Currency seeder.

        console.log('✅ All seeder run successfully...');
        process.exit(0);
    } catch (error) {
        console.log('❌ Seeder error: ', error);
        process.exit(1);
    }
}

module.exports = seeder; // Seeder calling...
