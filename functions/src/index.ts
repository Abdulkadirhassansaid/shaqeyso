import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {initializeApp} from "firebase-admin/app";

// Initialize the Firebase Admin SDK.
initializeApp();

/**
 * A simple "Hello World" HTTP function that you can visit in your browser.
 */
export const helloWorld = onRequest((request, response) => {
  logger.info("Hello world logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});
