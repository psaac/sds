import { eq } from 'drizzle-orm';
import { db } from './db';
import { app_settings_table, type AppSetting } from './schema';

export function addAppSetting(key: string, value: any): AppSetting[] {
	return db
		.insert(app_settings_table)
		.values({ key, value_json: JSON.stringify(value) })
		.returning()
		.all();
}

export function getAppSetting(key: string): AppSetting | undefined {
	const settings = db
		.select()
		.from(app_settings_table)
		.where(eq(app_settings_table.key, key))
		.all();
	return settings[0];
}

export function getAllAppSettings(): AppSetting[] {
	return db.select().from(app_settings_table).all();
}

export function updateAppSetting(key: string, value: any) {
	db.update(app_settings_table)
		.set({ value_json: JSON.stringify(value) })
		.where(eq(app_settings_table.key, key))
		.run();
}
