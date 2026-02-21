# vstrips - GeoFS Virtual Strips

A web-based Air Traffic Control (ATC) system designed for the GeoFS Events community. This application provides pilots with a simple way to file flight plans and gives controllers a real-time, dynamic board to manage flight strips, update statuses, and track aircraft movements.

This project was built from scratch to address the need for a modern, reliable, and real-time ATC strips solution for virtual pilots and controllers.

## Todo 
- [ ] allow users to edit flight details if they are in delivery. 

---

### ✨ Features

* **Pilot Flight Filing:** A dedicated, user-friendly form for pilots to file their flight plans.
* **Dynamic ATC Board:** A real-time board that displays flight strips for a specific airport, with automatic updates as new flights are filed or existing ones are modified.
* **Controller Tools:** Controllers can create new flight strips, edit existing flight details, update an aircraft's status (e.g., Ground, Tower, Approach), and delete flights.
* **Real-time Data:** Leverages SWR (Stale-While-Revalidate) to provide real-time updates without constant manual page refreshes.
* **Database-Driven:** Stores all flight information persistently in a PostgreSQL database using Prisma ORM.
* **Type-Safe Development:** Built entirely with TypeScript for a robust and maintainable codebase.

---

### 💻 Technology Stack

* **Framework:** [Next.js 14](https://nextjs.org/) (App Router, Server Actions, API Routes)
* **UI Components:** [Shadcn/ui](https://ui.shadcn.com/) (A collection of accessible, reusable components)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **Database:** [PostgreSQL](https://www.postgresql.org/)
* **ORM:** [Prisma](https://www.prisma.io/)
* **Data Fetching:** [SWR](https://swr.vercel.app/)
* **Language:** [TypeScript](https://www.typescriptlang.org/)

---

### 🚀 Getting Started

Follow these steps to set up and run the project locally.

#### Prerequisites

* Node.js (LTS version)
* Bun
* A running PostgreSQL database instance

#### 1. Clone the Repository

```bash
git clone https://github.com/mansoorbarri/geofs-vstrips
cd geofs-vstrips
```

#### 2. Install Dependencies

```bash
bun install
```

#### 3. Create a .env file

Copy the .env.example file to .env and update the values as needed.

```bash
cp .env.example .env
```

#### 4. Setup the Database

Use Prima to push the database schema and generate the client.

```bash
bun db:push
```

#### 5. Run the Application

```bash
bun dev
```

The application will be available at http://localhost:3000.

### Usage 

- **File a Flight:** Navigate to `/file-flight` to access the pilot flight filing form.

- **View the ATC Board:** Navigate to `/board/[airport-code]` (e.g., `/board/YSSY`) to view the ATC board for a specific airport.

### Contributing

Contributions are welcome! If you have any ideas, bug reports, or feature requests, please open an issue or submit a pull request.
