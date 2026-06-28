# THE OPEN HEALTH PROJECT

> Narrative export for editing. Keep every `<!-- @... -->` line unchanged.
> Preserve placeholders like `{bedUtilization}` and `{ambulanceQueue}`.
> Re-import with: `npm run import:story`

---

## Intro

<!-- @intro.title -->
THE OPEN HEALTH PROJECT

<!-- @intro.body -->
You are a journalistic hacker who has been tipped off about a failing NHS trust network. You have been hired as a guest auditor with read-only access. You are monitoring communication channels to help uncover the whole story. Time advances only when you act. Read the live feed, run terminal commands, and choose interventions before the system optimizes patients out of existence.

<!-- @intro.cta -->
Begin Session

---

## Chapter 1.1 · 09:00
**Identity:** guest@sw-trust.nhs · **Channel:** #clinical-ops-feed

### Console — on entry

<!-- @1.1.console_init[0] -->
guest@sw-trust-auditor:~$ scan_network_nodes --subnet=10.141.0.0

<!-- @1.1.console_init[1] -->
[SCANNER] Scanning subnet 10.141.0.0/24...
FOUND: 24 active hospital nodes. 1 external endpoint identified.

<!-- @1.1.console_init[2] -->
STATUS: Staging server staging.omnic-care.co.uk:9921 accepting external connections.

### Feed — on entry

<!-- @1.1.feed_init[0] · SYSTEM · +0m -->
Reminder to all staff: OmnicCare OS v4.0 rolls out across the Trust at 09:30. Expect brief 30-second disconnects on vitals monitors.

<!-- @1.1.feed_init[1] · ED Triage · +2m -->
@Nick does this patch fix the discharge letter lag? We've got 4 people waiting for prescriptions just to clear their beds.

<!-- @1.1.feed_init[2] · IT Helpdesk · +4m -->
@Sarah Supposed to. It's a total overhaul of the integration layer.

<!-- @1.1.feed_init[3] · Ambulance Handover · +6m -->
We've got 3 crews arriving in the bay now. Traffic on the A36 is awful, expect a rush.

<!-- @1.1.feed_init[4] · SYSTEM · +8m -->
OmnicCare OS v4.0 deployment initiated...

<!-- @1.1.feed_init[5] · SYSTEM · +10m -->
Update successful. All nodes active on NHS Trust Grid 4.

<!-- @1.1.feed_init[6] · ED Triage · +12m -->
Monitors flickered and came back. Discharge system seems smoother. Touch wood.

<!-- @1.1.feed_init[7] · IT Helpdesk · +14m -->
@IT-Helpdesk Nick, can you check the arrival screen in the bay? It's not pulling through the pre-alerts from the regional CAD (Computer Aided Dispatch). It's just showing a spinning wheel.

<!-- @1.1.feed_init[8] · ED Control · +16m -->
Hang on, why has our active occupancy dashboard just dropped? It says we are at {occupancy}% occupancy. We haven't moved anyone out. Every single cubicle in A&E is physically full.

<!-- @1.1.feed_init[9] · Ambulance Handover · +18m -->
Another crew just pulled up. That's {ambulanceQueue} in the bay. Still no CAD sync. I can't see what's coming in. @Nick?

### Pressure (conditional)

<!-- @1.1.pressure_lines[0] · ED Control · when ambulanceQueue≥5 -->
AMBULANCE BLIND SPOT: {ambulanceQueue} crews backed up outside. Emergency intake unable to view CAD telemetry.

---

### Choice A — Inspect OmnicCare public staging server deployment logs
*(15 min · ambulanceQueue +1)*

<!-- @1.1.options[0].text -->
Inspect OmnicCare public staging server deployment logs

<!-- @1.1.options[0].player_message -->
Connecting to staging portal on exposed port 9921... Accessing deployment history for package: omnic-v4.0.

#### Console response

<!-- @1.1.options[0].console_response[0] -->
guest@sw-trust-auditor:~$ inspect_deployment_logs --package=omnic-v4.0

<!-- @1.1.options[0].console_response[1] -->
[G_HACK_TERM v2.14] Connecting to staging.omnic-care.co.uk:9921... Connected.

<!-- @1.1.options[0].console_response[2] -->
09:29:44 [BUILD_ENG] WARNING: Database schema mismatch detected on 'NHS-Trust-ID' mapping.

<!-- @1.1.options[0].console_response[3] -->
09:29:45 [BUILD_ENG] WARNING: CAD_Sync_Agent failing handshake on port 8080.

