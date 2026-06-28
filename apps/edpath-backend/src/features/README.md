# Features (`features/`)

HTTP feature slices following route → middleware → service separation.

| Feature | Folder | Endpoints |
|---------|--------|-----------|
| PDF upload | `upload/` | `POST /upload` — extract, clean, validate; returns metadata only. |
| Start lesson | `start/` | `POST /start` — upload + seed a LangGraph thread in one call. |

See each subfolder's README for pipeline detail.
