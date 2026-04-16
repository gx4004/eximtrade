# Geolocation Prompt Dataset — Review Summary

**Project:** mistralaicollab  
**Dataset:** 1,470 multilingual geolocation prompts for voice recognition  
**Date:** 2026-04-16  
 
---

## 0. Document Workflow

While this project has no durable git history yet, use `spec.md` as the brief human-readable record of major project changes.

- Add a short dated note when an important update lands.
- Keep entries concise: focus on milestones, not every small edit.
- If a major update changes project facts (test counts, verifier counts, architecture status), update the affected claims in this file at the same time.

### Recent Major Updates

- **2026-04-16:** Audited external CSV revisions `prompts(2).csv` and `trip_planning_multilingual(2).csv`. The previously observed Italian trip-planning defects are fixed in revision 2 (`in Via`, `fino a Via`, `da Via X a Via Y`, `vicino a Via`, `da Via X a Roma`, `a una stazione`). Remaining residual review items are now small and concentrated: `prompts(2).csv` still has **3 French Paris phrasing issues** and **1 Portuguese capitalization issue**; `trip_planning_multilingual(2).csv` still has **9 French Paris phrasing issues**. Native-speaker/LLM final sign-off therefore remains pending.
- **2026-04-14:** Implemented the full `mistralaicollab_FIXES.md` plan: added brand scaffolds for 16 brand POIs in non-English prompts, retired the LLM reviewer stub, removed `sys.path` hacks via `pyproject.toml`, added `requirements-dev.txt`, normalized CSV line endings to LF, added GitHub Actions CI, and completed final verification at **19,120 / 19,120** checks with **16 / 16** tests passing.

---

## 1. Completed Work

### Dataset Generation Pipeline

The core deliverable is a deterministic Python generator (`src/generators/prompt_generator.py`, ~980 lines) that produces exactly **1,470 prompts** from a structured combinatorial design:

| Dimension        | Count | Details                                                               |
|------------------|------:|-----------------------------------------------------------------------|
| Languages        |     7 | English, French, German, Italian, Dutch, Spanish, Portuguese          |
| Cities           |     7 | London, Berlin, Barcelona, Paris, Amsterdam, Rome, Lisbon             |
| Streets per city |    20 | Real street names, researched per city                                |
| POIs per city    |     7 | City-specific local brands and cultural terms (see "City-Specific POIs" below) |
| Templates/lang   |    30 | 30 hand-written templates per language, distributed across 7 categories and 5 phrasing families |
| **Total**        | **1,470** | 7 × 7 × 30 — enforced by runtime invariants                     |

**Categories:** nearest_poi, navigation, distance, public_transport, opening_hours, accessibility, area_info  
**Phrasing families:** interrogative, imperative, indirect, conditional, embedded_clause

### Linguistic Post-Processing (8 functions)

The generator applies language-specific grammar rules after template formatting:

| Function                       | Language | Purpose                                        |
|--------------------------------|----------|------------------------------------------------|
| `_fr_elides()` / `_fr_de_elided()` | FR  | Vowel elision: *de Avinguda* → *d'Avinguda*   |
| `_apply_it_euphonic_d()`       | IT       | *a Amsterdam* → *ad Amsterdam*                 |
| `_apply_it_contractions()`     | IT       | Preposition + article contractions             |
| `_apply_de_street_articles()`  | DE       | Genitive *der Champs-Élysées*, dative fallback |
| `_de_zu_street()`              | DE       | Street-gender-aware *zu/zur/zum* selection     |
| `_apply_pt_contractions()`     | PT       | *de + os* → *dos*, *em + os* → *nos*, etc.    |
| `_resolve_forms()`             | All      | Gender-aware article/adjective forms per POI   |

### City-Specific POIs

Generic POI types (bank, pharmacy, etc.) were replaced with locally natural names:

| City      | Bank             | Pharmacy       | Restaurant | Hotel       | Supermarket    |
|-----------|------------------|----------------|------------|-------------|----------------|
| London    | Barclays         | Boots          | pub        | B&B         | Tesco          |
| Berlin    | Sparkasse        | Apotheke       | Imbiss     | Pension*    | Edeka          |
| Barcelona | CaixaBank        | farmacia       | tasca      | hostal      | Mercadona      |
| Paris     | BNP Paribas      | pharmacie      | brasserie  | auberge     | Carrefour      |
| Amsterdam | ING              | Kruidvat       | eetcafé    | hostel      | Albert Heijn   |
| Rome      | Intesa Sanpaolo  | parafarmacia   | trattoria  | locanda     | Conad          |
| Lisbon    | Millennium BCP   | farmácia       | taberna    | residencial | Pingo Doce     |

