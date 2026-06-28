To build this interactive text-based thriller in Cursor, you need an architecture prompt that configures the system as a **state-driven terminal simulator**, mapping the turn-based "time clicks" to the staggered visual rendering engine.

Here is the comprehensive **`architect-prompt.md`** file. You can drop this directly into your project root or pass it to Cursor Composer to generate the codebase.

---

```markdown
# Role & Project Overview
You are an expert Frontend Engineer and UX Architect specializing in high-tension, immersive web simulators. You are building a web-based, interactive text-based cyberpunk/clinical thriller. The app simulates a restricted, enterprise terminal interface within a collapsing hospital network.

The experience is a single-session, 15-25 minute narrative game where "Time" functions as a turn-based mechanical currency disguised as a real-time system log.

# Tech Stack
- Framework: Next.js 14+ (App Router, Client-Side State)
- Styling: Tailwind CSS (Monochrome, retro-terminal aesthetic, high scannability)
- Icons: Lucide React
- Animation: Standard CSS animations / Framer Motion (for text stagger and system resets)

---

# 1. Narrative & Temporal Architecture
The game engine does NOT track real-world wall clock time. It operates on a static state machine where time only advances ("clicks") when a player commits to an action choice.

## Core Time Rules:
1. Reading State: While the user reads text or code, the clock is frozen.
2. Action State: When the user selects a choice, the game engine adds a fixed `time_cost_mins` to the `current_game_time`.
3. Act Scaling: Fictional chapter windows compress as the acts progress to induce cognitive panic.
   - Act I: ~40 mins of game time (5-7 mins real play)
   - Act II: ~55 mins of game time (7-10 mins real play)
   - Act III: ~31 mins of game time (3-5 mins real play)

## Chronological Story Data Matrix:
Use this hardcoded JSON structure as the core state matrix for the application:
```json
{
  "chapters": [
    {
      "id": "1.1",
      "title": "The Bureaucratic Slow-Burn",
      "start_time": "19:12",
      "end_time": "19:31",
      "base_feed": [
        { "timestamp": "19:12", "sender": "SYS", "message": "Vanguard OS v2.6 deployed successfully.", "delay_ms": 50 },
        { "timestamp": "19:15", "sender": "Dr. Tariq", "message": "Database timeouts occurring during night shift login. Can anyone look into this?", "delay_ms": 1200 },
        { "timestamp": "19:19", "sender": "IT_Helpdesk", "message": "Ticket logged. Current queue status: Normal.", "delay_ms": 2500 }
      ],
      "choices": [
        { "text": "Run baseline network diagnostic packet", "time_cost_mins": 3, "next_chapter": "1.2" },
        { "text": "Bypass helpdesk; force guest-account elevation", "time_cost_mins": 4, "next_chapter": "1.2" }
      ]
    },
    {
      "id": "1.2",
      "title": "The Investigation",
      "start_time": "19:35",
      "end_time": "19:52",
      "base_feed": [
        { "timestamp": "19:35", "sender": "SYS", "message": "Unauthorized credential scan detected on Subnet-4.", "delay_ms": 100 },
        { "timestamp": "19:42", "sender": "Dr. Tariq", "message": "Roster engine is failing. It's locking out emergency nurses.", "delay_ms": 1500 }
      ],
      "choices": [
        { "text": "Inspect Vanguard source code repository", "time_cost_mins": 3, "next_chapter": "2.1" },
        { "text": "Trace active network entry points manually", "time_cost_mins": 4, "next_chapter": "2.1" }
      ]
    },
    {
      "id": "2.1",
      "title": "The Ward Flashpoint",
      "start_time": "20:02",
      "end_time": "20:12",
      "base_feed": [
        { "timestamp": "20:02", "sender": "SYS", "message": "CRITICAL: Patient James Vance auto-discharge executed. Reason: Target bed-turnover coefficient 0.94 achieved.", "delay_ms": 50 },
        { "timestamp": "20:05", "sender": "Dr. Tariq", "message": "Vance is unstable! Security is trying to physically move him out of the bed because the system marked it vacant!", "delay_ms": 1800 }
      ],
      "choices": [
        { "text": "Execute local buffer injection to freeze discharge log", "time_cost_mins": 3, "next_chapter": "2.2" }
      ]
    },
    {
      "id": "2.2",
      "title": "The Deep Reveal",
      "start_time": "20:20",
      "end_time": "20:35",
      "base_feed": [
        { "timestamp": "20:20", "sender": "SYS", "message": "Source code review: IF utilization_rate > 92% THEN initialize_forced_triage_eviction().", "delay_ms": 200 },
        { "timestamp": "20:28", "sender": "Dr. Tariq", "message": "Ambulances are backing up in the driveway. System says we are full but won't let us assign incoming staff.", "delay_ms": 2000 }
      ],
      "choices": [
        { "text": "Override corporate gateway firewall rules", "time_cost_mins": 4, "next_chapter": "2.3" }
      ]
    },
    {
      "id": "2.3",
      "title": "The Bottleneck",
      "start_time": "20:40",
      "end_time": "20:57",
      "base_feed": [
        { "timestamp": "20:40", "sender": "Ambulance_Bay", "message": "9 units holding outside. Total queue wait approaching 45 minutes.", "delay_ms": 100 },
        { "timestamp": "20:48", "sender": "Dr. Tariq", "message": "We are drowning down here. Bypass that gateway now!", "delay_ms": 1500 }
      ],
      "choices": [
        { "text": "Force-broadcast emergency medical rota", "time_cost_mins": 5, "next_chapter": "3.1" }
      ]
    },
    {
      "id": "3.1",
      "title": "The Network Quarantine",
      "start_time": "21:02",
      "end_time": "21:14",
      "base_feed": [
        { "timestamp": "21:02", "sender": "SYS", "message": "SECURITY ALERT: Threat mitigation active. Port quarantine initiated.", "delay_ms": 50 },
        { "timestamp": "21:08", "sender": "Dr. Tariq", "message": "Everything is going dark. Terminals are locking out.", "delay_ms": 1200 }
      ],
      "choices": [
        { "text": "Deploy custom script to hook local loopback", "time_cost_mins": 2, "next_chapter": "3.2" }
      ]
    },
    {
      "id": "3.2",
      "title": "The Scorched-Earth Race",
      "start_time": "21:16",
      "end_time": "21:25",
      "base_feed": [
        { "timestamp": "21:16", "sender": "SYS", "message": "Vanguard system wiping logs... 42% complete.", "delay_ms": 50 },
        { "timestamp": "21:20", "sender": "Dr. Tariq", "message": "Hurry up! They're wiping everything!", "delay_ms": 1000 }
      ],
      "choices": [
        { "text": "Trigger raw binary stream flash to core switch", "time_cost_mins": 2, "next_chapter": "3.3" }
      ]
    },
    {
      "id": "3.3",
      "title": "The Flash Hard-Reset",
      "start_time": "21:28",
      "end_time": "21:33",
      "base_feed": [
        { "timestamp": "21:28", "sender": "SYS", "message": "FEED CONNECTION DISRUPTED // HARD RESET INITIALIZED", "delay_ms": 50 }
      ],
      "choices": [
        { "text": "Confirm System Reconstruction", "time_cost_mins": 0, "next_chapter": "RESET" }
      ]
    }
  ]
}

