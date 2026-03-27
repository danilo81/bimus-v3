SELECT 'Projects' as source, count(*) FROM "Project" WHERE "startDate" >= '2026-03-25' AND "status" IN ('activo', 'construccion');
SELECT 'Tasks' as source, count(*) FROM "Task" WHERE "status" != 'completado' AND "dueDate" >= '2026-03-25';
SELECT 'CalendarEvents' as source, count(*) FROM "CalendarEvent" WHERE "date" >= '2026-03-25';

SELECT 'Project Details' as source, id, title, "startDate" FROM "Project" WHERE "startDate" >= '2026-03-25' AND "status" IN ('activo', 'construccion');
SELECT 'Task Details' as source, id, title, "dueDate" FROM "Task" WHERE "status" != 'completado' AND "dueDate" >= '2026-03-25';
SELECT 'CalendarEvent Details' as source, id, title, date FROM "CalendarEvent" WHERE "date" >= '2026-03-25';
