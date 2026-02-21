# Admin Guide

This section is for users with `Admin` access.

## Access

- Open `/admin`.
- You must have admin permission (`isAdmin`).

## Event Rules

Use the **Event Rules** tab to control filing behavior.

### Event Live

- `ON`: pilots can file flights.
- `OFF`: filing is blocked.

### Airport Configuration

- Search and add active airports.
- Set mode:
  - `CUSTOM`: pilot chooses from active list
  - `FIXED`: one forced airport for all filings

### Field Locking

Each field can be:
- `User Controlled` (CUSTOM)
- `Locked Value` (FIXED)

Configurable fields:
- Departure
- Arrival
- Time
- Route

### Publish Changes

After changing rules, click **Push Config to Live Site**.

## Controllers Management

In the **Controllers** tab, you can:
- Search users
- Grant/revoke controller role

Rules:
- You cannot toggle your own controller role.

## Suggested Runbook

Before event:
1. Configure airports and modes.
2. Verify field locks.
3. Confirm controller roster.
4. Turn `Event Live` ON.

After event:
1. Turn `Event Live` OFF.
2. Clean up temporary controller access.
