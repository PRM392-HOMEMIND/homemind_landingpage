import { defineConfig }from '@playwright/test';
export default defineConfig({testDir:'./tests/admin',testMatch:'iap-browser.spec.ts',workers:1,retries:0,timeout:60000,reporter:'list',
 use:{baseURL:'http://127.0.0.1:34301',channel:'chrome',trace:'off',screenshot:'off',video:'off'},
 webServer:{command:'node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 34301 --webpack',url:'http://127.0.0.1:34301/healthz',reuseExistingServer:false,timeout:120000}});
