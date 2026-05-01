# Data Sources

This is a source map, not a final permission opinion. Before final submission,
each source should be checked against the hackathon rules, the source's own
terms, and our exact use in the app.

## Highest-Confidence Team USA Sources

These are the strongest candidates because they are official Team USA/USOPC
sources and line up with the hackathon's public Team USA data requirement.

| Source | URL | Best Use | Notes |
| --- | --- | --- | --- |
| Hackathon overview | https://vibecodeforgoldwithgoogle.devpost.com/ | Challenge requirements | Primary source for tracks, judging, and required Gemini/GCP usage. |
| Hackathon rules | https://vibecodeforgoldwithgoogle.devpost.com/rules | Compliance | Primary source for eligibility, data restrictions, judging, and IP constraints. |
| Hackathon FAQ | https://vibecodeforgoldwithgoogle.devpost.com/details/faqs | Compliance | Clarifies GenAI, NIL, public repo, and deployment rules. |
| Hackathon resources | https://vibecodeforgoldwithgoogle.devpost.com/resources | Allowed data categories | Lists official Team USA site, open-source repositories filtered to Team USA, and public weather data. |
| Team USA athletes | https://www.teamusa.com/athletes | Athlete profile source | Use only for internal aggregation; public output should not identify individuals. |
| Team USA Paris 2024 roster | https://www.teamusa.com/paris-2024/roster | 2024 roster view | Useful for roster verification and parity checks. |
| Team USA map | https://www.teamusa.com/map | Hometown geography | Official map-oriented source for athlete hometowns. |
| 2024 U.S. Olympic Team XLSX | https://assets.contentstack.io/v3/assets/blt9e58afd92a18a0fc/bltfbab8d857574a719/672e564b824c1a33908da119/2024_U.S._Olympic_Team_610_Final.xlsx | Olympic roster by sport/state | Official USOPC spreadsheet found from the 2024 Olympic team announcement. |
| 2024 U.S. Paralympic Team XLSX | https://assets.contentstack.io/v3/assets/blt9e58afd92a18a0fc/bltb157d69d46ed67bc/66c3864688b74e0c81b14946/2024_Paralympic_Roster_State_Sport.xlsx | Paralympic roster by sport/state | Official USOPC spreadsheet found from the 2024 Paralympic team announcement. |
| USOPC Olympic collegiate footprint | https://www.usopc.org/team-usa-2024-collegiate-olympic-footprint | College pathway aggregates | Includes raw Google Sheet links and a Tableau view. |
| USOPC Paralympic collegiate footprint | https://www.usopc.org/team-usa-2024-collegiate-paralympic-footprint | College pathway aggregates | Includes raw Google Sheet links and a Tableau view. |
| Olympic collegiate raw Google Sheet | https://docs.google.com/spreadsheets/d/1TWaLCMRl5REToxtywJj-0c76QGeAAifSphICTT9YFBo/edit#gid=0 | Olympic college linkage | Treat as athlete-level input; aggregate before product output. |
| Paralympic collegiate raw Google Sheet | https://docs.google.com/spreadsheets/d/1RzHOuV4ClAfVAM10asbT3ELQ8w_I6lpeSwUniVuSYZ4/edit#gid=0 | Paralympic college linkage | Treat as athlete-level input; aggregate before product output. |
| USOPC Olympic announcement | https://www.usopc.org/news/2024/july/10/u-s-olympic-paralympic-committee-names-594-member-2024-u-s-olympic-team | Roster context | Contains direct XLSX roster link and aggregate statistics. |
| USOPC Paralympic announcement | https://www.usopc.org/news/2024/august/19/united-states-olympic-paralympic-committee-reveals-225-member-2024-u-s-paralympic-team | Roster context | Contains direct XLSX roster link and aggregate statistics. |

## Open Historical Olympic Data

These are useful for archetypes because they include historical age/height/weight
fields, but they are not Team USA-only out of the box. We should ingest only
rows where the country/team is Team USA/United States and drop athlete names
from any public-facing output.

| Source | URL | Best Use | Notes |
| --- | --- | --- | --- |
| TidyTuesday Olympics CSV | https://raw.githubusercontent.com/rfordatascience/tidytuesday/main/data/2021/2021-07-27/olympics.csv | Historical Olympic archetypes | Has age, height, weight, sport, event, medal. Filter to United States only. |
| TidyTuesday Olympics README | https://github.com/rfordatascience/tidytuesday/tree/main/data/2021/2021-07-27 | Schema and provenance | Notes data originated from Kaggle/Sports-Reference scrape. |
| Kaggle 120 years of Olympic history | https://www.kaggle.com/datasets/heesoo37/120-years-of-olympic-history-athletes-and-results | Original historical source | Verify Kaggle terms/license before bundling or redistributing. |
| Zenodo mirror of athlete_events.csv | https://zenodo.org/records/11449966 | Download fallback | Same broad dataset family; still requires Team USA filtering and license check. |

## Geography, Climate, And Public Context

These sources are not athlete NIL and are valuable for the Hometown Success
Engine or regional-context features.

| Source | URL | Best Use | Notes |
| --- | --- | --- | --- |
| U.S. Census geocoder | https://geocoding.geo.census.gov/geocoder/ | City/state geocoding | Convert hometown strings into coordinates or Census geographies. |
| Census population estimates | https://www.census.gov/programs-surveys/popest.html | Per-capita normalization | Useful for "athletes per million residents" style metrics. |
| Census TIGER/Line shapefiles | https://www.census.gov/geographies/mapping-files/time-series/geo/tiger-line-file.html | Boundaries | Use for maps and joins. |
| Census 2024 Team USA hometown article | https://www.census.gov/library/stories/2024/07/2024-olympic-team.html | Reference methodology | Good model for per-capita analysis; Olympic-only. |
| NOAA Climate Data Online | https://www.ncei.noaa.gov/cdo-web/ | Weather/climate | Hackathon resources explicitly mention public weather data such as NOAA. |
| NOAA climate normals | https://www.ncei.noaa.gov/products/land-based-station/us-climate-normals | Regional climate features | Use aggregated normals, not event-day performance conditions. |
| National Weather Service API | https://www.weather.gov/documentation/services-web-api | Current/forecast weather | Less useful for historical analysis, useful for live hometown context. |
| USGS elevation services | https://apps.nationalmap.gov/epqs/ | Elevation | Hometown altitude features. |
| USGS National Map | https://www.usgs.gov/programs/national-geospatial-program/national-map | Terrain/geography | Optional richer geography context. |

## Paralympic Classification References

For an archetype agent, classification should be explained as an educational
taxonomy, not inferred as a user's eligibility or medical condition.

| Source | URL | Best Use | Notes |
| --- | --- | --- | --- |
| International Paralympic Committee classification overview | https://www.paralympic.org/classification | Educational reference | Avoid IPC branding/IP in UI; use as a reference for concepts. |
| Team USA Paralympic sport pages | https://www.teamusa.com/ | Sport-specific context | Prefer Team USA pages when available. |
| U.S. Para sport/NGB pages | See `data/source-manifest.yml` | Sport-specific context | Use cautiously; terms vary by site. |

## Sources To Avoid Or Treat As High Risk

- Athlete photos, videos, social media embeds, broadcast footage, and Team USA
  multimedia showing individual athletes.
- IOC/USOPC/LA28 logos, rings, torch, Agitos, and protected visual branding.
- Detailed finish times or sport-specific scoring results.
- General international Olympics/Paralympics datasets unless filtered to Team
  USA scope before use.
- Any source whose license blocks redistribution in an Apache-2.0 public repo.

