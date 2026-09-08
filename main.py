from python_app.app import app


def main():
    import os
    import uvicorn

    uvicorn.run("python_app.app:app", host="0.0.0.0", port=int(os.getenv("PORT", "8080")))


if __name__ == "__main__":
    main()
