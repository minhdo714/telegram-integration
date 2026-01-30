// Mock database for development
let accounts = [
    {
        id: '1',
        userId: 'user1',
        phoneNumber: '+1-555-123-4567',
        telegramUsername: 'johndoe',
        telegramUserId: '123456789',
        firstName: 'John',
        lastName: 'Doe',
        sessionFilePath: '/users/user1/sessions/123456789.session',
        sessionCreatedAt: new Date('2024-01-20T10:00:00Z'),
        sessionLastValidated: new Date(),
        sessionStatus: 'active',
        integrationMethod: 'qr_code',
        integratedAt: new Date('2024-01-20T10:00:00Z'),
        accountOwnership: 'user_owned',
        isExistingAccount: true,
        proxyId: 'proxy1',
        proxyTimeSlot: 2,
        status: 'active',
        dailyDmQuota: 200,
        dailyDmSentToday: 147,
        lastActive: new Date(),
        createdAt: new Date('2024-01-20T10:00:00Z'),
        updatedAt: new Date()
    }
];

let jobs = {};

export const db = {
    // Accounts
    async getAccounts(userId = 'user1') {
        return accounts.filter(acc => acc.userId === userId);
    },

    async getAccount(accountId) {
        return accounts.find(acc => acc.id === accountId);
    },

    async createAccount(accountData) {
        const newAccount = {
            id: String(Date.now()),
            userId: 'user1',
            sessionLastValidated: new Date(),
            sessionStatus: 'active',
            status: 'active',
            dailyDmQuota: 200,
            dailyDmSentToday: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...accountData,
        };
        accounts.push(newAccount);
        return newAccount;
    },

    async updateAccount(accountId, updates) {
        const index = accounts.findIndex(acc => acc.id === accountId);
        if (index !== -1) {
            accounts[index] = {
                ...accounts[index],
                ...updates,
                updatedAt: new Date(),
            };
            return accounts[index];
        }
        return null;
    },

    async deleteAccount(accountId) {
        const index = accounts.findIndex(acc => acc.id === accountId);
        if (index !== -1) {
            accounts.splice(index, 1);
            return true;
        }
        return false;
    },

    // Jobs (for QR/SMS login flows)
    async createJob(jobData) {
        const jobId = String(Date.now());
        jobs[jobId] = {
            id: jobId,
            createdAt: new Date(),
            ...jobData,
        };
        return jobs[jobId];
    },

    async getJob(jobId) {
        return jobs[jobId];
    },

    async updateJob(jobId, updates) {
        if (jobs[jobId]) {
            jobs[jobId] = {
                ...jobs[jobId],
                ...updates,
                updatedAt: new Date(),
            };
            return jobs[jobId];
        }
        return null;
    },

    // Session Events
    sessionEvents: [],

    async logSessionEvent(accountId, eventType, details) {
        const event = {
            id: String(Date.now()),
            telegramAccountId: accountId,
            eventType,
            eventTimestamp: new Date(),
            details,
            triggeredBy: 'system',
        };
        this.sessionEvents.push(event);
        return event;
    },
};
