# S3 Upload / Download UI (Tkinter)

Minimal Python GUI to upload and download files to S3 using boto3.

Requirements
- Python 3.8+
- See `requirements.txt` ([requirements.txt](requirements.txt))

Quick start

Install dependencies:

```bash
python -m pip install -r requirements.txt
```

Run the Web UI (Flask):

```bash
python -m pip install -r requirements.txt
python s3_web.py
```

Usage
- Enter AWS credentials (or leave blank to use default credential chain).
- Enter the bucket name and optional region.
- Click `Connect`, then `Refresh` to list objects.
- Use `Upload File` to pick a file and upload it to the bucket (key = filename).
- Select an object and click `Download Selected` to save it locally.

Notes
- This is a small example for local testing. For production use, add better
  error handling, support for prefixes, and secure credential handling.
