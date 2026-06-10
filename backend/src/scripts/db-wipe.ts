import prisma from '../config/prisma';
import { DB_WIPE_CONFIRM_PHRASE, wipeApplicationData } from '../lib/databaseOps';

async function main(): Promise<void> {
  const result = await wipeApplicationData(process.env.DB_WIPE_CONFIRM);
  console.log(
    JSON.stringify(
      {
        ok: true,
        message: 'Application data wiped. Default categories re-seeded.',
        tablesTruncated: result.tablesTruncated,
        categoriesSeeded: result.categoriesSeeded,
        note: 'Cloudflare R2 / local upload files are not deleted by this command.'
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      JSON.stringify(
        {
          ok: false,
          error: message,
          hint: `On Render Shell run: DB_WIPE_CONFIRM=${DB_WIPE_CONFIRM_PHRASE} npm run db:wipe:prod`
        },
        null,
        2
      )
    );
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