<!-- @1.1.options[0].console_response[4] -->
09:29:46 [BUILD_ENG] Deployment halted by automated safety check.

<!-- @1.1.options[0].console_response[5] -->
09:30:02 [SYS_ADMIN_OVERRIDE] User: j.hargreaves@omnic-care.co.uk

<!-- @1.1.options[0].console_response[6] -->
09:30:03 [SYS_ADMIN_OVERRIDE] Message: "Force deployment. Contract SLA penalties apply if we miss the Q1 deadline. Push the build, we will hotfix the sync issues live next month."

#### Feed after choice

<!-- @1.1.options[0].feed_update[0] · Ambulance Handover · +15m -->
Still nothing on screens. We are manually writing incoming vitals down on whiteboards.

<!-- @1.1.options[0].feed_update[1] · SYSTEM · +17m -->
[CRITICAL] Dynamic updates for {occupancy}% dashboard frozen. Main pipeline unresponsive.

---

## Chapter 1.2 · 09:45
**Identity:** guest@sw-trust.nhs · **Channel:** #clinical-ops-feed

### Console — on entry

<!-- @1.2.console_init[0] -->
guest@sw-trust-auditor:~$ bypass_omnic_lockout --target=hospital-sql-01

<!-- @1.2.console_init[1] -->
[EXPLOIT] Injecting temporary security token override into local cluster gateway...
[SUCCESS] Accessing core-db.nhs-grid4.internal bypass channel. Admin lock active.

<!-- @1.2.console_init[2] -->
SYSTEM ALERT: Remote SQL access restricted by OmnicCare vendor policy 'IP-Shield-V4'.

### Feed — on entry

<!-- @1.2.feed_init[0] · IT Helpdesk · +3m -->
@Tom looking at the CAD sync issue now. OmnicCare central support says it's a local network glitch on our end. They're telling us to restart our switches.

<!-- @1.2.feed_init[1] · Ambulance Handover · +7m -->
Restarting will take the whole bay offline for 10 minutes! We have 7 ambulances parked up now, engines running. Drivers are refusing to leave their vehicles because we can't generate patient wristbands to formally log the handover.

<!-- @1.2.feed_init[2] · ED Clinical Lead · +17m -->
This is dangerous. Sarah, why is the PAS (Patient Administration System) refusing to move patients out of triage into the main ward slots?

<!-- @1.2.feed_init[3] · ED Triage · +20m -->
Dr. Aris, I'm trying. Every time I click 'Assign Bed' to clear a cubicle, the system spins for 60 seconds and then gives a 'Database Timeout: Row Locked' error.

<!-- @1.2.feed_init[4] · ED Clinical Lead · +29m -->
Well, override it! We have a suspected stroke patient sitting in the back of an ambulance on the ramp who needs an immediate CT scan, but I can't request the scan until they are officially admitted into a bed on the system!

<!-- @1.2.feed_init[5] · IT Helpdesk · +40m -->
I've raised a Priority 1 ticket with OmnicCare. They've locked our local admin access to the SQL console. They claim they are protecting intellectual property while they investigate an 'unauthorized credential leak.' They won't let me manually clear the database timeouts.

<!-- @1.2.feed_init[6] · Hospital Director · +53m -->
Attention all staff. We are declaring a Business Continuity Incident (OPEL 4 / Black Alert). Requesting a total Divert for all incoming non-life-threatening blue lights to Royal United.

<!-- @1.2.feed_init[7] · Ambulance Handover · +57m -->
Claire, Royal United just refused the divert. They're gridlocked too. We have {ambulanceQueue} ambulances outside now. The queue is stretching out onto the main road.

### Pressure (conditional)

<!-- @1.2.pressure_lines[0] · ED Control · when bedUtilization≥80 -->
CRITICAL OVERLOAD: {ambulanceQueue} crews stuck on ramp. Row level locks blocking internal admission channels.

---

### Choice A — Query active database row locks on the bed occupancy table
*(15 min · ambulanceQueue +4)*

<!-- @1.2.options[0].text -->
Query active database row locks on the bed occupancy table

<!-- @1.2.options[0].player_message -->
Bypassing local restrictions to trace row level locking conditions across patient system...

#### Console response

<!-- @1.2.options[0].console_response[0] -->
guest@sw-trust-auditor:~$ query_database_locks --table=bed_occupancy

<!-- @1.2.options[0].console_response[1] -->
[CRITICAL: 1,402 Active Row Locks Detected] Locking Process ID: PID_8812 [omnic_telemetry_agent]
Lock Type: Exclusive Write Lock (X-Lock) · Status: STALLED / TIMEOUT LOOP

