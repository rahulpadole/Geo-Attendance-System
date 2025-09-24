// Admin Initialization Script
// This file helps create the first admin user in the system

import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export const createFirstAdmin = async (email, password, name) => {
  try {
    // Create admin user with Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Create admin document in Firestore
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      email: email,
      role: 'admin',
      name: name,
      employeeId: 'ADMIN001',
      createdAt: new Date().toISOString(),
      isActive: true
    });
    
    console.log('Admin user created successfully!');
    return userCredential.user;
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
};

// Instructions to create first admin:
// 1. Open browser console on the login page
// 2. Run: window.createFirstAdmin('admin@company.com', 'password123', 'Admin User')
// 3. Replace with your desired admin credentials

// Make it available globally for console access
if (typeof window !== 'undefined') {
  window.createFirstAdmin = createFirstAdmin;
}