*ATM and hospital are translated per language (utility terms), not localized per city.*  
\* Berlin "Pension" has per-language translations: guesthouse (en), pension (fr), Pension (de), pensione (it), etc.

Each POI carries grammatical gender per language for correct article/adjective agreement.

### German Linguistic Fixes (3 bugs resolved)

| Row | Before | After | Rule |
|-----|--------|-------|------|
| 493 | *Wegbeschreibung **zum** Carrer de Rosselló* | *Wegbeschreibung **zur** Carrer de Rosselló* | Carrer = feminine (die Straße) |
| 513 | *in der Nähe **von den** Champs-Élysées* | *in der Nähe **der** Champs-Élysées* | Genitive preferred over dative |
| 533 | *in der Nähe **von den** Champs-Élysées* | *in der Nähe **der** Champs-Élysées* | Same rule, different template |

Fixes applied in generator logic (not just CSV), so regeneration preserves them.

---

## 2. Validated Quality

### Verification Suite (`scripts/verify_dataset.py`)

23 automated checks, 19,120 total assertions — **all passing**.

**Per-prompt checks (13 rules × 1,470 prompts):**

| ID  | Check                          | Status |
|-----|--------------------------------|--------|
| P01 | All 8 fields non-empty         | ✓      |
| P02 | Valid language_code             | ✓      |
| P03 | language_name matches code      | ✓      |
| P04 | Valid city                      | ✓      |
| P05 | Country matches city            | ✓      |
| P06 | Street in city's street list    | ✓      |
| P07 | Valid category                  | ✓      |
| P08 | Valid phrasing_family           | ✓      |
| P09 | Street name appears in text     | ✓      |
| P10 | City name appears in text       | ✓      |
| P11 | No English POI label leak       | ✓      |
| P12 | No gender slash markers (il/la) | ✓      |
| P13 | No unresolved {placeholders}    | ✓      |

**Aggregate checks (10 rules):**

| ID  | Check                            | Status |
|-----|----------------------------------|--------|
| A01 | Total = 1,470                    | ✓      |
| A02 | 49 (lang × city) combos          | ✓      |
| A03 | 30 prompts per combo             | ✓      |
| A04 | ≥3 phrasing families per combo   | ✓      |
| A05 | ≥3 categories per combo          | ✓      |
| A06 | No exact duplicate texts         | ✓      |
| A07 | POI balance (max/min ≤ 1.5×)    | ✓      |
| A08 | All 20 streets/city used ≥1×     | ✓      |
| A09a | DE Berlin street lexical shape   | ✓      |
| A09b | DE Berlin feminine street grammar | ✓      |

### Test Suite (`tests/`)

**16 tests, 16 passed** — covering 7 iterative QA rounds.

| File                       | Tests | Scope                                             |
|----------------------------|------:|---------------------------------------------------|
| `test_csv_exporter.py`     |    10 | CSV export, columns, article handling, QA rounds 2-7 |
| `test_verify_dataset.py`   |     6 | POI counting, city display, elision helpers        |

QA rounds pinned as regression tests: each test method (e.g., `test_export_qa_round3_fixes`) locks in specific linguistic corrections discovered during review.

### Sample Prompts

```
[en|London    ] Where is the nearest Barclays to Baker Street in London?
[fr|Barcelona ] Trouve-moi un distributeur près de Passeig de Gràcia à Barcelone.
[de|Berlin    ] Ich muss ein Krankenhaus in der Nähe von Karl-Marx-Allee in Berlin finden.
[it|Rome      ] Voglio verificare se l'Intesa Sanpaolo in zona Via Veneto a Roma è aperta.
[nl|London    ] Is de Boots bij Bond Street in Londen nu open?
[es|London    ] ¿Puedes decirme dónde está el Barclays más cercano en Portobello Road en Londres?
[pt|London    ] Quero verificar se o pub em Regent Street em Londres está aberto.
```

---

## 3. Architecture Overview

```
src/
  generators/prompt_generator.py   ← core: languages, cities, streets, POIs, templates, generate_all()
  db/models.py                     ← SQLAlchemy model: geolocation_prompts table (12 columns)
  db/connection.py                 ← engine + session factory (pool_pre_ping=True)
  export/csv_exporter.py           ← CSV export (generator → CSV, DB → CSV)
  config.py                        ← env-based DB config (no hardcoded creds)

scripts/
  generate_csv.py                  ← generate prompts → CSV (primary entry point)
  generate_and_store.py            ← generate prompts → MySQL (with --force flag)
  verify_dataset.py                ← 23-check verification suite (+ `--check-csv`)
  setup_db.py                      ← create DB schema
  export_csv.py                    ← export DB → CSV

tests/
  test_csv_exporter.py             ← 10 tests (core + QA rounds 2-7)
  test_verify_dataset.py           ← 6 tests (verification helpers)

docker-compose.yml                 ← MySQL 8.0 + Adminer
data/output/prompts.csv            ← generated output (1,471 lines, gitignored)
```

