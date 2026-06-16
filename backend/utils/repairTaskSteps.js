const db = require('../config/database');

/**
 * Re-link tasks with missing or null step_id to valid project_steps on the same page.
 */
async function repairProjectTaskSteps(projectId, connection = null) {
    const conn = connection || db;

    const [orphans] = await conn.execute(
        `SELECT t.id AS task_id, t.page_id
         FROM tasks t
         JOIN pages p ON t.page_id = p.id
         LEFT JOIN project_steps ps ON t.step_id = ps.id
         WHERE p.project_id = ?
           AND (t.step_id IS NULL OR ps.id IS NULL)
         ORDER BY t.page_id, t.id`,
        [projectId]
    );

    if (orphans.length === 0) return 0;

    const [projectSteps] = await conn.execute(
        `SELECT id, step_number FROM project_steps
         WHERE project_id = ?
         ORDER BY step_number ASC`,
        [projectId]
    );

    if (projectSteps.length === 0) return 0;

    const orphansByPage = {};
    for (const row of orphans) {
        if (!orphansByPage[row.page_id]) orphansByPage[row.page_id] = [];
        orphansByPage[row.page_id].push(row);
    }

    let repaired = 0;

    for (const pageId of Object.keys(orphansByPage)) {
        const pageOrphans = orphansByPage[pageId];

        const [usedOnPage] = await conn.execute(
            `SELECT t.step_id FROM tasks t
             INNER JOIN project_steps ps ON t.step_id = ps.id
             WHERE t.page_id = ?`,
            [pageId]
        );
        const usedIds = new Set(usedOnPage.map((r) => Number(r.step_id)));
        const available = projectSteps.filter((s) => !usedIds.has(Number(s.id)));

        for (let i = 0; i < pageOrphans.length && i < available.length; i++) {
            const targetStepId = available[i].id;
            const taskId = pageOrphans[i].task_id;

            const [conflict] = await conn.execute(
                `SELECT id FROM tasks
                 WHERE page_id = ? AND step_id = ? AND id != ?
                 LIMIT 1`,
                [pageId, targetStepId, taskId]
            );
            if (conflict.length > 0) continue;

            try {
                await conn.execute(
                    'UPDATE tasks SET step_id = ? WHERE id = ?',
                    [targetStepId, taskId]
                );
                repaired++;
            } catch (err) {
                if (err.code !== 'ER_DUP_ENTRY') throw err;
            }
        }
    }

    return repaired;
}

module.exports = { repairProjectTaskSteps };