<!-- @1.2.options[0].console_response[2] -->
[ANALYZING] PID_8812 trying to send 'patient_demographics_v4' to IP: 45.112.8.90 (OmnicCare Analytics Cloud).
Transmission FAILING: Connection refused by target server.

<!-- @1.2.options[0].console_response[3] -->
ERROR: Script written without asynchronous fallback. Holds infinite lock on data row.

<!-- @1.2.options[0].console_response[4] -->
[CHAT INTERCEPT - OMNIC ENG] Dev_1: "Analytics server down for maintenance, build doesn't have an error handling timeout for locks."
Dev_2: "Shit. So if the server is down, the whole hospital's bed management grid freezes?"

<!-- @1.2.options[0].console_response[5] -->
Manager_J: "Keep quiet about it. If they find out it's our telemetry script causing the lockouts, we are legally liable for the ambulance delays. Tell them it's a local infrastructure issue. Do not unlock their console access."

#### Feed after choice

<!-- @1.2.options[0].feed_update[0] · Hospital Director · +70m -->
OmnicCare helpdesk insisting their software metrics look optimal. This doesn't match reality.

<!-- @1.2.options[0].feed_update[1] · SYSTEM · +72m -->
DATABASE TIMEOUT: Row lock threshold exceeded. Real-time {occupancy}% metric display unstable.

---

## Chapter 1.3 · 10:45
**Identity:** guest@sw-trust.nhs · **Channel:** #clinical-ops-feed

### Console — on entry

<!-- @1.3.console_init[0] -->
guest@sw-trust-auditor:~$ kill_process --pid=8812 --force

<!-- @1.3.console_init[1] -->
[G_HACK_TERM v2.14] - Sending SIGKILL to Process ID: 8812...
Target: core-db.nhs-grid4.internal · Executing...
SUCCESS: PID_8812 [omnic_telemetry_agent] terminated.

<!-- @1.3.console_init[2] -->
[WARNING] Process manager attempting automated restart in 30 seconds...

### Feed — on entry

<!-- @1.3.feed_init[0] · ED Triage · +3m -->
We are out of paper triage forms. I repeat, we are out of paper forms. Tom, what is the status on those arriving ambulances?

<!-- @1.3.feed_init[1] · Ambulance Handover · +7m -->
It's 15 ambulances now. The police are here directing traffic on the main road because the queue is blocking the bus lanes. Crews are sharing portable oxygen cylinders on the ramp. This is completely unsustainable.

<!-- @1.3.feed_init[2] · ED Clinical Lead · +20m -->
Claire, we have an elderly patient in Ambulance 6 whose oxygen sats are dropping. I cannot get a clinical allocation because the PAS won't let me clear a discharged patient from Cubicle 3. I am physically moving them out anyway. We are operating completely blind.

<!-- @1.3.feed_init[3] · IT Helpdesk · +30m -->
OmnicCare has completely cut off my support portal account. They claim we violated our terms of service by trying to run unapproved database queries. They aren't helping us. They've abandoned the site.

<!-- @1.3.feed_init[4] · Hospital Director · +43m -->
@Nick, if we manually pull the network plug on the main server rack, will the local machines drop back to a safe offline cache?

<!-- @1.3.feed_init[5] · IT Helpdesk · +47m -->
No! v4.0 is cloud-authenticated. If you pull the fiber trunk, the whole system bricks instantly. It will take out the Pathology lab interfaces too. Do not touch the physical lines.

<!-- @1.3.feed_init[6] · ED Triage · +55m -->
@Tom @Dr.Aris the main triage arrival screen just went black. No wheel, no error code. Just dead.

### Pressure (conditional)

<!-- @1.3.pressure_lines[0] · Grid Lock · when ambulanceQueue≥12 -->
SYSTEM COLLAPSE: {ambulanceQueue} crews locked out. Outbound telemetry error holding live database strings hostage.

---

### Choice A — Inject database patch and exfiltrate internal compliance logs
*(15 min · ambulanceQueue -4)*

<!-- @1.3.options[0].text -->
Inject database patch and exfiltrate internal compliance logs

<!-- @1.3.options[0].player_message -->
Deploying force_unlock_pas.sql and piping internal OmnicCare developer chat logs to secure news bureau...

#### Console response

<!-- @1.3.options[0].console_response[0] -->
guest@sw-trust-auditor:~$ inject_sql_patch --file=force_unlock_pas.sql

