/**
 * Created by Patrik Forsberg <patrik.forsberg@coldmind.com>
 * File Date: 2020-04-07 18:54
 */

export class LocalMemStore {
	private data = new Map<any, any>();

	constructor(private useRedis: boolean = false) {
		if (useRedis) {
			const Redis = require('ioredis');
			// create memStore instance :O
			const config = require('./config.json');
			const memStore = new Redis(config.memStore.host, {
				password: config.memStore.password
			});
		}
	}

	public get(key: any): Promise<any> {
		return new Promise((resolve, reject) => {
			const res = this.data.get(key);
			resolve(res);
		});
	}

	public set(key: any, value: any) {
		this.data.set(key, value);
	}
}
