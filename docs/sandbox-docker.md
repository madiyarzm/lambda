# Sandbox: Docker and Allowed Packages

How to run student code in Docker and how to allow `import` / `pip`-style packages.

---

## 1. When to use Docker

- **Subprocess (default):** no Docker needed; code runs in a separate process with restricted builtins. Good for small groups and trusted users.
- **Docker:** stronger isolation (network off, read-only FS, memory limit). Use when you want a real sandbox or plan to allow extra packages.

---

## 2. Step-by-step: enable Docker execution

### Step 1: Install Docker

- On your server or laptop, install [Docker Engine](https://docs.docker.com/engine/install/).
- Ensure the user that runs the Lambda app can run `docker` (e.g. in the `docker` group, or run the app as root only in dev).

### Step 2: Build the sandbox image

From the **project root** (where `docker/` lives):

```bash
# No extra packages (only stdlib + what you add later)
docker build -f docker/sandbox.Dockerfile -t lambda-sandbox:latest .

# With allowed packages (e.g. numpy, pandas, requests)
docker build -f docker/sandbox.Dockerfile \
  --build-arg ALLOWED_PACKAGES="numpy pandas requests" \
  -t lambda-sandbox:latest .
```

The image name (`lambda-sandbox:latest`) is the default; you can change it and set `SANDBOX_DOCKER_IMAGE` (see below).

### Step 3: Configure the app

In `.env` (or environment):

```env
SANDBOX_USE_DOCKER=true
# Optional if you use a different image name:
# SANDBOX_DOCKER_IMAGE=my-sandbox:v1
```

### Step 4: Run the app

Start the backend as usual. When a user runs or submits code, the app will run `docker run ...` with the code mounted and capture stdout/stderr. No code runs in the main app process.

---

## 3. Allowing imports and “pip install” for students

### Safe approach: pre-install packages in the image

Students cannot run arbitrary `pip install` in the sandbox (that would be a security risk). Instead, **you** choose which packages are available by building the image with those packages installed.

- **Build with packages:** use the `ALLOWED_PACKAGES` build-arg when building the Docker image (see Step 2 above). Example: `numpy`, `pandas`, `requests`, `matplotlib`.
- **In code:** students can then `import numpy`, `import pandas`, etc. No `pip install` in their code; the packages are already in the container.

So “allowing pip” in practice means: list the packages you trust, put them in `ALLOWED_PACKAGES`, rebuild the image, and students get those imports.

### If you really want students to run `pip install` themselves

That would require:

1. Running the container **with network** for a short phase where only `pip install -r requirements.txt` (or a fixed command) runs, with a **strict whitelist** of package names (e.g. only `numpy`, `pandas` from PyPI).
2. Then running their code in the same container **with network disabled**, so they can’t use the network from Python.

This is more complex and easy to get wrong (e.g. dependency confusion, malicious packages). For teaching, the recommended approach is: **pre-install a fixed set of packages in the image** and rebuild when you want to add or remove a package.

---

## 4. Summary

| Goal                         | What to do                                                                 |
|-----------------------------|----------------------------------------------------------------------------|
| Use Docker for execution    | Install Docker → build image from `docker/sandbox.Dockerfile` → set `SANDBOX_USE_DOCKER=true`. |
| Allow `import numpy` etc.   | Build image with `--build-arg ALLOWED_PACKAGES="numpy pandas ..."`.        |
| Change image name           | Set `SANDBOX_DOCKER_IMAGE=your-image:tag` in env.                          |

The Docker executor runs each job in a new container with `--network=none`, `--read-only`, and a memory limit; code is mounted from a temp dir and discarded after the run.
