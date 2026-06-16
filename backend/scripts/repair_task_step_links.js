const db = require('../config/database');
const { repairProjectTaskSteps } = require('../utils/repairTaskSteps');

async function run() {
    try {
        console.log('Repairing orphaned task step_id links...');

        const [projects] = await db.execute('SELECT id, name FROM projects');
        let total = 0;

        for (const project of projects) {
            const count = await repairProjectTaskSteps(project.id);
            if (count > 0) {
                console.log(`✓ Project #${project.id} (${project.name}): ${count} task(s) repaired`);
                total += count;
            }
        }

        console.log(`\n✅ Done. ${total} task(s) re-linked to project_steps.`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Repair failed:', error.message);
        process.exit(1);
    }
}

run();