### DB Schema (`geolocation_prompts`)

| Column          | Type         | Notes                     |
|-----------------|--------------|---------------------------|
| id              | INT PK AUTO  |                           |
| language_code   | VARCHAR(10)  | NOT NULL                  |
| language_name   | VARCHAR(50)  | NOT NULL                  |
| city            | VARCHAR(100) | NOT NULL                  |
| country         | VARCHAR(100) | NOT NULL                  |
| street_name     | VARCHAR(255) | NOT NULL                  |
| category        | VARCHAR(100) | NOT NULL                  |
| prompt_text     | TEXT         | NOT NULL                  |
| phrasing_family | VARCHAR(50)  | NOT NULL                  |
| review_status   | VARCHAR(20)  | default "pending"         |
| review_notes    | TEXT         | nullable                  |
| created_at      | DATETIME     | server default: now()     |

---

## 4. Open Proposals

### A. Packaging / Tooling Status

| Area                             | Status                                        |
|----------------------------------|-----------------------------------------------|
| Packaging metadata               | ✅ `pyproject.toml` added with editable install |
| Dev dependencies                 | ✅ `requirements-dev.txt` added               |
| `sys.path.insert(0, ...)` in scripts | ✅ Removed in favor of package install     |
| CI pipeline                      | ✅ `.github/workflows/ci.yml` added           |
| Mixed `print()` + `logging`      | Optional cleanup still open                   |

Most packaging and workflow polish items are now complete; logging consistency remains optional cleanup.

### B. Common Voice Deployment

Pending clarification from team (Maxim) on:
- Whether 1,470 samples can be uploaded directly to Common Voice via DB
- MySQL vs. the platform's expected import format
- Review workflow integration with Common Voice's text corpus pipeline

---

## 5. Known Risks & Open Questions

| Item | Status | Notes |
|------|--------|-------|
| Trademark use in prompts | **Low risk** | Factual/nominative use of brand names (Barclays, Tesco, etc.). Mixed with generic local terms. Standard for NLP datasets. |
| Gender accuracy for new POIs | **Verified by code** | Grammatical gender assigned per language per POI. `_resolve_forms()` produces correct articles/adjectives. All 19,120 checks pass. |
| City-specific POI plan vs. implementation | **Divergence** | Some POIs were adjusted during implementation for naturalness (e.g., "pub" instead of "Pret", "B&B" instead of "Premier Inn", translated hospital/ATM instead of local ER terms). Final implementation prioritised naturalness over brand specificity. |
| External CSV revision 2 | **Partially verified** | `prompts(2).csv` and `trip_planning_multilingual(2).csv` resolve the earlier Italian `Via`/station wording defects, but small residual French phrasing issues remain, plus one Portuguese capitalization issue in `prompts(2).csv`. |
| Native speaker review | **Inferred incomplete** | Acceptance criteria mention "reviewed by LLM and possibly a native speaker." Automated verification is thorough but does not replace native speaker judgment on naturalness. |
| CI regression protection | **Mitigated** | GitHub Actions CI now runs pytest, regeneration, verifier, and CSV verification checks. |
| CSV is gitignored | **By design** | `data/output/` and `*.csv` are in `.gitignore`. The CSV is a generated artifact, reproducible from `python scripts/generate_csv.py`. |

---

## 6. Acceptance Criteria Status

From the original task specification:

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Textual dataset of geolocation prompts | ✅ Done | 1,470 prompts in `data/output/prompts.csv` |
| 7 languages × 7 locations | ✅ Done | 49 combos verified (A02) |
| 1,470 total examples | ✅ Done | Exact count enforced by invariant + verified (A01) |
| Supported languages: FR, DE, IT, EN, NL, ES, PT | ✅ Done | All 7 present (P02) |
| Queries reviewed by LLM | ⚠️ Retired | LLM reviewer stub removed; DB columns reserved for future use |
| Reviewed by native speaker | ⚠️ Inferred partial | No evidence of formal native speaker sign-off |
| Store in database (MySQL) and CSV | ✅ Infra ready | Docker MySQL + schema + insert script exist; CSV generated |
