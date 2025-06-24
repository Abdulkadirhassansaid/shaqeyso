
// This is a sample file. You can delete it if you want.

import { https } from 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';

initializeApp();

export const helloWorld = https.onRequest((request, response) => {
  response.send('Hello from Shaqo Finder in Firebase!');
});