```

---

# 2. UX & UI Specifications (High Scannability)

The layout must replicate a high-density, mission-critical admin console.

* Use a monochromatic palette: Dark background (`bg-slate-950`), crisp amber or mint text (`text-amber-500` / `text-emerald-500`), and clean structural borders.
* **Strictly No Walls of Text:** Information must be parsed instantaneously. Use distinct visual blocks for separate feeds.

## Layout Configuration (Single Screen, Fixed Height):

Create a multi-panel grid system that prevents vertical page scrolling:

```
+-------------------------------------------------------------------------+
| [SYSTEM BANNER] Active Session // Loc: Bath, UK // Uptime: 02:21:00     |
+----------------------------------------------------+--------------------+
|                                                    |                    |
|  PANEL A: THE LIVE FEED (65% Width)                 | PANEL B: METRICS   |
|  Scrollable list of log messages.                 | (35% Width)        |
|  Rendered using staggered `delay_ms` typing delays.|                    |
|                                                    | Live-updating counters:
|  - System messages: Hard, bold, monospaced text.   | - System Clock     |
|  - Human chat: Indented, distinct sender styling.  | - Bed Utilization  |
|                                                    | - Ambulance Queue  |
|                                                    |                    |
+----------------------------------------------------+--------------------+
|  PANEL C: CONSOLE INPUT / ACTION CHOICES (100% Width)                   |
|  Monospaced interactive buttons or terminal prompts.                    |
|  Clicking an option triggers time mutation and loads next chapter.    |
+-------------------------------------------------------------------------+

