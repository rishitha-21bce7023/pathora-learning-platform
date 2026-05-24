# Deploy Pathora

Pathora is best deployed as two services:

- Backend API: Render
- Frontend: Vercel or Netlify
- Database: MongoDB Atlas

The Python compiler uses Pyodide in the browser. No Judge0 API key is required.

## 1. Prepare MongoDB Atlas

1. Create a MongoDB Atlas cluster.
2. Create a database user.
3. Allow network access from your deployment provider.
4. Copy the connection string for `MONGODB_URI`.

## 2. Deploy Backend On Render

You can use the included `render.yaml`, or create a Render Web Service manually.

Manual settings:

- Root directory: `server`
- Build command: `npm install`
- Start command: `npm start`
- Health check path: `/api/health`

Environment variables:

```env
NODE_ENV=production
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=generate_a_long_random_secret
CLIENT_URL=https://your-frontend-domain.vercel.app
```

For multiple frontend origins, separate them with commas:

```env
CLIENT_URL=https://your-app.vercel.app,https://your-custom-domain.com
```

PDF notes are stored in the local `uploads` folder. On Render, add a persistent disk if you want uploaded notes to survive redeploys/restarts.

## 3. Deploy Frontend On Vercel

Create a Vercel project from this repo.

Settings:

- Root directory: `client`
- Build command: `npm run build`
- Output directory: `dist`

Environment variable:

```env
VITE_API_URL=https://your-render-backend.onrender.com/api
```

After the frontend deploys, copy the Vercel URL back into Render as `CLIENT_URL`, then redeploy/restart the backend.

## 4. Deploy Frontend On Netlify

Settings:

- Base directory: `client`
- Build command: `npm run build`
- Publish directory: `client/dist`

Environment variable:

```env
VITE_API_URL=https://your-render-backend.onrender.com/api
```

## 5. Verify Production

1. Open the frontend URL.
2. Register and log in.
3. Confirm `/api/health` works on the backend URL.
4. Open Courses and Roadmap.
5. Run `print("Hello Pathora")` in the compiler.
6. Upload a PDF note from admin.
7. Open and download the uploaded note.
