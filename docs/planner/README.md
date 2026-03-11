# Planner sheets (local clone)

Source sheet: https://docs.google.com/spreadsheets/d/1zTfFe3_FkMBj4m9auSRtO72GZWd44TnUzJJgVDgkC90

Raw exports (one CSV per tab):
- config -> google-sheets/config.csv
- r&d -> google-sheets/r_d.csv
- websites -> google-sheets/websites.csv
- kwr_files -> google-sheets/kwr_files.csv
- kwr_tools -> google-sheets/kwr_tools.csv
- tools_planner -> google-sheets/tools_planner.csv

Working copy (current to repo):
- tools_planner.csv (generated locally from repo state)
- Dedicated lander tools should be tracked as their own rows in `tools_planner.csv`, even when they sit on top of a shared engine. Example: `download-loom-videos` should exist separately from the generic `video-downloader`.
- Downloader landers should default to `download-*` slug syntax. Example: `download-loom-videos`.
- Keyword-led downloader landers can be registry-backed and served by the shared downloader route; they still need their own planner rows in `tools_planner.csv`.