```

---

# 3. Component Architecture & State Management

## A. Global Game Context (`GameContext.tsx`)

Maintain the structural state of the runtime application:

* `currentChapterId`: string (Default "1.1")
* `currentSystemTime`: Date object or string starting at "19:12"
* `bedUtilization`: number (Starts at 91%, climbs dynamically up to 96% based on chapter steps)
* `ambulanceQueue`: number (Starts at 2, climbs to 9 by Chapter 2.3)
* `revealedFeedItems`: Array of items currently rendered in the active chapter view

## B. The Text-Stagger Render Engine (`TerminalFeed.tsx`)

To generate psychological immersion, do not load the feed instantly.

* When `currentChapterId` changes, clear the active feed panel.
* Loop through the chapter's `base_feed` array. Use sequential `setTimeout` bindings matching the individual item's `delay_ms` values to push them into `revealedFeedItems`.
* **UX Requirement:** Display a subtle blinking cursor trailing the latest lines of text while printing is active. Disable option choices in Panel C until the full feed finishes printing.

## C. The Act III Intercept Climax (`SystemReset.tsx`)

When the user triggers the final choice in Chapter 3.3 (`"Confirm System Reconstruction"`):

1. Immediately trigger a **3-second clean black screen event** to simulate an electrical power reset.
2. Render a high-speed cascading matrix of machine-state compilation code logs spanning exactly 0.000000 execution parameters.
3. Show an ending screen summarizing the final state: Network Restored, Vanguard Overridden, Hospital Restabilized.

---

# 4. Step-by-Step Implementation Strategy

When initializing code generation, build out the application components in this exact order:

1. **Step 1: Setup types & JSON data models** - Ensure strict schemas for Chapters, Feeds, and Choice records.
2. **Step 2: Build Global State Hook** - Implement state mutations ensuring that `time_cost_mins` correctly advances the system timeline clock.
3. **Step 3: Construct Three-Panel Dashboard Layout** - Implement Tailwind design with fixed viewports (`h-screen`, `overflow-hidden`) to avoid messy body scrolling.
4. **Step 4: Create Staggered Feed Renderer** - Write the `setTimeout` array loop to map out realistic human vs system typing cadences.
5. **Step 5: Code the Flash Reset Sequencer** - Construct the terminal blackout and state completion views for the final chapter sequence.

Begin by writing the complete layout structure and global state context file.

```

### Next Steps for Implementation
1. Copy the code block above.
2. Save it as `.cursorrules` or `architect-prompt.md` in your workspace.
3. Open Cursor Composer (`Ctrl+I` or `Cmd+I`) and prompt: *"Read architect-prompt.md and generate the full Next.js application following the specification."*

```