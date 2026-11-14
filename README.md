# Broadcast Podcast

A responsive podcast studio website with Home, Services, Gallery, Pricing, Booking, Reviews, and Contact pages. The frontend uses HTML, CSS, and modern JavaScript. The backend uses Express and MongoDB.

## Features

- **Responsive Studio Website**: Home, Services, Gallery, Pricing, Booking, Reviews, and Contact.
- **Vercel Ready**: Preconfigured with `vercel.json` and `api/index.js` serverless function for zero-config Vercel deployment.
- **RESTful API**: `/api/services` (catalog) and `/api/bookings` (booking requests with MongoDB persistence).
- **Preview Mode**: Operates out of the box using static catalog data even without a database connection.
- **MongoDB Integration**: When `MONGO_URI` is provided, bookings are saved and services are seeded automatically.

---

## Run Locally

Requires Node.js 22 or newer.

```powershell
# From the project root:
npm install
npm run build
npm start
```

Or from the backend folder:
```powershell
cd backend
npm install
npm start
```

Open [http://localhost:5050](http://localhost:5050). The site starts in preview mode so you can browse every page and check the booking form before connecting a database.

---

## Enable Bookings

1. Create a `.env` file inside `backend/` (or set `MONGO_URI` environment variable).
2. Set `MONGO_URI` to your MongoDB connection string (e.g. from MongoDB Atlas):
   ```env
   MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/broadcast_podcast?retryWrites=true&w=majority
   PORT=5050
   ```
3. Restart the server. It automatically seeds the initial services into MongoDB and saves new booking requests to the `bookings` collection.

---

## Deployment to Vercel

### Fullstack on Vercel (Recommended)
1. Push this repository to GitHub: `https://github.com/SohelRabbani/Broadcast.git`.
2. Go to [Vercel](https://vercel.com) and import the repository.
3. Keep default settings:
   - **Framework Preset**: Other
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
4. In **Environment Variables**, add:
   - `MONGO_URI`: Your MongoDB Atlas connection string.
5. Click **Deploy**. Vercel will deploy the frontend SPA and route `/api/*` to the serverless API handler seamlessly!
