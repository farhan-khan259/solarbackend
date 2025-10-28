const cron = require('node-cron');
const Plan = require('../models/plain');
const { distributePlanExpireCommission } = require('./commissionLogic');

// Run every hour to check for plans that need commission distribution
const commissionCron = cron.schedule('0 * * * *', async () => {
    try {
        console.log('Checking for plans eligible for commission distribution...');

        const eligiblePlans = await Plan.findPlansForCommissionDistribution();
        console.log(`Found ${eligiblePlans.length} plans eligible for commission distribution`);

        let processedCount = 0;
        let errorCount = 0;

        for (const plan of eligiblePlans) {
            try {
                await distributePlanExpireCommission(plan._id);
                processedCount++;
                console.log(`Successfully processed commissions for plan: ${plan._id}`);
            } catch (error) {
                errorCount++;
                console.error(`Error processing commissions for plan ${plan._id}:`, error.message);
            }
        }

        console.log(`Commission distribution completed: ${processedCount} processed, ${errorCount} errors`);
    } catch (error) {
        console.error('Error in commission cron job:', error);
    }
});

// Start the cron job
commissionCron.start();

module.exports = commissionCron;