
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

async function testCreateCompany() {
  const API_URL = 'http://localhost:5000/api';

  try {
    // 1. Login as admin
    console.log('Logging in as ranu@gmail.com...');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'ranu@gmail.com',
        password: 'password123'
      })
    });

    const loginData: any = await loginRes.json();
    if (!loginRes.ok) {
      console.error('Login failed:', loginData);
      return;
    }

    const token = loginData.token;
    console.log('Login successful. Token:', token.substring(0, 20) + '...');

    // 2. Try to create a company
    console.log('Creating company...');
    const companyRes = await fetch(`${API_URL}/companies`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({
        name: 'Test Company ' + Date.now(),
        description: 'Test Description',
        email: 'test' + Date.now() + '@gmail.com', // Must be @gmail.com for some reason?
        tenantCount: 5
      })
    });

    const companyData: any = await companyRes.json();
    if (!companyRes.ok) {
      console.error('Company creation failed:', companyRes.status, companyData);
    } else {
      console.log('Company created successfully:', companyData);
    }
  } catch (err: any) {
    console.error('Error during test:', err.message);
  }
}

testCreateCompany();
