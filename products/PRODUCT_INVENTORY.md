# SoftwareHub Product Inventory

## Source Codebase
All products are sourced from Safari Automation monorepo:
`/Users/isaiahdupree/Documents/Software/Safari Automation/`

## Products (11 Total)

### ✅ Ready for Packaging (100%)

| Product | Source Path | Package |
|---------|-------------|---------|
| **Watermark Remover (BlankLogo)** | `Safari Automation/` (BlankLogo module) | `watermark-remover` |
| **EverReach CRM** | `packages/crm-core/` | `everreach-crm` |

### 🔄 Near Complete (80-95%)

| Product | Source Path | Package | Remaining |
|---------|-------------|---------|-----------|
| **Auto Comment** | `packages/unified-comments/` | `auto-comment` | Testing |
| **Auto DM** | `packages/unified-dm/` | `auto-dm` | Sessions, threading |
| **TTS Studio** | `/Software/TTS/` | `tts-studio` | Electron UI |

### 🔧 In Development (40-70%)

| Product | Source Path | Package | Remaining |
|---------|-------------|---------|-----------|
| **Sora Video** | `services/src/sora/` | `sora-video` | App UI wrapper |
| **MediaPoster** | `/Software/MediaPoster/` | `media-poster` | Open source strategy |
| **WaitlistLab** | `/Software/WaitlistLabapp/` | `waitlist-lab` | AMD, dashboard, billing |
| **AI Video Platform** | `/Software/ai-video-platform/` | `ai-video` | Core pipeline |

### ⬜ Not Started (0%)

| Product | PRD | Package |
|---------|-----|---------|
| **KaloData Scraper** | `PRD_KALODATA_SCRAPER.md` | `kalodata-scraper` |
| **Competitor Research** | `PRD_COMPETITOR_RESEARCH.md` | `competitor-research` |

## Safari Automation Package Mapping

```
packages/
├── crm-core/           → EverReach CRM
├── crm-client/         → CRM client SDK
├── unified-comments/   → Auto Comment
├── unified-dm/         → Auto DM
├── instagram-comments/ → Auto Comment (IG)
├── instagram-dm/       → Auto DM (IG)
├── tiktok-comments/    → Auto Comment (TikTok)
├── tiktok-dm/          → Auto DM (TikTok)
├── twitter-comments/   → Auto Comment (Twitter)
├── twitter-dm/         → Auto DM (Twitter)
├── threads-comments/   → Auto Comment (Threads)
├── social-cli/         → CLI for all social tools
└── services/           → Sora Video orchestrator
```

## Packaging Strategy

### Desktop Apps (Electron)
- Watermark Remover
- TTS Studio
- Sora Video

### SaaS Products (Web)
- EverReach CRM
- WaitlistLab
- AI Video Platform

### CLI Tools (npm packages)
- Auto Comment
- Auto DM
- KaloData Scraper
- Competitor Research

## License Key Format

```
PRODUCT-XXXX-XXXX-XXXX-XXXX

Examples:
BLANKLOGO-A1B2-C3D4-E5F6-G7H8
AUTOCOMMENT-X9Y8-Z7W6-V5U4-T3S2
EVERREACH-M3N4-O5P6-Q7R8-S9T0
```

## PRD References

Located at: `/Software/WaitlistLabapp/waitlist-lab/docs/PRDs/`

- `PRD_AUTO_COMMENT.md`
- `PRD_AUTO_DM.md`
- `PRD_WATERMARK_REMOVER.md`
- `PRD_TTS_STUDIO.md`
- `PRD_KALODATA_SCRAPER.md`
- `PRD_COMPETITOR_RESEARCH.md`
- `PRD_COURSE_PLATFORM_LICENSING.md`
