// Simple test script to verify Gmail OAuth2 endpoints
const axios = require("axios");

// Configuration - update these values based on your setup
const BASE_URL = "http://localhost:5000/api/v1/company";
let authToken = "";

// Test data
const testCompany = {
  name: "Test Company",
  email: "test@example.com",
  password: "password123",
};

async function testGmailOAuth() {
  try {
    console.log("🧪 Testing Gmail OAuth2 Flow...\n");

    // Step 1: Register and login to get auth token
    console.log("1️⃣ Registering company...");
    await axios.post(`${BASE_URL}/register`, testCompany);
    console.log("✅ Company registered");

    console.log("2️⃣ Logging in...");
    const loginResponse = await axios.post(`${BASE_URL}/login`, {
      email: testCompany.email,
      password: testCompany.password,
    });
    authToken = loginResponse.data.token;
    console.log("✅ Logged in successfully");

    // Step 2: Check Gmail status (should be disconnected)
    console.log("3️⃣ Checking Gmail status...");
    const statusResponse = await axios.get(`${BASE_URL}/gmail-status`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    console.log("Gmail Status:", statusResponse.data);

    // Step 3: Initiate Gmail OAuth setup
    console.log("4️⃣ Initiating Gmail OAuth setup...");
    const setupResponse = await axios.post(
      `${BASE_URL}/setup-gmail`,
      {},
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );
    console.log("Auth URL generated:", setupResponse.data.authUrl);
    console.log("\n📋 Manual Testing Required:");
    console.log("1. Visit the auth URL above in your browser");
    console.log("2. Complete the Google OAuth flow");
    console.log("3. Check if the callback updates the company record");
    console.log("4. Run this script again to verify the connection");

    // Step 4: Test disconnect (if already connected)
    if (statusResponse.data.isConnected) {
      console.log("5️⃣ Testing Gmail disconnect...");
      await axios.post(
        `${BASE_URL}/disconnect-gmail`,
        {},
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      console.log("✅ Gmail disconnected successfully");
    }

    console.log("\n🎉 Gmail OAuth2 flow test completed!");
    console.log("\n📝 Next Steps:");
    console.log("1. Ensure you have the required environment variables:");
    console.log("   - GMAIL_CLIENT_ID");
    console.log("   - GMAIL_CLIENT_SECRET");
    console.log("   - GMAIL_REDIRECT_URI");
    console.log("2. Set up your Google Cloud Console OAuth2 credentials");
    console.log("3. Add the redirect URI to your Google OAuth app settings");
  } catch (error) {
    console.error("❌ Test failed:", error.response?.data || error.message);
  }
}

// Run the test
testGmailOAuth();
