const { Client } = require('pg');

async function main() {
  // Connect to the 'postgres' default database to create the new one
  const client = new Client({
    host: 'localhost',
    user: 'adam', // Assuming this is the user from the error
    database: 'postgres',
  });

  try {
    await client.connect();
    console.log('Connected to postgres default database');
    await client.query('CREATE DATABASE vantage');
    console.log('Database "vantage" created successfully');
  } catch (err) {
    if (err.code === '42P04') {
      console.log('Database "vantage" already exists');
    } else {
      console.error('Error creating database:', err);
    }
  } finally {
    await client.end();
  }
}

main();
