# Deploying to GitHub Pages

This guide outlines the steps to deploy your Regex Cleaner & Formulator app directly to **GitHub Pages** using GitHub Actions.

---

## Step 1: Create a GitHub Repository and Push Code

1. Log in to your GitHub account and create a **new repository** (e.g., `regex-cleaner-formulator`).
2. In your local workspace terminal, initialize a git repository and push your code:
   ```bash
   # Initialize Git
   git init

   # Add all files (including the .github workflow directory)
   git add .

   # Commit changes
   git commit -m "chore: setup github pages automated deployment"

   # Rename branch to main
   git branch -M main

   # Add your GitHub remote repository link (replace with your repository url)
   git remote add origin https://github.com/your-username/regex-cleaner-formulator.git

   # Push to GitHub
   git push -u origin main
   ```

---

## Step 2: Configure GitHub Pages to Use GitHub Actions

By default, GitHub Pages looks for static files on a branch. To use our automated build workflow:

1. Navigate to your repository page on **GitHub.com**.
2. Click on the **Settings** tab at the top.
3. Under the **Code and automation** section in the left sidebar, click on **Pages**.
4. In the **Build and deployment** section, look for **Source**.
5. Change the dropdown selection from **Deploy from a branch** to **GitHub Actions**.

*Once selected, you do not need to configure anything else on GitHub. The action workflow we created will take care of the rest!*

---

## Step 3: Deployment & Automated Updates

- **Automatic Deploys:** Whenever you push code to the `main` or `master` branch on GitHub, the workflow inside `.github/workflows/deploy.yml` will automatically launch.
- **Monitoring Builds:** You can monitor the progress of your deployment in the **Actions** tab of your GitHub repository.
- **Viewing the Live App:** Once the build is complete, the workflow will output a URL (usually `https://your-username.github.io/regex-cleaner-formulator/`) where your app is live.

---

## How it Works Under the Hood

### 1. Relative Asset Paths (`vite.config.ts`)
We have configured `base: './'` in `vite.config.ts`. This tells Vite to generate relative links for all compiled assets, CSS files, and JS modules. This ensures the app loads perfectly under GitHub Pages subpaths (e.g. `https://username.github.io/repo-name/`) without requiring you to hardcode your repository name.

### 2. Static Hosting Limitations & AI Feature
- **Static Hosting:** GitHub Pages is a static file hosting service. It does not run dynamic backend servers (like Node.js / Express).
- **AI Feature:** The "AI Regex Formulation" module requires a backend server to securely proxy calls and authenticate with the Gemini API (using your server secret `GEMINI_API_KEY`).
- **Our Solution:** We added static host detection directly to the frontend. When running on GitHub Pages, the AI module will gracefully show an informative warning badge explaining that the AI features require a server. 
- **Offline / Local Execution:** To use the AI generation, you can clone the repository locally and run `npm run dev` with your `GEMINI_API_KEY` defined in `.env`.
- **Fully Functional Features:** All other core features of your app, including the **Preset Rules**, **Custom Regex Rule Editor**, **All On / All Off Toggles**, **Multi-Color Live Highlights**, and **Interactive Side-by-Side Diff Comparison** are computed 100% client-side in the browser and will work seamlessly on GitHub Pages.
