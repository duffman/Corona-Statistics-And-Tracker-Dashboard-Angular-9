"use strict";
/**
 * Created by Patrik Forsberg <patrik.forsberg@coldmind.com>
 * File Date: 2020-04-07 18:54
 */
Object.defineProperty(exports, "__esModule", { value: true });
class LocalMemStore {
    constructor(useRedis = false) {
        this.useRedis = useRedis;
        this.data = new Map();
        if (useRedis) {
            const Redis = require('ioredis');
            // create memStore instance :O
            const config = require('./config.json');
            const memStore = new Redis(config.memStore.host, {
                password: config.memStore.password
            });
        }
    }
    get(key) {
        return new Promise((resolve, reject) => {
            const res = this.data.get(key);
            resolve(res);
        });
    }
    set(key, value) {
        this.data.set(key, value);
    }
}
exports.LocalMemStore = LocalMemStore;
