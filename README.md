# SRE Dashboard

Application health & change deployment dashboard. FastAPI + SQLite backend, React + Ant Design frontend.

## Run the backend

```
cd backend
venv\Scripts\python -m uvicorn app.main:app --reload --port 8001
```



First time only (creates the DB, seeds teams/applications, and generates + ingests ~30 days of mock data):

```
cd backend
venv\Scripts\python -m scripts.generate_mock_data
```

To reset and regenerate mock data later, delete `backend/data/sre_dashboard.db` and re-run the command above.

## Run the frontend

```
cd frontend
npm run dev
```

Open the printed local URL (e.g. `http://localhost:5173`). The Vite dev server proxies `/api` to the backend on port 8001 (see `frontend/vite.config.ts` if you change the backend port).

## Project layout

- `backend/app` — FastAPI app: models, schemas, API routes, services (Excel templates/ingestion, health scoring, analytics aggregation)
- `backend/scripts` — `init_db.py`, `seed_master_data.py`, `generate_mock_data.py`
- `backend/data` — SQLite DB file and generated mock Excel workbooks
- `frontend/src` — pages, components, API hooks, theme/colors, types

## Notes

- Medal Category values in master data are demo placeholders — replace with real values in `backend/scripts/seed_master_data.py` before real use.
- Uploads are idempotent (upsert by key), so re-uploading a corrected file for the same day/CR just updates the existing records.