<!-- @1.3.options[0].console_response[1] -->
[PROCESSING 1,402 BLOCKED ROWS...] Releasing Row Exclusive Locks on table: 'bed_occupancy'... OK.
Re-routing CAD_Sync_Agent to fallback local port 8080... OK.

<!-- @1.3.options[0].console_response[2] -->
[SYSTEM NOTICE] Integration layer status: RESTORED. Local database sync operational.

<!-- @1.3.options[0].console_response[3] -->
guest@sw-trust-auditor:~$ exfiltrate_audit_trail --target=press_secure_drop

<!-- @1.3.options[0].console_response[4] -->
Bundling: v4.0_deployment_override_logs.txt, engineering_chat_intercepts.log...
Connecting to press_secure_drop (BBC News Bureau)... Connected.

<!-- @1.3.options[0].console_response[5] -->
Uploading: [####################################] 100% Transmission Encrypted.
Target response: "Package safely indexed. Editorial team reviewing immediately."

#### Feed after choice

<!-- @1.3.options[0].feed_update[0] · ED Triage · +61m -->
Wait! The arrival screen just came back! It's pulling through the CAD data! I can see the stroke patient's pre-alerts!

<!-- @1.3.options[0].feed_update[1] · Ambulance Handover · +63m -->
The wristband printers are working! We are printing bands right now. Moving the queue, moving the queue. First three crews are handing over.

<!-- @1.3.options[0].feed_update[2] · IT Helpdesk · +67m -->
I didn't touch anything... the telemetry process just dropped dead and the SQL tables cleared themselves. Someone forced a patch from the outside.

<!-- @1.3.options[0].feed_update[3] · Hospital Director · +70m -->
My phone is blowing up. BBC News just launched a breaking alert: 'Leaked documents reveal software giant knowingly crippled NHS hospitals to secure contract bonuses.'

<!-- @1.3.options[0].feed_update[4] · ED Clinical Lead · +74m -->
I don't care who fixed it, just keep doing whatever you're doing. We are getting these people inside.

<!-- @1.3.options[0].feed_update[5] · SYSTEM · +75m -->
[G_HACK_TERM v2.14] Connection closed by remote host. Trace cleared. Clean exit.

---

## Chapter 1.4 · 12:00
**Identity:** guest@sw-trust.nhs · **Channel:** #clinical-ops-feed

### Console — on entry

<!-- @1.4.console_init[0] -->
guest@sw-trust-auditor:~$ deploy_anti_forensics --target=localhost

<!-- @1.4.console_init[1] -->
[G_HACK_TERM v2.14] - Deploying local defensive protocols...
Scrubbing volatile memory buffers... OK.
Overwriting system logs with randomized hex blocks... OK.

<!-- @1.4.console_init[2] -->
[WARNING] OmnicCare defensive scan reaching local gateway subnet...
Intercepting incoming ping from 194.22.104.12... Packet dropped.

### Feed — on entry

<!-- @1.4.feed_init[0] · Hospital Director · +2m -->
All staff: We are stepping down from OPEL 4 / Black Alert back to OPEL 3. The backlog is moving, but our priority is clearing the corridor congestion.

<!-- @1.4.feed_init[1] · IT Helpdesk · +5m -->
Claire, I'm looking at the core router traffic logs. Someone used an unmapped, hardcoded developer backdoor to push that SQL patch. OmnicCare's corporate security team is actively trying to regain control. They're running a network-wide scan to locate the intrusion vector.

<!-- @1.4.feed_init[2] · ED Triage · +12m -->
@Tom, that's the last patient off the ramp safely inside. Triage desk is fully operational again. It's still incredibly busy, but we have eyes on everyone. We aren't blind anymore.

<!-- @1.4.feed_init[3] · IT Helpdesk · +18m -->
CRITICAL WARNING: OmnicCare's central servers just initiated a remote firmware wipe on our local gateway to terminate the exploit chain. They are trying to destroy the evidence trail on our servers. I need to copy the local audit logs before they're gone!

<!-- @1.4.feed_init[4] · Hospital Director · +22m -->
@Nick, stop. Leave it. BBC News just posted the full, unredacted Slack logs and internal testing warnings on their live text block. The whole country is reading them. It doesn't matter what OmnicCare wipes here—the truth is already out.

<!-- @1.4.feed_init[5] · Ambulance Handover · +28m -->
All crews are officially handed over. No vehicles waiting on the ramp. First time since 9 AM. Exceptional work today, everyone.

<!-- @1.4.feed_init[6] · SYSTEM · +30m -->
Connection to NHS Trust Grid 4 interrupted by remote administrative action. Live feed terminating...

### Pressure (conditional)

<!-- @1.4.pressure_lines[0] · Trace Alert · when ambulanceQueue≤3 -->
ALERT: System stabilization detected. Current active occupancy: {occupancy}%. Closing backdoors.

---

### Choice A — Wipe local tracking history and execute clean network exit
*(5 min · bedUtilization -10)*

<!-- @1.4.options[0].text -->
Wipe local tracking history and execute clean network exit

<!-- @1.4.options[0].player_message -->
Purging environment flags, zeroing out terminal history tables, and dropping connection tunnel...

#### Console response

<!-- @1.4.options[0].console_response[0] -->
guest@sw-trust-auditor:~$ shred_session_history --force

<!-- @1.4.options[0].console_response[1] -->
[G_HACK_TERM v2.14] Deleting terminal command history... DONE.
Removing temporary configuration files... DONE.
Zero-out Master Boot Record allocation tables for this session... DONE.

<!-- @1.4.options[0].console_response[2] -->
[NOTICE] No local trace of '_Whistle_Drop_' remains on this terminal.

<!-- @1.4.options[0].console_response[3] -->
guest@sw-trust-auditor:~$ disconnect_node

<!-- @1.4.options[0].console_response[4] -->
Bypassing network bridge... Dropping terminal tunnel... Signal disconnected.

<!-- @1.4.options[0].console_response[5] -->
[TERMINAL CLOSED] Score: System Restored / Malpractice Exposed. Status: Ghost.

#### Feed after choice

<!-- @1.4.options[0].feed_update[0] · BBC NEWS LIVE · +35m -->
BREAKING: OmnicCare CEO Resigns Amid NHS Software Scandal. Leaked documents expose systemic contract manipulation.

<!-- @1.4.options[0].feed_update[1] · BBC NEWS LIVE · +40m -->
On-site IT report an unidentified individual pushed an external hotfix to restore hospital vitals tracking safely.

---

## Epilogue

### Feed

### Console — logout

<!-- @epilogue.logout_command -->
guest@sw-trust-auditor:~$ disconnect_node

<!-- @epilogue.logout_output[0] -->
[TERMINAL CLOSED] Session ended.

---

## System reset compile log

<!-- @compile_log[0] -->
INIT ghost_session_v1.0.bin

<!-- @compile_log[1] -->
LOAD kernel_modules [0.000000ms]

<!-- @compile_log[2] -->
VERIFY checksum 0xB8E3F102 [0.000000ms]

<!-- @compile_log[3] -->
MOUNT /sys/firmware/open_health [0.000000ms]

<!-- @compile_log[4] -->
PURGE omnic_telemetry_agent.bin [0.000000ms]

<!-- @compile_log[5] -->
REMAP bed_occupancy_partitions [0.000000ms]

<!-- @compile_log[6] -->
RESTORE cad_sync_routing_tables [0.000000ms]

<!-- @compile_log[7] -->
ENABLE pas_override_bus [0.000000ms]

<!-- @compile_log[8] -->
DISABLE row_lock_eviction_daemon [0.000000ms]

<!-- @compile_log[9] -->
RELINK cad_pre_alert_endpoints [0.000000ms]

<!-- @compile_log[10] -->
RESTORE wristband_print_engine [0.000000ms]

<!-- @compile_log[11] -->
UNMASK live_intake_queue_weights [0.000000ms]

<!-- @compile_log[12] -->
RECONNECT ambulance_bay_gateway [0.000000ms]

<!-- @compile_log[13] -->
VALIDATE pas_assign_bed_handlers [0.000000ms]

<!-- @compile_log[14] -->
SYNC nhs_trust_grid_4_mesh [0.000000ms]

<!-- @compile_log[15] -->
APPLY whistleblower_audit_layer [0.000000ms]

<!-- @compile_log[16] -->
REGISTER press_secure_drop_sink [0.000000ms]

<!-- @compile_log[17] -->
FLUSH omnic_forensics_flags [0.000000ms]

<!-- @compile_log[18] -->
COMMIT force_unlock_pas.sql [0.000000ms]

<!-- @compile_log[19] -->
START network_heartbeat [0.000000ms]

<!-- @compile_log[20] -->
ASSERT occupancy_cap=HUMAN_SAFE [0.000000ms]

<!-- @compile_log[21] -->
ASSERT cad_sync=LIVE_TELEMETRY [0.000000ms]

<!-- @compile_log[22] -->
BOOT userland_services [0.000000ms]

<!-- @compile_log[23] -->
TRACE CLEARED · STATUS GHOST [0.000000ms]
