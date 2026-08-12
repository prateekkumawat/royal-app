import threading
import os
import tkinter as tk
from tkinter import ttk, filedialog, messagebox

import s3access


class S3GuiApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title('S3 Upload / Download UI')
        self.geometry('700x450')

        self.client = None

        self._build_ui()

    def _build_ui(self):
        frm = ttk.Frame(self)
        frm.pack(fill='both', expand=True, padx=10, pady=10)

        # Credentials frame
        cred = ttk.LabelFrame(frm, text='AWS Credentials / Bucket')
        cred.pack(fill='x')

        ttk.Label(cred, text='Access Key:').grid(row=0, column=0, sticky='w')
        self.access_entry = ttk.Entry(cred, width=40)
        self.access_entry.grid(row=0, column=1, padx=4, pady=2)

        ttk.Label(cred, text='Secret Key:').grid(row=1, column=0, sticky='w')
        self.secret_entry = ttk.Entry(cred, width=40, show='*')
        self.secret_entry.grid(row=1, column=1, padx=4, pady=2)

        ttk.Label(cred, text='Region:').grid(row=0, column=2, sticky='w')
        self.region_entry = ttk.Entry(cred, width=20)
        self.region_entry.grid(row=0, column=3, padx=4, pady=2)

        ttk.Label(cred, text='Bucket:').grid(row=1, column=2, sticky='w')
        self.bucket_entry = ttk.Entry(cred, width=20)
        self.bucket_entry.grid(row=1, column=3, padx=4, pady=2)

        self.connect_btn = ttk.Button(cred, text='Connect', command=self.connect)
        self.connect_btn.grid(row=0, column=4, rowspan=2, padx=8)

        # Objects frame
        objs = ttk.LabelFrame(frm, text='Bucket Objects')
        objs.pack(fill='both', expand=True, pady=8)

        self.listbox = tk.Listbox(objs)
        self.listbox.pack(side='left', fill='both', expand=True, padx=(6,0), pady=6)

        scroll = ttk.Scrollbar(objs, orient='vertical', command=self.listbox.yview)
        scroll.pack(side='left', fill='y', pady=6)
        self.listbox.config(yscrollcommand=scroll.set)

        right = ttk.Frame(objs)
        right.pack(side='left', fill='y', padx=8, pady=6)

        self.refresh_btn = ttk.Button(right, text='Refresh', command=self.refresh_list)
        self.refresh_btn.pack(fill='x', pady=4)

        self.upload_btn = ttk.Button(right, text='Upload File', command=self.upload_file)
        self.upload_btn.pack(fill='x', pady=4)

        self.download_btn = ttk.Button(right, text='Download Selected', command=self.download_file)
        self.download_btn.pack(fill='x', pady=4)

        self.progress = ttk.Progressbar(right, mode='indeterminate')
        self.progress.pack(fill='x', pady=(12,0))

        self._set_ui_state(disabled=True)

    def _set_ui_state(self, disabled: bool):
        state = 'disabled' if disabled else 'normal'
        for w in (self.refresh_btn, self.upload_btn, self.download_btn, self.listbox):
            try:
                w.config(state=state)
            except Exception:
                pass

    def connect(self):
        access = self.access_entry.get().strip() or None
        secret = self.secret_entry.get().strip() or None
        region = self.region_entry.get().strip() or None
        bucket = self.bucket_entry.get().strip()

        if not bucket:
            messagebox.showwarning('Bucket required', 'Please enter a bucket name.')
            return

        try:
            self.client = s3access.create_s3_client(aws_access_key_id=access,
                                                    aws_secret_access_key=secret,
                                                    region_name=region)
            # try a quick call to validate
            # Listing will happen in refresh_list
            self._set_ui_state(disabled=False)
            messagebox.showinfo('Connected', 'S3 client created. Click Refresh to list objects.')
        except Exception as e:
            messagebox.showerror('Connection failed', str(e))

    def refresh_list(self):
        if not self.client:
            messagebox.showwarning('Not connected', 'Click Connect first.')
            return
        bucket = self.bucket_entry.get().strip()
        if not bucket:
            messagebox.showwarning('Bucket required', 'Please enter a bucket name.')
            return

        def task():
            try:
                keys = s3access.list_objects(self.client, bucket)
            except Exception as e:
                self.after(0, lambda: messagebox.showerror('List failed', str(e)))
                return
            def update():
                self.listbox.delete(0, tk.END)
                for k in keys:
                    self.listbox.insert(tk.END, k)
            self.after(0, update)

        threading.Thread(target=task, daemon=True).start()

    def upload_file(self):
        if not self.client:
            messagebox.showwarning('Not connected', 'Click Connect first.')
            return
        bucket = self.bucket_entry.get().strip()
        if not bucket:
            messagebox.showwarning('Bucket required', 'Please enter a bucket name.')
            return

        path = filedialog.askopenfilename(title='Select file to upload')
        if not path:
            return

        key = os.path.basename(path)

        def task():
            try:
                self.after(0, lambda: self.progress.start())
                s3access.upload_file(self.client, bucket, key, path)
                self.after(0, lambda: messagebox.showinfo('Upload', f'Uploaded {key}'))
                self.after(0, self.refresh_list)
            except Exception as e:
                self.after(0, lambda: messagebox.showerror('Upload failed', str(e)))
            finally:
                self.after(0, lambda: self.progress.stop())

        threading.Thread(target=task, daemon=True).start()

    def download_file(self):
        if not self.client:
            messagebox.showwarning('Not connected', 'Click Connect first.')
            return
        sel = self.listbox.curselection()
        if not sel:
            messagebox.showwarning('Select object', 'Please select an object to download.')
            return
        key = self.listbox.get(sel[0])
        bucket = self.bucket_entry.get().strip()

        save_path = filedialog.asksaveasfilename(initialfile=os.path.basename(key), title='Save as')
        if not save_path:
            return

        def task():
            try:
                self.after(0, lambda: self.progress.start())
                s3access.download_file(self.client, bucket, key, save_path)
                self.after(0, lambda: messagebox.showinfo('Download', f'Downloaded {key}'))
            except Exception as e:
                self.after(0, lambda: messagebox.showerror('Download failed', str(e)))
            finally:
                self.after(0, lambda: self.progress.stop())

        threading.Thread(target=task, daemon=True).start()


if __name__ == '__main__':
    app = S3GuiApp()
    app.mainloop()
