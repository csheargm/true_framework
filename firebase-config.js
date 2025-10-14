// Firebase Configuration for TRUE Framework
// This file handles Firebase integration for cloud persistence

class FirebaseStorage {
    constructor() {
        this.initialized = false;
        this.db = null;
        this.config = null;
        this.syncEnabled = false;
        this.lastSyncTime = null;
        this.syncInterval = null;
    }

    // Initialize Firebase with user's configuration
    async initialize(config) {
        if (this.initialized) return true;

        try {
            // Dynamically load Firebase SDK
            if (!window.firebase) {
                await this.loadFirebaseSDK();
            }

            // Initialize Firebase
            if (!firebase.apps.length) {
                firebase.initializeApp(config);
            }

            this.db = firebase.database();
            this.config = config;
            this.initialized = true;
            
            console.log('Firebase initialized successfully');
            return true;
        } catch (error) {
            console.error('Firebase initialization error:', error);
            return false;
        }
    }

    // Load Firebase SDK dynamically
    async loadFirebaseSDK() {
        return new Promise((resolve, reject) => {
            // Check if already loading or loaded
            if (window.firebase) {
                resolve();
                return;
            }

            // Create script elements for Firebase
            const scripts = [
                'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js',
                'https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js'
            ];

            let loadedCount = 0;
            scripts.forEach(src => {
                const script = document.createElement('script');
                script.src = src;
                script.async = true;
                script.onload = () => {
                    loadedCount++;
                    if (loadedCount === scripts.length) {
                        resolve();
                    }
                };
                script.onerror = reject;
                document.head.appendChild(script);
            });
        });
    }

    // Save evaluations to Firebase
    async saveEvaluations(evaluations) {
        if (!this.initialized || !this.syncEnabled) return false;

        try {
            // Add metadata
            const data = {
                evaluations: evaluations,
                lastUpdated: Date.now(),
                version: '1.0',
                totalCount: evaluations.length
            };

            // Save to Firebase
            await this.db.ref('true_framework_evaluations').set(data);
            this.lastSyncTime = Date.now();
            
            console.log(`Saved ${evaluations.length} evaluations to Firebase`);
            return true;
        } catch (error) {
            console.error('Error saving to Firebase:', error);
            return false;
        }
    }

    // Load evaluations from Firebase
    async loadEvaluations() {
        if (!this.initialized) return null;

        try {
            const snapshot = await this.db.ref('true_framework_evaluations').once('value');
            const data = snapshot.val();
            
            if (data && data.evaluations) {
                console.log(`Loaded ${data.evaluations.length} evaluations from Firebase`);
                this.lastSyncTime = Date.now();
                return data.evaluations;
            }
            
            return null;
        } catch (error) {
            console.error('Error loading from Firebase:', error);
            return null;
        }
    }

    // Enable real-time sync
    enableSync(callback) {
        if (!this.initialized) return;

        this.syncEnabled = true;
        
        // Listen for changes
        this.db.ref('true_framework_evaluations').on('value', (snapshot) => {
            const data = snapshot.val();
            if (data && data.evaluations && callback) {
                callback(data.evaluations);
            }
        });

        console.log('Firebase real-time sync enabled');
    }

    // Disable real-time sync
    disableSync() {
        if (!this.initialized) return;

        this.syncEnabled = false;
        this.db.ref('true_framework_evaluations').off();
        
        console.log('Firebase real-time sync disabled');
    }

    // Check connection status
    async checkConnection() {
        if (!this.initialized) return false;

        try {
            await this.db.ref('.info/connected').once('value');
            return true;
        } catch (error) {
            return false;
        }
    }

    // Get sync status
    getSyncStatus() {
        return {
            initialized: this.initialized,
            syncEnabled: this.syncEnabled,
            lastSyncTime: this.lastSyncTime,
            connected: this.initialized ? true : false
        };
    }

    // Clear all data from Firebase (use with caution!)
    async clearAllData() {
        if (!this.initialized) return false;

        try {
            await this.db.ref('true_framework_evaluations').remove();
            console.log('All Firebase data cleared');
            return true;
        } catch (error) {
            console.error('Error clearing Firebase data:', error);
            return false;
        }
    }

    // Export configuration template
    static getConfigTemplate() {
        return {
            apiKey: "your-api-key",
            authDomain: "your-project.firebaseapp.com",
            databaseURL: "https://your-project-default-rtdb.firebaseio.com",
            projectId: "your-project-id",
            storageBucket: "your-project.appspot.com",
            messagingSenderId: "your-sender-id",
            appId: "your-app-id"
        };
    }

    // Validate configuration
    static validateConfig(config) {
        const required = ['apiKey', 'authDomain', 'databaseURL', 'projectId'];
        return required.every(key => config[key] && config[key] !== '' && !config[key].includes('your-'));
    }
}

// Create global instance
window.firebaseStorage = new FirebaseStorage();