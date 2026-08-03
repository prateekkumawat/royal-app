from flask import Flask, request, render_template
from mysql.connector import connect, Error
import os

app = Flask(__name__)


def get_db_config(database=None):
    config = {
        'host': os.getenv('DB_HOST') or os.getenv('MYSQL_DATABASE_HOST') or 'localhost',
        'port': int(os.getenv('DB_PORT') or os.getenv('MYSQL_PORT') or 3306),
        'user': os.getenv('DB_USER') or os.getenv('MYSQL_USER') or 'root',
        'password': os.getenv('DB_PASSWORD') or os.getenv('MYSQL_PASSWORD') or '',
        'charset': 'utf8mb4',
        'autocommit': True,
    }
    if database:
        config['database'] = database
    return config


def get_connection(database=None):
    return connect(**get_db_config(database))


def init_phonebook_db():
    db_name = os.getenv('DB_NAME') or os.getenv('MYSQL_DATABASE') or 'phonebook'
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(f'CREATE DATABASE IF NOT EXISTS `{db_name}`')
    cursor.execute(f'USE `{db_name}`')
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS phonebook (
            id INT NOT NULL AUTO_INCREMENT,
            name VARCHAR(100) NOT NULL,
            number VARCHAR(100) NOT NULL,
            PRIMARY KEY (id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """
    )
    cursor.close()
    conn.close()


def insert_person(name, number):
    db_name = os.getenv('DB_NAME') or os.getenv('MYSQL_DATABASE') or 'phonebook'
    conn = get_connection(db_name)
    cursor = conn.cursor(buffered=True)
    normalized_name = name.strip().lower()

    cursor.execute('SELECT name FROM phonebook WHERE LOWER(name) = %s', (normalized_name,))
    row = cursor.fetchone()
    if row is not None:
        cursor.close()
        conn.close()
        return f"Person with name {row[0].title()} already exits."

    cursor.execute('INSERT INTO phonebook (name, number) VALUES (%s, %s)', (normalized_name, number))
    cursor.close()
    conn.close()
    return f'Person {name.strip().title()} added to Phonebook successfully'


def update_person(name, number):
    db_name = os.getenv('DB_NAME') or os.getenv('MYSQL_DATABASE') or 'phonebook'
    conn = get_connection(db_name)
    cursor = conn.cursor(buffered=True)
    normalized_name = name.strip().lower()

    cursor.execute('SELECT id, name FROM phonebook WHERE LOWER(name) = %s', (normalized_name,))
    row = cursor.fetchone()
    if row is None:
        cursor.close()
        conn.close()
        return f'Person with name {name.strip().title()} does not exist.'

    cursor.execute('UPDATE phonebook SET name=%s, number=%s WHERE id=%s', (row[1], number, row[0]))
    cursor.close()
    conn.close()
    return f'Phone record of {name.strip().title()} is updated successfully'


def delete_person(name):
    db_name = os.getenv('DB_NAME') or os.getenv('MYSQL_DATABASE') or 'phonebook'
    conn = get_connection(db_name)
    cursor = conn.cursor(buffered=True)
    normalized_name = name.strip().lower()

    cursor.execute('SELECT id, name FROM phonebook WHERE LOWER(name) = %s', (normalized_name,))
    row = cursor.fetchone()
    if row is None:
        cursor.close()
        conn.close()
        return f'Person with name {name.strip().title()} does not exist, no need to delete.'

    cursor.execute('DELETE FROM phonebook WHERE id=%s', (row[0],))
    cursor.close()
    conn.close()
    return f'Phone record of {name.strip().title()} is deleted from the phonebook successfully'


@app.route('/add', methods=['GET', 'POST'])
def add_record():
    if request.method == 'POST':
        name = request.form['username']
        if name is None or name.strip() == '':
            return render_template('add-update.html', not_valid=True, message='Invalid input: Name can not be empty', show_result=False, action_name='save', developer_name='Devenes')
        if name.isdecimal():
            return render_template('add-update.html', not_valid=True, message='Invalid input: Name of person should be text', show_result=False, action_name='save', developer_name='Devenes')

        phone_number = request.form['phonenumber']
        if phone_number is None or phone_number.strip() == '':
            return render_template('add-update.html', not_valid=True, message='Invalid input: Phone number can not be empty', show_result=False, action_name='save', developer_name='Devenes')
        if not phone_number.isdecimal():
            return render_template('add-update.html', not_valid=True, message='Invalid input: Phone number should be in numeric format', show_result=False, action_name='save', developer_name='Devenes')

        result = insert_person(name, phone_number)
        return render_template('add-update.html', show_result=True, result=result, not_valid=False, action_name='save', developer_name='Devenes')
    return render_template('add-update.html', show_result=False, not_valid=False, action_name='save', developer_name='Devenes')


@app.route('/update', methods=['GET', 'POST'])
def update_record():
    if request.method == 'POST':
        name = request.form['username']
        if name is None or name.strip() == '':
            return render_template('add-update.html', not_valid=True, message='Invalid input: Name can not be empty', show_result=False, action_name='update', developer_name='Devenes')
        phone_number = request.form['phonenumber']
        if phone_number is None or phone_number.strip() == '':
            return render_template('add-update.html', not_valid=True, message='Invalid input: Phone number can not be empty', show_result=False, action_name='update', developer_name='Devenes')
        if not phone_number.isdecimal():
            return render_template('add-update.html', not_valid=True, message='Invalid input: Phone number should be in numeric format', show_result=False, action_name='update', developer_name='Devenes')

        result = update_person(name, phone_number)
        return render_template('add-update.html', show_result=True, result=result, not_valid=False, action_name='update', developer_name='Devenes')
    return render_template('add-update.html', show_result=False, not_valid=False, action_name='update', developer_name='Devenes')


@app.route('/delete', methods=['GET', 'POST'])
def delete_record():
    if request.method == 'POST':
        name = request.form['username']
        if name is None or name.strip() == '':
            return render_template('delete.html', not_valid=True, message='Invalid input: Name can not be empty', show_result=False, developer_name='Devenes')
        result = delete_person(name)
        return render_template('delete.html', show_result=True, result=result, not_valid=False, developer_name='Devenes')
    return render_template('delete.html', show_result=False, not_valid=False, developer_name='Devenes')


@app.route('/', methods=['GET', 'POST'])
def find_records():
    return render_template('index.html', show_result=False, developer_name='Devenes')


if __name__ == '__main__':
    init_phonebook_db()
    app.run(host='0.0.0.0', port=80)
