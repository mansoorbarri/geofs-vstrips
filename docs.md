# vstrips Documentation

GeoFS Virtual Strips - A real-time ATC Flight Strip Management System for virtual aviation events.

---

## Controller Guide

### Getting Started

1. Sign in with your Discord account at the login page
2. If you don't have controller access, message **xyzmani** on Discord
3. Once approved, you'll be redirected to the airport selector

### Accessing the ATC Board

From the homepage, select an airport from the dropdown to open its ATC board. Each board displays flights organized into 6 sectors.

### Flight Strip Sectors

Flights progress through these sectors during their journey:

| Sector | Color | Description |
|--------|-------|-------------|
| **Delivery** | Gray | Initial clearance - pilot just filed |
| **Ground** | Blue | Taxi clearance issued |
| **Tower** | Green | Takeoff/landing clearance |
| **Departure** | Purple | Climbing to cruise altitude |
| **Approach** | Indigo | Descending to destination |
| **Control** | Red | Cruise/handoff between sectors |

### Flight Strip Information

Each strip displays:
- **Callsign** - Flight identifier (e.g., DAL123)
- **Status badge** - Current sector
- **Aircraft type** - e.g., A320, B738
- **GeoFS callsign** - Pilot's in-game username
- **Discord username** - For coordination
- **Departure time** - Estimated departure (e.g., 1720)
- **Squawk code** - 4-digit transponder code (editable)
- **Altitude** - Flight level (e.g., FL350)
- **Speed** - Mach number (e.g., 0.82)
- **Route** - Collapsible section with waypoints
- **Notes** - Collapsible section for controller annotations

### Managing Flights

#### Moving Flights Between Sectors

**Click method:** Click on a flight strip to cycle it to the next sector in order:
```
Delivery → Ground → Tower → Departure → Approach → Control → Delivery
```

**Drag and drop:** Drag any flight strip and drop it into the desired sector column.

#### Editing Flights

Hover over a flight strip to reveal action buttons:
- **Edit** - Opens a dialog to modify all flight details
- **Delete** - Removes the flight from the board
- **RadarThing** - Opens live radar view in a new window

#### Editing Squawk Codes

Click directly on the squawk code to edit it inline. Press Enter to save or Escape to cancel.

#### Adding Notes

Click the notes section on a flight strip to expand and add controller annotations. These are visible to all controllers.

### Bulk Operations

Use the checkbox on each flight strip to select multiple flights. The header displays bulk action buttons:

| Action | Description |
|--------|-------------|
| **Select All** | Select all flights on the current board |
| **Clear Selection** | Deselect all flights |
| **Export Selected** | Download selected flights as JSON |
| **Delete Selected** | Remove all selected flights |
| **Transfer Selected** | Move flights to a different airport/sector |

### Import/Export

**Importing flights:**
1. Click the Import JSON button
2. Select a JSON file containing flight data
3. Flights are validated and added to the board

**Exporting flights:**
1. Select flights using checkboxes
2. Click Export Selected
3. A JSON file downloads with the flight data

### All Flights View

Access `/all-flights` to view every flight across all active airports. This page provides:
- Global overview of all event traffic
- Same controls as individual airport boards
- Useful for coordinating handoffs between airports

### Real-Time Updates

The indicator in the header shows:
- **Last update time** - When data was last synced
- **Connection status** - WebSocket connection state

All changes sync instantly across all connected controllers.

### Creating New Flights

Click "Create Flight Strip" to open the flight filing form in a new tab. This is useful when a pilot needs to file while already on frequency.

---

## Admin Guide

Access the admin dashboard at `/admin`. You must have admin privileges to view this page.

### Event Rules Tab

#### Event Live Toggle

Control whether pilots can file flight plans:
- **ON** - Event is active, pilots can file
- **OFF** - Event is offline, filing is disabled

#### Airport Configuration

