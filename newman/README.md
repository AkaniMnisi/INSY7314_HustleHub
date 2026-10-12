# Newman execution evidence

Generate a report after the API and disposable database are running:

```bash
npx newman run postman/HustleHub.postman_collection.json --reporters cli,html --reporter-html-export newman/report.html
```

Install an HTML reporter if needed. Commit the real generated report only after verifying the run; do not treat this placeholder as evidence of a successful test run.
