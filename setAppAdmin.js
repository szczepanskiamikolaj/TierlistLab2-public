const admin = require('firebase-admin');

const serviceAccount = require('./tierlistlab2-firebase-adminsdk-fc69x-49a03034d8.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const uid = 'Q2cSpCdkmkV3b4jeVCxT9Y8dY8o2';

async function setAppAdmin() {
  try {
    await admin.auth().setCustomUserClaims(uid, { appAdmin: true });
    console.log(`Custom claim "appAdmin" set for user ${uid}`);
  } catch (error) {
    console.error('Error setting custom claim:', error);
  }
}

setAppAdmin();