**Select Active Airports:**
1. Use the search box to find airports by name or ICAO code
2. Click airports to add them to the active list
3. Selected airports appear as badges below
4. Click the X on a badge to remove an airport

**Airport Selection Mode:**
- **CUSTOM** - Pilots choose which airport to file with from the active list
- **FIXED** - All pilots file to a single pre-selected airport

#### Flight Plan Field Configuration

Each field can be set to one of two modes:

| Mode | Behavior |
|------|----------|
| **CUSTOM** | Pilots enter their own value |
| **FIXED** | Admin sets a locked value, pilots see read-only field |

**Configurable fields:**
- **Departure Airport** - Origin ICAO code
- **Arrival Airport** - Destination ICAO code
- **Departure Time** - Time in 24hr format (e.g., 1720)
- **Flight Route** - Navigation waypoints

When FIXED mode is selected, enter the value that all flight plans will use.

#### Saving Changes

Click **Save** or **Push** to apply your configuration. Changes take effect immediately on the filing form.

### Controllers Tab

Manage user roles and permissions.

#### Viewing Users

The user list displays all registered accounts with their:
- Username
- Email
- Current roles (controller/admin status)

Use the search/filter to find specific users.

#### Managing Roles

**Promoting to Controller:**
- Grants access to ATC boards
- User can manage flight strips

**Promoting to Admin:**
- Grants access to admin dashboard
- User can configure events and manage other users

**Demoting Users:**
- Removes controller or admin privileges
- User loses access to restricted pages

### Flight Management

As an admin, you have full access to all controller features:
- View and manage flights on any airport board
- Use the All Flights page for global oversight
- Perform bulk operations across airports
- No restrictions on modifications

### Event Setup Checklist

Before an event:

1. Configure active airports for the event
2. Set airport mode (CUSTOM or FIXED)
3. Lock any required fields (departure, arrival, time, route)
4. Verify controllers have been granted access
5. Toggle Event Live to ON when ready

After an event:

1. Toggle Event Live to OFF
2. Export flight data if needed for records
3. Clear flights from boards if necessary

---

## Reference

### Flight Status Flow

```
┌──────────┐    ┌──────────┐    ┌──────────┐
│ Delivery │ →  │  Ground  │ →  │  Tower   │
└──────────┘    └──────────┘    └──────────┘
                                     │
     ┌───────────────────────────────┘
     ▼
┌──────────┐    ┌──────────┐    ┌──────────┐
│Departure │ →  │ Approach │ →  │ Control  │
└──────────┘    └──────────┘    └──────────┘
```

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Enter | Save inline edit (squawk) |
| Escape | Cancel inline edit |

### JSON Import Format

```json
[
  {
    "callsign": "DAL123",
    "aircraft_type": "A320",
    "departure": "KJFK",
    "arrival": "KLAX",
    "departure_time": "1720",
    "altitude": "FL350",
    "speed": "0.82",
    "route": "MERIT J64 AMBOY",
    "geofs_callsign": "PilotName",
    "status": "delivery"
  }
]
```

Accepted field aliases:
- `aircraft` or `aircraft_type`
- `arrival` or `destination`

### Squawk Code Format

Standard 4-digit octal transponder codes (0000-7777).

Common codes:
- **7500** - Hijacking
- **7600** - Radio failure
- **7700** - Emergency

### ICAO Airport Codes

Always use 4-letter ICAO codes (e.g., KJFK, EGLL, LFPG) rather than IATA codes.

---

## Troubleshooting

**Can't access controller pages:**
- Ensure you're signed in
- Verify you have controller role (contact xyzmani on Discord)

**Flights not updating:**
- Check the real-time indicator for connection status
- Refresh the page if disconnected

**Filing form fields are locked:**
- Admin has set those fields to FIXED mode for the event
- Contact admin if you need different values

**Duplicate callsign error:**
- A flight with that callsign already exists
- Use a different callsign or find and delete the existing flight
