from flask import Flask, render_template, request, redirect, url_for, flash
import tempfile
import os
import s3access

app = Flask(__name__)
app.secret_key = os.environ.get('FLASK_SECRET', 'dev-secret')


def make_client_from_form(form):
    access = form.get('access_key') or None
    secret = form.get('secret_key') or None
    region = form.get('region') or None
    return s3access.create_s3_client(aws_access_key_id=access,
                                     aws_secret_access_key=secret,
                                     region_name=region)


@app.route('/', methods=['GET'])
def index():
    return render_template('index.html', keys=None)


@app.route('/list', methods=['POST'])
def list_objects():
    bucket = request.form.get('bucket')
    if not bucket:
        flash('Bucket is required', 'error')
        return redirect(url_for('index'))
    try:
        client = make_client_from_form(request.form)
        keys = s3access.list_objects(client, bucket)
    except Exception as e:
        flash(f'List failed: {e}', 'error')
        keys = None
    return render_template('index.html', keys=keys, bucket=bucket,
                           access_key=request.form.get('access_key', ''),
                           secret_key=request.form.get('secret_key', ''),
                           region=request.form.get('region', ''))


@app.route('/upload', methods=['POST'])
def upload():
    bucket = request.form.get('bucket')
    if 'file' not in request.files or not bucket:
        flash('No file or bucket provided', 'error')
        return redirect(url_for('index'))
    file = request.files['file']
    if file.filename == '':
        flash('No selected file', 'error')
        return redirect(url_for('index'))

    # Save to a temp file then upload
    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        file.save(tmp.name)
        key = os.path.basename(file.filename)
        try:
            client = make_client_from_form(request.form)
            s3access.upload_file(client, bucket, key, tmp.name)
            flash(f'Uploaded {key}', 'success')
        except Exception as e:
            flash(f'Upload failed: {e}', 'error')
        finally:
            try:
                os.unlink(tmp.name)
            except Exception:
                pass

    return redirect(url_for('index'))


@app.route('/presign', methods=['GET'])
def presign():
    # Generate a presigned GET URL for direct download
    bucket = request.args.get('bucket')
    key = request.args.get('key')
    access = request.args.get('access_key') or None
    secret = request.args.get('secret_key') or None
    region = request.args.get('region') or None
    if not bucket or not key:
        flash('Bucket and key required', 'error')
        return redirect(url_for('index'))
    try:
        client = s3access.create_s3_client(aws_access_key_id=access,
                                           aws_secret_access_key=secret,
                                           region_name=region)
        url = client.generate_presigned_url('get_object', Params={'Bucket': bucket, 'Key': key}, ExpiresIn=3600)
        return redirect(url)
    except Exception as e:
        flash(f'Presign failed: {e}', 'error')
        return redirect(url_for('index'))


if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)
